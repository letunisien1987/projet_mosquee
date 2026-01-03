/**
 * API Route: Créer une session de paiement Stripe pour une activité
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getActivityById } from '@/lib/content'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: activityId } = await params
    const { searchParams } = new URL(req.url)
    const enrollmentId = searchParams.get('enrollmentId')

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'ID d\'inscription manquant' },
        { status: 400 }
      )
    }

    // Récupérer l'inscription
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
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
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (session?.user && enrollment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que l'inscription est approuvée
    if (enrollment.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Cette inscription n\'a pas encore été approuvée' },
        { status: 400 }
      )
    }

    // Récupérer l'activité depuis la base de données
    const activity = await getActivityById(activityId)

    if (!activity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    // Vérifier si l'activité a un prix
    const price = activity.price || 0
    if (price === 0) {
      return NextResponse.json(
        { error: 'Cette activité est gratuite' },
        { status: 400 }
      )
    }

    // Créer la session Stripe
    const participantName = enrollment.child
      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
      : `${enrollment.user?.firstName} ${enrollment.user?.lastName}`

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Activité: ${enrollment.activityTitle}`,
              description: `Participant: ${participantName}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/membre/inscriptions?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/membre/paiements?payment=cancelled`,
      customer_email: enrollment.user?.email || '',
      metadata: {
        type: 'ACTIVITY_ENROLLMENT',
        enrollmentId: enrollment.id,
        activityId: activityId,
        activityTitle: enrollment.activityTitle,
        userId: enrollment.userId || '',
        childId: enrollment.childId || '',
        participantName,
      },
    })

    console.log('💳 Session Stripe créée pour activité:', stripeSession.id)

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
