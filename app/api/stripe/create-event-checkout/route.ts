/**
 * API Route: Créer une session Stripe Checkout pour un événement
 *
 * Workflow:
 * 1. Récupère l'événement depuis Directus
 * 2. Vérifie que l'événement nécessite un paiement
 * 3. Calcule le montant total (adultes + enfants)
 * 4. Crée la session Stripe
 * 5. Retourne l'URL de paiement
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { directusClient } from '@/lib/directus'
import { readItem } from '@directus/sdk'

// Validation du body
const schema = z.object({
  eventId: z.string().min(1, 'Event ID requis'),
  participationType: z.enum(['INDIVIDUAL', 'FAMILY', 'CHILD']),
  numberOfAdults: z.number().int().min(0).default(1),
  numberOfChildren: z.number().int().min(0).default(0),
  contactName: z.string().min(2, 'Nom requis'),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(10, 'Téléphone requis'),
  participants: z.any().optional(), // JSON des participants
  userId: z.string().optional(), // Si utilisateur connecté
  childId: z.string().optional(), // Si inscription pour un enfant
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // 1. Récupérer l'événement depuis Directus
    const event = await directusClient.request(
      readItem('events', data.eventId, {
        fields: ['id', 'title', 'date_start', 'price', 'child_price', 'requires_payment']
      })
    )

    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      )
    }

    // 2. Vérifier que l'événement nécessite un paiement
    if (!event.requires_payment) {
      return NextResponse.json(
        { error: 'Cet événement ne nécessite pas de paiement' },
        { status: 400 }
      )
    }

    if (!event.price || event.price <= 0) {
      return NextResponse.json(
        { error: 'Prix de l\'événement non configuré' },
        { status: 400 }
      )
    }

    // 3. Calculer le montant total
    const adultPrice = event.price
    const childPrice = event.child_price || event.price // Par défaut = prix adulte

    let totalAmount = 0
    let description = ''

    if (data.participationType === 'INDIVIDUAL') {
      totalAmount = adultPrice
      description = '1 participant adulte'
    } else if (data.participationType === 'CHILD') {
      totalAmount = childPrice
      description = '1 participant enfant'
    } else if (data.participationType === 'FAMILY') {
      const adultsTotal = data.numberOfAdults * adultPrice
      const childrenTotal = data.numberOfChildren * childPrice
      totalAmount = adultsTotal + childrenTotal
      description = `${data.numberOfAdults} adulte(s) + ${data.numberOfChildren} enfant(s)`
    }

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      )
    }

    // 4. Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Inscription - ${event.title}`,
              description: description,
              metadata: {
                eventId: event.id,
                eventTitle: event.title,
              }
            },
            unit_amount: Math.round(totalAmount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      customer_email: data.contactEmail,
      success_url: `${process.env.NEXTAUTH_URL}/evenements/inscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/evenements/${data.eventId}`,
      metadata: {
        type: 'EVENT_REGISTRATION',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date_start || '',
        participationType: data.participationType,
        numberOfAdults: data.numberOfAdults.toString(),
        numberOfChildren: data.numberOfChildren.toString(),
        totalAttendees: (data.numberOfAdults + data.numberOfChildren).toString(),
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        userId: data.userId || '',
        childId: data.childId || '',
        participants: data.participants ? JSON.stringify(data.participants) : '',
      },
      payment_intent_data: {
        metadata: {
          type: 'EVENT_REGISTRATION',
          eventId: event.id,
        }
      }
    })

    console.log('✅ Session Stripe créée:', session.id, 'Montant:', totalAmount, 'CHF')

    // 5. Retourner l'URL de paiement
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      amount: totalAmount,
    })

  } catch (error: any) {
    console.error('❌ Erreur création checkout événement:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
