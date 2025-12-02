import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const membership = await prisma.membership.findUnique({
    where: { id },
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

  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: membership.id,
    userId: membership.userId,
    type: membership.type,
    status: membership.status,
    paymentStatus: membership.paymentStatus,
    amount: membership.amount,
    stripeSessionId: membership.stripeSessionId,
    stripePaymentIntentId: membership.stripePaymentIntentId,
    user: membership.user,
    createdAt: membership.createdAt,
  }, { status: 200 })
}
