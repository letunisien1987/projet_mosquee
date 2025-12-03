/**
 * API Route: Lister toutes les demandes d'adhésion (Admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const requests = await prisma.membershipRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        membershipType: true,
        desiredStartDate: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        paymentLinkSentAt: true,
        paymentExpiresAt: true,
        paidAt: true,
        motivation: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        rejectionReason: true,
      },
    })

    return NextResponse.json(requests)
  } catch (error: any) {
    console.error('❌ Erreur récupération demandes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
