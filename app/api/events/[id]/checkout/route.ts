/**
 * API Route: Créer une session de paiement Stripe pour un événement
 * Supporte les paiements uniques et les abonnements
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getEventById } from '@/lib/directus'
import Stripe from 'stripe'

// Mapping des intervalles vers Stripe
const intervalMap: Record<string, Stripe.PriceCreateParams.Recurring.Interval> = {
  WEEKLY: 'week',
  MONTHLY: 'month',
  YEARLY: 'year',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: eventId } = await params
    const { searchParams } = new URL(req.url)
    const registrationId = searchParams.get('registrationId')

    if (!registrationId) {
      return NextResponse.json(
        { error: 'ID d\'inscription manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'inscription
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire (si l'inscription est liée à un compte)
    // Permettre les inscriptions guest (sans userId) d'accéder au checkout
    if (registration.userId && session?.user && registration.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier si le paiement est requis
    if (!registration.requiresPayment || !registration.paymentAmount) {
      return NextResponse.json(
        { error: 'Cet événement ne nécessite pas de paiement' },
        { status: 400 }
      )
    }

    // Vérifier si déjà payé
    if (registration.paymentId) {
      return NextResponse.json(
        { error: 'Cette inscription a déjà été payée' },
        { status: 400 }
      )
    }

    // Récupérer les infos de l'événement pour le type de paiement
    const event = await getEventById(eventId)
    const isSubscription = event?.payment_type === 'SUBSCRIPTION'
    const interval = event?.subscription_interval || 'MONTHLY'

    // Métadonnées communes
    const metadata = {
      type: 'EVENT_REGISTRATION',
      registrationId: registration.id,
      eventId: registration.eventId,
      eventTitle: registration.eventTitle,
      userId: registration.userId || '',
      contactEmail: registration.email,
      contactName: `${registration.firstName} ${registration.lastName}`,
      contactPhone: registration.phone,
      participationType: registration.participationType,
      numberOfAdults: registration.numberOfAdults.toString(),
      numberOfChildren: registration.numberOfChildren.toString(),
      totalAttendees: (registration.numberOfAdults + registration.numberOfChildren).toString(),
      paymentType: event?.payment_type || 'ONE_TIME',
    }

    let stripeSession: Stripe.Checkout.Session

    if (isSubscription) {
      // Créer une session d'abonnement
      const stripeInterval = intervalMap[interval] || 'month'
      const intervalLabels: Record<string, string> = {
        week: 'semaine',
        month: 'mois',
        year: 'an',
      }

      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'chf',
              product_data: {
                name: `Abonnement: ${registration.eventTitle}`,
                description: `${registration.numberOfAdults} adulte(s), ${registration.numberOfChildren} enfant(s) - Paiement ${intervalLabels[stripeInterval] || 'mensuel'}`,
              },
              unit_amount: Math.round(registration.paymentAmount * 100),
              recurring: {
                interval: stripeInterval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXTAUTH_URL}/membre/evenements?payment=success&subscription=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/membre/paiements?payment=cancelled`,
        customer_email: registration.email,
        metadata,
        subscription_data: {
          metadata,
        },
      })

      console.log('💳 Session Stripe ABONNEMENT créée pour événement:', stripeSession.id)
    } else {
      // Créer une session de paiement unique
      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'chf',
              product_data: {
                name: `Inscription: ${registration.eventTitle}`,
                description: `${registration.numberOfAdults} adulte(s), ${registration.numberOfChildren} enfant(s)`,
              },
              unit_amount: Math.round(registration.paymentAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/membre/evenements?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/membre/paiements?payment=cancelled`,
        customer_email: registration.email,
        metadata,
      })

      console.log('💳 Session Stripe PAIEMENT UNIQUE créée pour événement:', stripeSession.id)
    }

    // Rediriger vers la page de paiement Stripe
    return NextResponse.redirect(stripeSession.url!)
  } catch (error: any) {
    console.error('❌ Erreur création session Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
