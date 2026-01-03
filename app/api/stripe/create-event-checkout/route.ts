/**
 * API Route: Créer une session Stripe Checkout pour un événement
 *
 * Workflow:
 * 1. Récupère l'événement depuis la base de données
 * 2. Vérifie que l'événement nécessite un paiement
 * 3. Calcule le montant total (adultes + enfants)
 * 4. Crée la session Stripe
 * 5. Retourne l'URL de paiement
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { getEventById } from '@/lib/content'
import { calculatePrice, type PricingConfig } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'

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
  childIds: z.array(z.string()).optional(), // Si inscription pour plusieurs enfants
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // 1. Récupérer l'événement depuis la base de données
    const event = await getEventById(data.eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      )
    }

    // 2. Vérifier que l'événement nécessite un paiement
    if (event.paymentType === 'FREE') {
      return NextResponse.json(
        { error: 'Cet événement ne nécessite pas de paiement' },
        { status: 400 }
      )
    }

    // Récupérer les prix depuis l'objet pricing ou le champ price simple
    const pricing = event.pricing as PricingConfig | null
    const basePrice = event.price ? Number(event.price) : undefined

    if ((!pricing || !pricing.adultPrice) && (!basePrice || basePrice <= 0)) {
      return NextResponse.json(
        { error: 'Prix de l\'événement non configuré' },
        { status: 400 }
      )
    }

    // 3. Calculer le montant total avec le système de tarification avancée
    const numberOfAdults = data.participationType === 'CHILD' ? 0 : (data.numberOfAdults || 1)
    const numberOfChildren = data.participationType === 'CHILD' ? 1 : (data.numberOfChildren || 0)

    // Fonction helper pour calculer l'âge
    const calculateAge = (birthDate: Date): number => {
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }

    // Récupérer les âges des enfants si childIds fournis (pour childFreeUntilAge)
    let childrenAges: number[] = []
    const allChildIds = data.childIds || (data.childId ? [data.childId] : [])

    if (allChildIds.length > 0) {
      const children = await prisma.child.findMany({
        where: { id: { in: allChildIds } },
        select: { birthDate: true }
      })
      childrenAges = children.map(child => calculateAge(new Date(child.birthDate)))
    }

    const pricingResult = calculatePrice(
      pricing,
      {
        numberOfAdults,
        numberOfChildren,
        childrenAges: childrenAges.length > 0 ? childrenAges : undefined,
        registrationDate: new Date(),
      },
      basePrice
    )

    const totalAmount = pricingResult.total
    const description = pricingResult.breakdown.slice(0, -1).join(', ') // Sans le "Total: X CHF"

    console.log('💰 Calcul pricing Stripe:', pricingResult.breakdown.join(' | '))

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      )
    }

    // 4. Créer la session Stripe Checkout
    const eventId = event.id
    const eventTitle = event.title
    const eventDate = event.date ? event.date.toISOString().split('T')[0] : ''

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Inscription - ${eventTitle}`,
              description: description,
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
        eventId: eventId,
        eventTitle: eventTitle,
        eventDate: eventDate,
        participationType: data.participationType,
        numberOfAdults: numberOfAdults.toString(),
        numberOfChildren: numberOfChildren.toString(),
        totalAttendees: (numberOfAdults + numberOfChildren).toString(),
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        userId: data.userId || '',
        childId: data.childId || '',
        participants: data.participants ? JSON.stringify(data.participants) : '',
        pricingBreakdown: pricingResult.breakdown.join(' | '),
        discountAmount: pricingResult.discountAmount.toString(),
        discountReason: pricingResult.discountReason || '',
      },
      payment_intent_data: {
        metadata: {
          type: 'EVENT_REGISTRATION',
          eventId: eventId,
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
