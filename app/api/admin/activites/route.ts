/**
 * API Admin: Gestion des activités (CRUD vers Directus)
 * GET /api/admin/activites - Liste toutes les activités
 * POST /api/admin/activites - Créer une nouvelle activité
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllActivities, createActivity, getActivitiesByManager } from '@/lib/directus'
import {
  apiHandler,
  requirePermission,
  successResponse,
  FULL_ADMIN_ROLES,
} from '@/lib/api/middleware'
import { activitySchema, sanitizeContentItem } from '@/lib/schemas'

// GET - Liste toutes les activités (filtrées par rôle)
export const GET = apiHandler(async () => {
  const session = await requirePermission('VIEW_ACTIVITIES')
  const { role, id: userId } = session.user

  // ADMIN, IMAM, STAFF voient tout; MANAGER/TEACHER voient leurs activités
  const isFullAccess = FULL_ADMIN_ROLES.includes(role)

  const activities = isFullAccess
    ? await getAllActivities()
    : await getActivitiesByManager(userId)

  // Compter les inscriptions et nettoyer les données
  const activitiesWithStats = await Promise.all(
    activities.map(async (activity) => {
      const enrollmentCount = await prisma.enrollment.count({
        where: { activityId: activity.id.toString() },
      })

      return {
        ...sanitizeContentItem(activity),
        enrollmentCount,
        isManager: activity.manager_id === userId,
      }
    })
  )

  return successResponse({ activities: activitiesWithStats, isFullAccess })
})

// POST - Créer une nouvelle activité
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await requirePermission('MANAGE_ACTIVITIES')
  const { id: userId } = session.user

  // Récupérer l'email de l'utilisateur
  const adminUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  const body = await req.json()
  const validatedData = activitySchema.parse(body)

  // Créer l'activité dans Directus avec l'admin comme manager par défaut
  const activity = await createActivity({
    ...validatedData,
    manager_id: userId,
    manager_email: adminUser?.email || undefined,
  })

  if (!activity) {
    throw new Error('Erreur lors de la création de l\'activité')
  }

  return successResponse({
    success: true,
    message: `Activité "${activity.title}" créée avec succès`,
    activity,
  })
})
