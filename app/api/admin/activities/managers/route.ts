/**
 * API Admin: Gestion des responsables d'activités
 * GET /api/admin/activities/managers - Liste activités avec leurs responsables
 * POST /api/admin/activities/managers - Assigner un responsable
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActivities, assignActivityManager, removeActivityManager } from '@/lib/directus'
import { z } from 'zod'

const assignSchema = z.object({
  activityId: z.string().min(1),
  userId: z.string().uuid().nullable(),
})

// GET - Liste toutes les activités avec leurs responsables
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'IMAM', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer toutes les activités depuis Directus
    const activities = await getActivities()

    // Pour chaque activité avec un manager_id, récupérer les infos du manager
    const activitiesWithManagers = await Promise.all(
      activities.map(async (activity: any) => {
        let manager = null
        if (activity.manager_id) {
          manager = await prisma.user.findUnique({
            where: { id: activity.manager_id },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          })
        }
        return {
          ...activity,
          manager,
        }
      })
    )

    // Récupérer la liste des utilisateurs pouvant être responsables
    const potentialManagers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'IMAM', 'STAFF', 'TEACHER', 'MEMBER'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json({
      activities: activitiesWithManagers,
      potentialManagers,
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/activities/managers:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Assigner ou retirer un responsable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || !['ADMIN', 'IMAM'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Non autorisé - Admin ou Imam requis' }, { status: 403 })
    }

    const body = await request.json()
    const { activityId, userId } = assignSchema.parse(body)

    if (userId === null) {
      // Retirer le responsable
      const success = await removeActivityManager(activityId)
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Responsable retiré',
        })
      } else {
        return NextResponse.json({ error: 'Erreur lors du retrait' }, { status: 500 })
      }
    }

    // Assigner un nouveau responsable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const activity = await assignActivityManager(activityId, user.id, user.email!)

    if (activity) {
      // Créer une notification pour le nouveau responsable
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'Nouvelle responsabilité',
          message: `Vous avez été désigné responsable de l'activité "${activity.title}". Vous pouvez maintenant gérer les inscriptions depuis votre espace membre.`,
          link: '/membre/mes-activites',
          read: false,
          emailSent: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: `${user.firstName} ${user.lastName} est maintenant responsable de "${activity.title}"`,
        activity,
      })
    } else {
      return NextResponse.json({ error: 'Erreur lors de l\'assignation' }, { status: 500 })
    }
  } catch (error) {
    console.error('Erreur POST /api/admin/activities/managers:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
