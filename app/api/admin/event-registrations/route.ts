import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const registrations = await prisma.eventRegistration.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(registrations)
  } catch (error) {
    console.error('Error fetching event registrations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des inscriptions' },
      { status: 500 }
    )
  }
}
