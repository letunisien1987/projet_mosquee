/**
 * API Admin: Gestion d'une offre spécifique (Événement ou Activité)
 * GET /api/admin/offerings/[id] - Détails d'une offre
 * PATCH /api/admin/offerings/[id] - Modifier une offre
 * DELETE /api/admin/offerings/[id] - Supprimer une offre
 */

import { NextRequest, NextResponse } from 'next/server'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById, updateOffering, deleteOffering } from '@/lib/content'
import { hasPermission } from '@/lib/permissions'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

// Transforme les chaînes vides en null pour les champs de date
const emptyStringToNull = (val: string | null | undefined) => {
  if (val === '' || val === undefined) return null
  return val
}

// Convertit les objets vides {} en null pour éviter les erreurs React
const sanitizeEmptyObjects = (obj: Record<string, any> | null | undefined) => {
  if (!obj) return null
  if (typeof obj !== 'object') return obj
  if (Object.keys(obj).length === 0) return null
  return obj
}

// Nettoie l'offre pour éviter les objets vides
const sanitizeOffering = (offering: any) => {
  if (!offering) return null
  return {
    ...offering,
    restrictions: sanitizeEmptyObjects(offering.restrictions),
    pricing: sanitizeEmptyObjects(offering.pricing),
  }
}

const updateOfferingSchema = z.object({
  // Type (ne devrait pas changer mais on le valide)
  itemType: z.enum(['EVENT', 'ACTIVITY']).optional(),

  // Champs communs
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  category: z.enum(['religieux', 'communaute', 'education', 'charite']).optional(),
  registrationRequired: z.boolean().optional(),
  maxCapacity: z.number().optional(),
  requiresApproval: z.boolean().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),

  // Champs événements
  date: z.string().nullable().optional().transform(emptyStringToNull),
  startTime: z.string().nullable().optional().transform(emptyStringToNull),
  endTime: z.string().nullable().optional().transform(emptyStringToNull),
  location: z.string().optional(),
  image: z.string().optional(),
  registrationDeadline: z.string().nullable().optional().transform(emptyStringToNull),

  // Champs activités
  activityCategory: z
    .enum(['coran', 'arabe', 'ecole', 'tajweed', 'hifz', 'halaqat', 'autre'])
    .optional(),
  level: z.string().optional(),
  ageGroup: z.string().optional(),
  schedule: z.string().optional(),
  instructor: z.string().optional(),
  enrollmentOpen: z.boolean().optional(),

  // Paiement
  price: z.number().optional(),
  paymentType: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']).optional(),
  subscriptionInterval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),

  // Remboursement
  allowRefund: z.boolean().optional(),
  cancellationDeadlineDays: z.number().min(0).max(365).optional(),

  // Tarification avancée
  pricing: z
    .object({
      adultPrice: z.number(),
      childPrice: z.number(),
      childFreeUntilAge: z.number(),
      groupDiscount: z.object({
        enabled: z.boolean(),
        fromPersons: z.number(),
        discountPercent: z.number(),
      }),
      familyMaxPrice: z.number().nullable(),
      earlyBird: z.object({
        enabled: z.boolean(),
        untilDate: z.string().nullable(),
        discountPercent: z.number(),
      }),
    })
    .nullable()
    .optional(),

  // Responsable
  managerId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val === '') return undefined
      return val
    }),
  managerEmail: z.string().email().optional().nullable(),

  // Contact organisateur
  showOrganizerName: z.boolean().optional(),
  showOrganizerEmail: z.boolean().optional(),
  showOrganizerPhone: z.boolean().optional(),

  // Restrictions
  restrictions: z
    .object({
      enabled: z.boolean().optional(),
      participationType: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED']).optional(),
      allowedGender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL']).optional(),
      minAge: z.number().nullable().optional(),
      maxAge: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
})

