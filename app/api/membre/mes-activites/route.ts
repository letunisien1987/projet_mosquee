/**
 * API: Liste des activités gérées par le responsable connecté
 * GET /api/membre/mes-activites
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getActivitiesByManager } from '@/lib/directus'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Récupérer les activités gérées par cet utilisateur
    const activities = await getActivitiesByManager(userId)

    // Pour chaque activité, récupérer les statistiques d'inscriptions
    const activitiesWithStats = await Promise.all(
      activities.map(async (activity) => {
        // Compter les inscriptions par statut
        const stats = await prisma.enrollment.groupBy({
          by: ['status'],
          where: { activityId: activity.id.toString() },
          _count: { status: true },
        }) as { status: string; _count: { status: number } }[]

        const statsMap: Record<string, number> = {}
        stats.forEach((s) => {
          statsMap[s.status] = s._count.status
        })

        return {
          ...activity,
          stats: {
            pending: statsMap['PENDING'] || 0,
            approved: statsMap['APPROVED'] || 0,
            active: statsMap['ACTIVE'] || 0,
            rejected: statsMap['REJECTED'] || 0,
            cancelled: statsMap['CANCELLED'] || 0,
            total: Object.values(statsMap).reduce((a, b) => a + b, 0),
          },
        }
      })
    )

    return NextResponse.json({
      activities: activitiesWithStats,
      count: activitiesWithStats.length,
    })
  } catch (error) {
    console.error('Erreur GET /api/membre/mes-activites:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
