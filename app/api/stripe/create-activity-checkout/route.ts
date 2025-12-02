/**
 * API Route: Créer une session Stripe Checkout pour une activité
 *
 * Workflow:
 * 1. Récupère l'inscription (Enrollment) via ID ou token
 * 2. Vérifie que l'inscription nécessite un paiement
 * 3. Récupère les infos de l'activité depuis Directus
 * 4. Crée la session Stripe
 * 5. Retourne l'URL de paiement
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { directusClient } from '@/lib/directus'
import { readItem } from '@directus/sdk'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Validation du body
const schema = z.object({
  enrollmentId: z.string().uuid().optional(),
  paymentToken: z.string().optional(), // Pour accès public via lien de paiement
}).refine(data => data.enrollmentId || data.paymentToken, {
  message: 'enrollmentId ou paymentToken requis'
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // 1. Récupérer l'inscription
    let enrollment

    if (data.paymentToken) {
      // Accès via token de paiement (public)
      enrollment = await prisma.enrollment.findUnique({
        where: { paymentToken: data.paymentToken },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          child: { select: { id: true, firstName: true, lastName: true } },
        }
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Lien de paiement invalide' },
          { status: 404 }
        )
      }

      // Vérifier expiration
      if (enrollment.paymentExpiresAt && new Date() > enrollment.paymentExpiresAt) {
        return NextResponse.json(
          { error: 'Ce lien de paiement a expiré' },
          { status: 410 }
        )
      }
    } else {
      // Accès authentifié
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        )
      }

      enrollment = await prisma.enrollment.findFirst({
        where: {
          id: data.enrollmentId,
          userId: session.user.id,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          child: { select: { id: true, firstName: true, lastName: true } },
        }
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Inscription introuvable' },
          { status: 404 }
        )
      }
    }

    // 2. Vérifier que l'inscription nécessite un paiement
    if (!enrollment.requiresPayment) {
      return NextResponse.json(
        { error: 'Cette inscription ne nécessite pas de paiement' },
        { status: 400 }
      )
    }

    if (enrollment.paymentId) {
      return NextResponse.json(
        { error: 'Cette inscription a déjà été payée' },
        { status: 400 }
      )
    }

    if (!enrollment.paymentAmount || enrollment.paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Montant de paiement non configuré' },
        { status: 400 }
      )
    }

    // 3. Récupérer les infos de l'activité depuis Directus
    let activityTitle = enrollment.activityTitle
    let activityDescription = ''

    if (enrollment.activityId) {
      try {
        const activity = await directusClient.request(
          readItem('activities', enrollment.activityId as any, {
            fields: ['id', 'title', 'description']
          })
        ) as any
        if (activity) {
          activityTitle = activity.title || activityTitle
          activityDescription = activity.description || ''
        }
      } catch (e) {
        console.log('⚠️  Impossible de récupérer l\'activité Directus:', e)
      }
    }

    // Déterminer l'email et le nom du contact
    const contactEmail = enrollment.user?.email || ''
    const contactName = enrollment.child
      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
      : `${enrollment.user?.firstName || ''} ${enrollment.user?.lastName || ''}`
    const participantType = enrollment.child ? 'enfant' : 'adulte'

    // 4. Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Inscription - ${activityTitle}`,
              description: `Participant: ${contactName} (${participantType})`,
              metadata: {
                enrollmentId: enrollment.id,
                activityTitle: activityTitle,
              }
            },
            unit_amount: Math.round(enrollment.paymentAmount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      customer_email: contactEmail,
      success_url: `${process.env.NEXTAUTH_URL}/membre/inscriptions?payment=success&enrollmentId=${enrollment.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/membre/paiements`,
      metadata: {
        type: 'ACTIVITY_ENROLLMENT',
        enrollmentId: enrollment.id,
        activityId: enrollment.activityId || '',
        activityTitle: activityTitle,
        userId: enrollment.userId || '',
        childId: enrollment.childId || '',
        participantName: contactName,
        participantType,
      },
      payment_intent_data: {
        metadata: {
          type: 'ACTIVITY_ENROLLMENT',
          enrollmentId: enrollment.id,
        }
      }
    })

    console.log('✅ Session Stripe créée pour activité:', session.id, 'Montant:', enrollment.paymentAmount, 'CHF')

    // 5. Retourner l'URL de paiement
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      amount: enrollment.paymentAmount,
      activityTitle,
    })

  } catch (error: any) {
    console.error('❌ Erreur création checkout activité:', error)

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
