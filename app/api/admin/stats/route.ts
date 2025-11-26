import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role!)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Stats des membres actifs
    const activeMemberships = await prisma.membership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
        },
      },
    })

    // Dons du mois
    const donationsThisMonth = await prisma.donation.aggregate({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Inscriptions en attente
    const pendingEnrollments = await prisma.enrollment.count({
      where: {
        status: 'PENDING',
      },
    })

    // Messages non lus
    const unreadMessages = await prisma.contactMessage.count({
      where: {
        read: false,
      },
    })

    // Cotisations expirant bientôt (30 jours)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiringMemberships = await prisma.membership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    })

    // Événements à venir
    const upcomingEvents = await prisma.eventRegistration.count({
      where: {
        createdAt: {
          gte: now,
        },
      },
    })

    // Dons des 6 derniers mois (pour graphique)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyDonations = await prisma.$queryRaw<Array<{ month: Date; total: number; count: bigint }>>`
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM donations
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `

    // Convertir BigInt en Number pour la sérialisation JSON
    const serializedMonthlyDonations = monthlyDonations.map((item) => ({
      month: item.month,
      total: Number(item.total),
      count: Number(item.count),
    }))

    return NextResponse.json({
      activeMemberships,
      donationsThisMonth: {
        total: donationsThisMonth._sum.amount || 0,
        count: donationsThisMonth._count,
      },
      pendingEnrollments,
      unreadMessages,
      expiringMemberships,
      upcomingEvents,
      monthlyDonations: serializedMonthlyDonations,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