// GET - Détails d'une offre
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
    const canViewEvents = await hasPermission(role, 'VIEW_EVENTS')
    const canViewActivities = await hasPermission(role, 'VIEW_ACTIVITIES')

    if (!canViewEvents && !canViewActivities) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const rawOffering = await getOfferingById(id)

    if (!rawOffering) {
      return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 })
    }

    // Vérifier la permission selon le type
    if (rawOffering.itemType === 'EVENT' && !canViewEvents) {
      return NextResponse.json({ error: 'Non autorisé pour les événements' }, { status: 403 })
    }
    if (rawOffering.itemType === 'ACTIVITY' && !canViewActivities) {
      return NextResponse.json({ error: 'Non autorisé pour les activités' }, { status: 403 })
    }

    // Nettoyer l'offre
    const offering = sanitizeOffering(rawOffering)

    // Pour les rôles sans accès complet, vérifier qu'ils sont le manager
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    if (!isFullAccess && rawOffering.managerId !== session.user.id) {
      return NextResponse.json(
        { error: "Non autorisé - Vous n'êtes pas le responsable de cette offre" },
        { status: 403 }
      )
    }

    // Récupérer les stats d'inscriptions
    const registrationStats = await prisma.eventRegistration.groupBy({
      by: ['status'],
      where: { eventId: id },
      _count: { _all: true },
    })

    const totalRegistrations = await prisma.eventRegistration.count({
      where: { eventId: id },
    })

    // Pour les activités, compter aussi les enrollments
    let enrollmentStats = null
    let totalEnrollments = 0
    if (rawOffering.itemType === 'ACTIVITY') {
      enrollmentStats = await prisma.enrollment.groupBy({
        by: ['status'],
        where: { activityId: id },
        _count: { _all: true },
      })
      totalEnrollments = await prisma.enrollment.count({
        where: { activityId: id },
      })
    }

    return NextResponse.json({
      offering,
      stats: {
        registrations: registrationStats,
        totalRegistrations,
        enrollments: enrollmentStats,
        totalEnrollments,
        total: totalRegistrations + totalEnrollments,
      },
      isManager: rawOffering.managerId === session.user.id,
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/offerings/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH - Modifier une offre
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
    const { id } = await params

    // Vérifier l'accès à l'offre
    const offering = await getOfferingById(id)
    if (!offering) {
      return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 })
    }

    // Vérifier la permission selon le type
    if (offering.itemType === 'EVENT') {
      const canManageEvents = await hasPermission(role, 'MANAGE_EVENTS')
      if (!canManageEvents) {
        return NextResponse.json(
          { error: 'Non autorisé - Permission MANAGE_EVENTS requise' },
          { status: 403 }
        )
      }
    } else if (offering.itemType === 'ACTIVITY') {
      const canManageActivities = await hasPermission(role, 'MANAGE_ACTIVITIES')
      if (!canManageActivities) {
        return NextResponse.json(
          { error: 'Non autorisé - Permission MANAGE_ACTIVITIES requise' },
          { status: 403 }
        )
      }
    }

    // Pour les rôles sans accès complet, vérifier qu'ils sont le manager
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    if (!isFullAccess && offering.managerId !== session.user.id) {
      return NextResponse.json(
        { error: "Non autorisé - Vous n'êtes pas le responsable de cette offre" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateOfferingSchema.parse(body)

    // Si un managerId est fourni mais pas l'email, récupérer l'email
    let updateData: Record<string, unknown> = { ...validatedData }
    if (validatedData.managerId && !validatedData.managerEmail) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.managerId },
        select: { email: true },
      })
      updateData.managerEmail = manager?.email || null
    }

    // Filtrer les valeurs undefined
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => {
        if (value !== undefined && value !== null) return true
        if (
          value === null &&
          ['registrationDeadline', 'startTime', 'endTime', 'pricing'].includes(key)
        )
          return true
        return false
      })
    )

    const updatedOffering = await updateOffering(id, cleanUpdateData)

    if (!updatedOffering) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    const typeLabel = offering.itemType === 'EVENT' ? 'Événement' : 'Activité'

    return NextResponse.json({
      success: true,
      message: `${typeLabel} "${updatedOffering.title}" mis(e) à jour`,
      offering: updatedOffering,
    })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/offerings/[id]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une offre (seuls les admins peuvent supprimer)
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

    // Seuls les admins peuvent supprimer des offres
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Non autorisé - Seuls les administrateurs peuvent supprimer des offres' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Vérifier l'offre
    const offering = await getOfferingById(id)
    if (!offering) {
      return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 })
    }

    // Vérifier s'il y a des inscriptions actives
    const registrations = await prisma.eventRegistration.count({
      where: {
        eventId: id,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    })

    const enrollments = await prisma.enrollment.count({
      where: {
        activityId: id,
        status: { in: ['APPROVED', 'PENDING', 'ACTIVE'] },
      },
    })

    const totalActive = registrations + enrollments

    if (totalActive > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer: ${totalActive} inscription(s) active(s)`,
        },
        { status: 400 }
      )
    }

    const success = await deleteOffering(id)

    if (!success) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    const typeLabel = offering.itemType === 'EVENT' ? 'Événement' : 'Activité'

    return NextResponse.json({
      success: true,
      message: `${typeLabel} supprimé(e)`,
    })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/offerings/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
