/**
 * API Route: Créer une session de paiement Stripe pour un événement
 *
 * Supporte:
 * - Paiement unique pour une inscription (registrationId)
 * - Paiement groupé pour plusieurs inscriptions (registrationIds)
 * - Abonnements récurrents
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getEventById } from '@/lib/content'
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

    // Support pour un seul ID ou plusieurs IDs
    const singleId = searchParams.get('registrationId')
    const multipleIds = searchParams.get('registrationIds')

    // Construire la liste des IDs
    let registrationIds: string[] = []
    if (multipleIds) {
      registrationIds = multipleIds.split(',').filter(id => id.trim())
    } else if (singleId) {
      registrationIds = [singleId]
    }

    if (registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'ID d\'inscription manquant' },
        { status: 400 }
      )
    }

    // Récupérer toutes les inscriptions
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        id: { in: registrationIds },
        eventId, // S'assurer qu'elles appartiennent au même événement
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: 'Inscription(s) non trouvée(s)' },
        { status: 404 }
      )
    }

    // Vérifier que toutes les inscriptions ont été trouvées
    if (registrations.length !== registrationIds.length) {
      const foundIds = registrations.map(r => r.id)
      const missingIds = registrationIds.filter(id => !foundIds.includes(id))
      console.warn('⚠️ Inscriptions non trouvées:', missingIds)
    }

    // Utiliser la première inscription pour les vérifications
    const primaryRegistration = registrations[0]

    // Vérifier que l'utilisateur est le propriétaire (si l'inscription est liée à un compte)
    const hasUserId = registrations.some(r => r.userId)
    if (hasUserId && session?.user) {
      const allBelongToUser = registrations.every(r => !r.userId || r.userId === session.user.id)
      if (!allBelongToUser) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    }

    // Vérifier si le paiement est requis
    const registrationsNeedingPayment = registrations.filter(r => r.requiresPayment && r.paymentAmount && !r.paymentId)

    if (registrationsNeedingPayment.length === 0) {
      return NextResponse.json(
        { error: 'Aucune inscription ne nécessite de paiement ou tout est déjà payé' },
        { status: 400 }
      )
    }

    // Calculer le montant total
    const totalAmount = registrationsNeedingPayment.reduce(
      (sum, r) => sum + (r.paymentAmount || 0),
      0
    )

    // Récupérer les infos de l'événement pour le type de paiement
    const event = await getEventById(eventId)
    const isSubscription = event?.paymentType === 'SUBSCRIPTION'
    const interval = event?.subscriptionInterval || 'MONTHLY'

    // Construire la description des participants
    const participantsList = registrationsNeedingPayment.map(r => {
      if (r.child) {
        return `${r.child.firstName} ${r.child.lastName}`
      }
      return `${r.firstName} ${r.lastName}`
    }).join(', ')

    const totalAdults = registrationsNeedingPayment.reduce((sum, r) => sum + r.numberOfAdults, 0)
    const totalChildren = registrationsNeedingPayment.reduce((sum, r) => sum + r.numberOfChildren, 0)

    // Métadonnées communes - inclure tous les IDs
    const metadata: Record<string, string> = {
      type: 'EVENT_REGISTRATION',
      registrationIds: registrationsNeedingPayment.map(r => r.id).join(','),
      registrationCount: registrationsNeedingPayment.length.toString(),
      eventId: primaryRegistration.eventId || eventId,
      eventTitle: primaryRegistration.eventTitle || '',
      userId: primaryRegistration.userId || '',
      contactEmail: primaryRegistration.email,
      contactName: `${primaryRegistration.firstName} ${primaryRegistration.lastName}`,
      contactPhone: primaryRegistration.phone,
      participationType: registrationsNeedingPayment.length > 1 ? 'CHILDREN_BATCH' : primaryRegistration.participationType,
      numberOfAdults: totalAdults.toString(),
      numberOfChildren: totalChildren.toString(),
      totalAttendees: (totalAdults + totalChildren).toString(),
      paymentType: event?.paymentType || 'ONE_TIME',
      participantsList, // Liste des noms pour l'email
    }

    // Pour rétrocompatibilité - garder registrationId si une seule inscription
    if (registrationsNeedingPayment.length === 1) {
      metadata.registrationId = registrationsNeedingPayment[0].id
    }

    let stripeSession: Stripe.Checkout.Session

    // Description pour Stripe
    const description = registrationsNeedingPayment.length > 1
      ? `${registrationsNeedingPayment.length} participant(s): ${participantsList}`
      : `${totalAdults} adulte(s), ${totalChildren} enfant(s)`

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
                name: `Abonnement: ${primaryRegistration.eventTitle}`,
                description: `${description} - Paiement ${intervalLabels[stripeInterval] || 'mensuel'}`,
              },
              unit_amount: Math.round(totalAmount * 100),
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
        customer_email: primaryRegistration.email,
        metadata,
        subscription_data: {
          metadata,
        },
      })

      console.log('💳 Session Stripe ABONNEMENT créée pour', registrationsNeedingPayment.length, 'inscription(s):', stripeSession.id)
    } else {
      // Créer une session de paiement unique
      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'chf',
              product_data: {
                name: `Inscription: ${primaryRegistration.eventTitle}`,
                description,
              },
              unit_amount: Math.round(totalAmount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/membre/evenements?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/membre/paiements?payment=cancelled`,
        customer_email: primaryRegistration.email,
        metadata,
      })

      console.log('💳 Session Stripe PAIEMENT UNIQUE créée pour', registrationsNeedingPayment.length, 'inscription(s):', stripeSession.id, '- Total:', totalAmount, 'CHF')
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
