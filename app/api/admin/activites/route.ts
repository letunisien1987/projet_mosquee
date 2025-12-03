/**
 * API Admin: Gestion des activités (CRUD vers Directus)
 * GET /api/admin/activites - Liste toutes les activités
 * POST /api/admin/activites - Créer une nouvelle activité
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllActivities, createActivity, getActivitiesByManager } from '@/lib/directus'
import { hasPermission } from '@/lib/permissions'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

// Convertit les objets vides {} en null pour éviter les erreurs React
const sanitizeEmptyObjects = (obj: Record<string, any> | null | undefined) => {
  if (!obj) return null
  if (typeof obj !== 'object') return obj
  if (Object.keys(obj).length === 0) return null
  return obj
}

// Nettoie une activité pour éviter les objets vides
const sanitizeActivity = (activity: any) => {
  if (!activity) return null
  return {
    ...activity,
    restrictions: sanitizeEmptyObjects(activity.restrictions),
    pricing: sanitizeEmptyObjects(activity.pricing),
  }
}

const activitySchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  category: z.enum(['coran', 'arabe', 'ecole', 'tajweed', 'hifz', 'halaqat', 'autre']),
  description: z.string().optional(),
  content: z.string().optional(),
  level: z.string().optional(),
  age_group: z.string().optional(),
  schedule: z.string().optional(),
  instructor: z.string().optional(),
  max_participants: z.number().optional(),
  requires_approval: z.boolean().default(false),
  price: z.number().optional(),
  // Champs de paiement
  payment_type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']).default('FREE'),
  subscription_interval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  // Tarification avancée
  pricing: z.object({
    adult_price: z.number(),
    child_price: z.number(),
    child_free_until_age: z.number(),
    group_discount: z.object({
      enabled: z.boolean(),
      from_persons: z.number(),
      discount_percent: z.number(),
    }),
    family_max_price: z.number().nullable(),
    early_bird: z.object({
      enabled: z.boolean(),
      until_date: z.string().nullable(),
      discount_percent: z.number(),
    }),
  }).nullable().optional(),
  active: z.boolean().default(true),
  enrollment_open: z.boolean().default(true),
  restrictions: z.object({
    enabled: z.boolean().default(false),
    participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED']).optional(),
    allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL']).optional(),
    min_age: z.number().nullable().optional(),
    max_age: z.number().nullable().optional(),
  }).optional(),
})

// GET - Liste toutes les activités (filtrées par rôle)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const role = user.role as UserRole

    // Vérifier les permissions
    const canViewActivities = await hasPermission(role, 'VIEW_ACTIVITIES')
    if (!canViewActivities) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Déterminer si l'utilisateur voit toutes les activités ou seulement les siennes
    // ADMIN, IMAM, STAFF voient tout
    // MANAGER et TEACHER ne voient que leurs activités
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)

    let activities
    if (isFullAccess) {
      activities = await getAllActivities()
    } else {
      // MANAGER/TEACHER: ne voir que les activités dont ils sont responsables
      activities = await getActivitiesByManager(session.user.id)
    }

    // Compter les inscriptions pour chaque activité et nettoyer les données
    const activitiesWithStats = await Promise.all(
      activities.map(async (activity) => {
        const enrollmentCount = await prisma.enrollment.count({
          where: { activityId: activity.id.toString() },
        })
        // Nettoyer l'activité pour éviter les objets vides
        const sanitized = sanitizeActivity(activity)
        return {
          ...sanitized,
          enrollmentCount,
          isManager: activity.manager_id === session.user.id, // Indicateur si l'utilisateur est le responsable
        }
      })
    )

    return NextResponse.json({
      activities: activitiesWithStats,
      isFullAccess, // Permet au frontend de savoir si l'utilisateur a accès complet
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/activites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle activité
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier la permission de gérer les activités
    const canManageActivities = await hasPermission(adminUser.role as UserRole, 'MANAGE_ACTIVITIES')
    if (!canManageActivities) {
      return NextResponse.json({ error: 'Non autorisé - Permission MANAGE_ACTIVITIES requise' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = activitySchema.parse(body)

    // Créer l'activité dans Directus avec l'admin comme manager par défaut
    const activity = await createActivity({
      ...validatedData,
      manager_id: session.user.id,
      manager_email: adminUser.email || undefined,
    })

    if (!activity) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Activité "${activity.title}" créée avec succès`,
      activity,
    })
  } catch (error) {
    console.error('Erreur POST /api/admin/activites:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
