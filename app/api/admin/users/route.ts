import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier si on doit inclure les memberships complets
    const { searchParams } = new URL(request.url)
    const includeMemberships = searchParams.get('includeMemberships') === 'true'

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            city: true,
            postalCode: true,
            country: true,
          },
        },
        memberships: includeMemberships ? {
          select: {
            id: true,
            type: true,
            status: true,
            paymentStatus: true,
            amount: true,
            startDate: true,
            endDate: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        } : false,
        _count: {
          select: {
            memberships: true,
            donations: true,
            eventRegistrations: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}
