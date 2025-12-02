import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Récupérer le membership
  const membership = await prisma.membership.findUnique({
    where: { id },
  })

  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
  }

  // Récupérer le payment_intent depuis Stripe
  const stripeSessionId = membership.stripeSessionId
  if (!stripeSessionId) {
    return NextResponse.json({ error: 'No Stripe session found' }, { status: 400 })
  }

  const Stripe = require('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  })

  const session = await stripe.checkout.sessions.retrieve(stripeSessionId)

  // Mettre à jour le membership
  const updated = await prisma.membership.update({
    where: { id },
    data: {
      paymentStatus: 'PAID',
      stripePaymentIntentId: session.payment_intent as string || null,
    },
  })

  return NextResponse.json({
    message: 'Membership corrigé avec succès',
    membership: {
      id: updated.id,
      paymentStatus: updated.paymentStatus,
      stripePaymentIntentId: updated.stripePaymentIntentId,
    },
  }, { status: 200 })
}
