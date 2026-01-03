/**
 * API Admin: Gestion d'un événement spécifique
 * GET /api/admin/evenements-gestion/[id] - Détails d'un événement
 * PATCH /api/admin/evenements-gestion/[id] - Modifier un événement
 * DELETE /api/admin/evenements-gestion/[id] - Supprimer un événement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventById, updateEvent, deleteEvent } from '@/lib/content'
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

// Nettoie l'événement pour éviter les objets vides qui causent des erreurs React
const sanitizeEvent = (event: any) => {
  if (!event) return null
  return {
    ...event,
    restrictions: sanitizeEmptyObjects(event.restrictions),
    pricing: sanitizeEmptyObjects(event.pricing),
  }
}

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  category: z.enum(['religieux', 'communaute', 'education', 'charite']).optional(),
  date: z.string().optional().transform(emptyStringToNull),
  start_time: z.string().optional().transform(emptyStringToNull),
  end_time: z.string().optional().transform(emptyStringToNull),
  location: z.string().optional(),
  image: z.string().optional(),
  registration_required: z.boolean().optional(),
  max_capacity: z.number().optional(),
  requires_approval: z.boolean().optional(),
  registration_deadline: z.string().optional().transform(emptyStringToNull),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  // Champs de paiement
  price: z.number().optional(),
  payment_type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']).optional(),
  subscription_interval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  // Politique de remboursement
  allow_refund: z.boolean().optional(),
  cancellation_deadline_days: z.number().min(0).max(365).optional(),
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
  // Responsable - accepte UUID, chaîne vide (transformée en undefined), ou null
  manager_id: z.string().optional().nullable().transform(val => {
    if (!val || val === '') return undefined
    return val
  }),
  manager_email: z.string().email().optional().nullable(),
  restrictions: z.object({
    enabled: z.boolean().optional(),
    participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED']).optional(),
    allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL']).optional(),
    min_age: z.number().nullable().optional(),
    max_age: z.number().nullable().optional(),
  }).optional(),
})

// GET - Détails d'un événement
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
    if (!canViewEvents) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const rawEvent = await getEventById(id)

    if (!rawEvent) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Nettoyer l'événement pour éviter les objets vides
    const event = sanitizeEvent(rawEvent)

    // Pour les rôles sans accès complet, vérifier qu'ils sont le manager de l'événement
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    if (!isFullAccess && rawEvent.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé - Vous n\'êtes pas le responsable de cet événement' }, { status: 403 })
    }

    // Récupérer les stats d'inscriptions
    const registrationStats = await prisma.eventRegistration.groupBy({
      by: ['status'],
      where: { eventId: id },
      _count: { _all: true },
    })

    // Compter le total des inscriptions
    const totalRegistrations = await prisma.eventRegistration.count({
      where: { eventId: id },
    })

    return NextResponse.json({
      event,
      stats: {
        registrations: registrationStats,
        total: totalRegistrations,
      },
      isManager: rawEvent.managerId === session.user.id,
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/evenements-gestion/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH - Modifier un événement
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

    // Vérifier la permission de gérer les événements
    const canManageEvents = await hasPermission(role, 'MANAGE_EVENTS')
    if (!canManageEvents) {
      return NextResponse.json({ error: 'Non autorisé - Permission MANAGE_EVENTS requise' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier l'accès à l'événement
    const event = await getEventById(id)
    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Pour les rôles sans accès complet, vérifier qu'ils sont le manager
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    if (!isFullAccess && event.managerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé - Vous n\'êtes pas le responsable de cet événement' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)

    // Si un manager_id est fourni mais pas l'email, récupérer l'email
    let managerEmail = validatedData.manager_email
    if (validatedData.manager_id && !managerEmail) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.manager_id },
        select: { email: true },
      })
      managerEmail = manager?.email || null
    }

    // Convertir snake_case vers camelCase pour Prisma
    const prismaData: Record<string, any> = {
      title: validatedData.title,
      slug: validatedData.slug,
      description: validatedData.description,
      content: validatedData.content,
      category: validatedData.category,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      startTime: validatedData.start_time,
      endTime: validatedData.end_time,
      location: validatedData.location,
      imageUrl: validatedData.image,
      registrationRequired: validatedData.registration_required,
      maxCapacity: validatedData.max_capacity,
      requiresApproval: validatedData.requires_approval,
      registrationDeadline: validatedData.registration_deadline ? new Date(validatedData.registration_deadline) : validatedData.registration_deadline === null ? null : undefined,
      featured: validatedData.featured,
      published: validatedData.published,
      price: validatedData.price,
      paymentType: validatedData.payment_type,
      subscriptionInterval: validatedData.subscription_interval,
      allowRefund: validatedData.allow_refund,
      cancellationDeadlineDays: validatedData.cancellation_deadline_days,
      pricing: validatedData.pricing,
      managerId: validatedData.manager_id,
      managerEmail: managerEmail,
      restrictions: validatedData.restrictions,
    }

    // Filtrer les valeurs undefined pour ne pas écraser les valeurs existantes
    const cleanUpdateData = Object.fromEntries(
      Object.entries(prismaData).filter(([key, value]) => {
        // Garder les valeurs définies (y compris false, 0, null pour les champs effaçables)
        if (value !== undefined) return true
        return false
      })
    )

    const updatedEvent = await updateEvent(id, cleanUpdateData)

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Événement "${updatedEvent.title}" mis à jour`,
      event: updatedEvent,
    })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/evenements-gestion/[id]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un événement (seuls les admins peuvent supprimer)
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

    // Seuls les admins peuvent supprimer des événements
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Seuls les administrateurs peuvent supprimer des événements' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier s'il y a des inscriptions
    const registrations = await prisma.eventRegistration.count({
      where: {
        eventId: id,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    })

    if (registrations > 0) {
      return NextResponse.json({
        error: `Impossible de supprimer: ${registrations} inscription(s) active(s)`,
      }, { status: 400 })
    }

    const success = await deleteEvent(id)

    if (!success) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Événement supprimé',
    })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/evenements-gestion/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
