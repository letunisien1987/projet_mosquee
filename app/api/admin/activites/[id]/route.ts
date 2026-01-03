/**
 * API Admin: Gestion d'une activité spécifique
 * GET /api/admin/activites/[id] - Détails d'une activité
 * PATCH /api/admin/activites/[id] - Modifier une activité
 * DELETE /api/admin/activites/[id] - Supprimer une activité
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActivityById, updateActivity, deleteActivity } from '@/lib/content'
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

const updateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  category: z.enum(['coran', 'arabe', 'ecole', 'tajweed', 'hifz', 'halaqat', 'autre']).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  level: z.string().optional(),
  age_group: z.string().optional(),
  schedule: z.string().optional(),
  instructor: z.string().optional(),
  max_participants: z.number().optional(),
  requires_approval: z.boolean().optional(),
  price: z.number().optional(),
  // Champs de paiement
  payment_type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']).optional(),
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
  active: z.boolean().optional(),
  enrollment_open: z.boolean().optional(),
  manager_id: z.string().uuid().optional(),
  manager_email: z.string().email().optional(),
  restrictions: z.object({
    enabled: z.boolean().optional(),
    participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED']).optional(),
    allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL']).optional(),
    min_age: z.number().nullable().optional(),
    max_age: z.number().nullable().optional(),
  }).optional(),
})

// GET - Détails d'une activité
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const rawActivity = await getActivityById(id)

    if (!rawActivity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 })
    }

    // Nettoyer l'activité pour éviter les objets vides
    const activity = sanitizeActivity(rawActivity)

    // Pour les rôles sans accès complet, vérifier qu'ils sont le manager
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    if (!isFullAccess && rawActivity.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé - Vous n\'êtes pas le responsable de cette activité' }, { status: 403 })
    }

    // Récupérer les stats d'inscriptions
    const enrollmentStats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { activityId: id },
      _count: { _all: true },
    })

    // Compter le total des inscriptions
    const totalEnrollments = await prisma.enrollment.count({
      where: { activityId: id },
    })

    return NextResponse.json({
      activity,
      stats: {
        enrollments: enrollmentStats,
        total: totalEnrollments,
      },
      isManager: rawActivity.managerId === session.user.id,
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/activites/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH - Modifier une activité
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const role = adminUser.role as UserRole

    // Vérifier la permission de gérer les activités
    const canManageActivities = await hasPermission(role, 'MANAGE_ACTIVITIES')
    if (!canManageActivities) {
      return NextResponse.json({ error: 'Non autorisé - Permission MANAGE_ACTIVITIES requise' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier l'accès à l'activité
    const existingActivity = await getActivityById(id)
    if (!existingActivity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 })
    }

    // Pour les rôles sans accès complet, vérifier qu'ils sont le manager
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    if (!isFullAccess && existingActivity.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé - Vous n\'êtes pas le responsable de cette activité' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateActivitySchema.parse(body)

    // Si un manager_id est fourni mais pas l'email, récupérer l'email
    let managerEmail = validatedData.manager_email
    if (validatedData.manager_id && !managerEmail) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.manager_id },
        select: { email: true },
      })
      managerEmail = manager?.email || undefined
    }

    // Convertir snake_case vers camelCase pour Prisma
    const prismaData: Record<string, any> = {
      title: validatedData.title,
      slug: validatedData.slug,
      description: validatedData.description,
      content: validatedData.content,
      category: validatedData.category,
      level: validatedData.level,
      ageGroup: validatedData.age_group,
      schedule: validatedData.schedule,
      instructorName: validatedData.instructor,
      maxParticipants: validatedData.max_participants,
      requiresApproval: validatedData.requires_approval,
      active: validatedData.active,
      enrollmentOpen: validatedData.enrollment_open,
      price: validatedData.price,
      paymentType: validatedData.payment_type,
      subscriptionInterval: validatedData.subscription_interval,
      pricing: validatedData.pricing,
      managerId: validatedData.manager_id,
      managerEmail: managerEmail,
      restrictions: validatedData.restrictions,
    }

    // Filtrer les valeurs undefined pour ne pas écraser les valeurs existantes
    const cleanUpdateData = Object.fromEntries(
      Object.entries(prismaData).filter(([, value]) => value !== undefined)
    )

    const activity = await updateActivity(id, cleanUpdateData)

    if (!activity) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Activité "${activity.title}" mise à jour`,
      activity,
    })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/activites/[id]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une activité (seuls les admins peuvent supprimer)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // Seuls les admins peuvent supprimer des activités
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Seuls les administrateurs peuvent supprimer des activités' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier s'il y a des inscriptions actives
    const activeEnrollments = await prisma.enrollment.count({
      where: {
        activityId: id,
        status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] },
      },
    })

    if (activeEnrollments > 0) {
      return NextResponse.json({
        error: `Impossible de supprimer: ${activeEnrollments} inscription(s) active(s)`,
      }, { status: 400 })
    }

    const success = await deleteActivity(id)

    if (!success) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Activité supprimée',
    })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/activites/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
