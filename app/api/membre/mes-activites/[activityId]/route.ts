/**
 * API: Détails d'une activité gérée
 * GET /api/membre/mes-activites/[activityId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getActivityById, isActivityManager } from '@/lib/directus'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { activityId } = await params
    const userId = session.user.id

    // Vérifier que l'utilisateur est responsable de cette activité
    const isManager = await isActivityManager(activityId, userId)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas responsable de cette activité' },
        { status: 403 }
      )
    }

    // Récupérer l'activité
    const activity = await getActivityById(activityId)
    if (!activity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    // Statistiques détaillées
    const stats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { activityId: activityId.toString() },
      _count: { status: true },
    })

    const statsMap: Record<string, number> = {}
    stats.forEach((s) => {
      statsMap[s.status] = s._count.status
    })

    // Dernières inscriptions en attente
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        activityId: activityId.toString(),
        status: 'PENDING',
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        child: { select: { firstName: true, lastName: true, birthDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      activity,
      stats: {
        pending: statsMap['PENDING'] || 0,
        approved: statsMap['APPROVED'] || 0,
        active: statsMap['ACTIVE'] || 0,
        rejected: statsMap['REJECTED'] || 0,
        cancelled: statsMap['CANCELLED'] || 0,
        total: Object.values(statsMap).reduce((a, b) => a + b, 0),
      },
      pendingEnrollments,
    })
  } catch (error) {
    console.error('Erreur GET /api/membre/mes-activites/[activityId]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
