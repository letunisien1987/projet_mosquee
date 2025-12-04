/**
 * API Admin: Gestion unifiée des offres (Événements + Activités)
 * GET /api/admin/offerings - Liste toutes les offres
 * POST /api/admin/offerings - Créer une nouvelle offre
 *
 * Query params:
 * - type: 'EVENT' | 'ACTIVITY' (filtre par type)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getAllOfferings,
  getOfferingsByManager,
  createOffering,
  ItemType,
  DirectusOffering,
} from '@/lib/directus'
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

// Nettoie une offre pour éviter les objets vides
const sanitizeOffering = (offering: any) => {
  if (!offering) return null
  return {
    ...offering,
    restrictions: sanitizeEmptyObjects(offering.restrictions),
    pricing: sanitizeEmptyObjects(offering.pricing),
  }
}

// Schéma de validation pour création
const offeringSchema = z.object({
  // Champ discriminateur
  item_type: z.enum(['EVENT', 'ACTIVITY']),

  // Champs communs obligatoires
  title: z.string().min(1, 'Le titre est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  category: z.enum(['religieux', 'communaute', 'education', 'charite']),

  // Champs communs optionnels
  description: z.string().optional(),
  content: z.string().optional(),
  registration_required: z.boolean().default(true),
  max_capacity: z.number().optional(),
  requires_approval: z.boolean().default(false),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),

  // Paiement
  price: z.number().optional(),
  payment_type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']).default('FREE'),
  subscription_interval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),

  // Remboursement
  allow_refund: z.boolean().default(true),
  cancellation_deadline_days: z.number().min(0).max(365).default(7),

  // Responsable
  manager_id: z.string().uuid().optional(),
  manager_email: z.string().email().optional(),

  // Restrictions
  restrictions: z
    .object({
      enabled: z.boolean().default(false),
      participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED']).optional(),
      allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL']).optional(),
      min_age: z.number().nullable().optional(),
      max_age: z.number().nullable().optional(),
    })
    .optional(),

  // === Champs spécifiques ÉVÉNEMENTS ===
  date: z.string().optional(), // Date de l'événement
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
  registration_deadline: z.string().optional(),

  // === Champs spécifiques ACTIVITÉS ===
  activity_category: z
    .enum(['coran', 'arabe', 'ecole', 'tajweed', 'hifz', 'halaqat', 'autre'])
    .optional(),
  level: z.string().optional(),
  age_group: z.string().optional(),
  schedule: z.string().optional(), // Horaire récurrent
  instructor: z.string().optional(),
  enrollment_open: z.boolean().optional(),

  // Tarification avancée
  pricing: z
    .object({
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
    })
    .nullable()
    .optional(),
})

// GET - Liste toutes les offres (filtrées par rôle et type)
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

    // Vérifier les permissions (VIEW_EVENTS ou VIEW_ACTIVITIES)
    const canViewEvents = await hasPermission(role, 'VIEW_EVENTS')
    const canViewActivities = await hasPermission(role, 'VIEW_ACTIVITIES')

    if (!canViewEvents && !canViewActivities) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer le paramètre de type
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type') as ItemType | null

    // Déterminer si l'utilisateur voit toutes les offres ou seulement les siennes
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)

    let offerings: DirectusOffering[]
    if (isFullAccess) {
      offerings = await getAllOfferings(typeParam || undefined)
    } else {
      // MANAGER/TEACHER: ne voir que les offres dont ils sont responsables
      offerings = await getOfferingsByManager(session.user.id, typeParam || undefined)
    }

    // Filtrer par permission si pas d'accès complet
    if (!isFullAccess) {
      offerings = offerings.filter((o) => {
        if (o.item_type === 'EVENT') return canViewEvents
        if (o.item_type === 'ACTIVITY') return canViewActivities
        return false
      })
    }

    // Compter les inscriptions pour chaque offre et nettoyer les données
    const offeringsWithStats = await Promise.all(
      offerings.map(async (offering) => {
        // Compter les inscriptions (EventRegistration pour les deux types maintenant)
        const registrationCount = await prisma.eventRegistration.count({
          where: { eventId: offering.id.toString() },
        })

        // Compter aussi les enrollments (pour les activités existantes)
        const enrollmentCount = await prisma.enrollment.count({
          where: { activityId: offering.id.toString() },
        })

        const sanitized = sanitizeOffering(offering)

        return {
          ...sanitized,
          registrationCount: registrationCount + enrollmentCount,
          isManager: offering.manager_id === session.user.id,
        }
      })
    )

    return NextResponse.json({
      offerings: offeringsWithStats,
      isFullAccess,
      counts: {
        total: offeringsWithStats.length,
        events: offeringsWithStats.filter((o) => o.item_type === 'EVENT').length,
        activities: offeringsWithStats.filter((o) => o.item_type === 'ACTIVITY').length,
      },
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/offerings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle offre
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

    const role = adminUser.role as UserRole

    // Vérifier les permissions selon le type
    const body = await request.json()
    const itemType = body.item_type as ItemType

    if (itemType === 'EVENT') {
      const canManageEvents = await hasPermission(role, 'MANAGE_EVENTS')
      if (!canManageEvents) {
        return NextResponse.json(
          { error: 'Non autorisé - Permission MANAGE_EVENTS requise' },
          { status: 403 }
        )
      }
    } else if (itemType === 'ACTIVITY') {
      const canManageActivities = await hasPermission(role, 'MANAGE_ACTIVITIES')
      if (!canManageActivities) {
        return NextResponse.json(
          { error: 'Non autorisé - Permission MANAGE_ACTIVITIES requise' },
          { status: 403 }
        )
      }
    }

    const validatedData = offeringSchema.parse(body)

    // Utiliser le responsable fourni ou l'admin courant par défaut
    let finalManagerId = validatedData.manager_id || session.user.id
    let finalManagerEmail = validatedData.manager_email

    // Si un manager_id est fourni mais pas l'email, récupérer l'email
    if (validatedData.manager_id && !validatedData.manager_email) {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.manager_id },
        select: { email: true },
      })
      finalManagerEmail = manager?.email || undefined
    } else if (!validatedData.manager_id) {
      finalManagerEmail = adminUser.email || undefined
    }

    // Créer l'offre dans Directus
    const offering = await createOffering({
      ...validatedData,
      manager_id: finalManagerId,
      manager_email: finalManagerEmail,
    } as any)

    if (!offering) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    const typeLabel = itemType === 'EVENT' ? 'Événement' : 'Activité'

    return NextResponse.json({
      success: true,
      message: `${typeLabel} "${offering.title}" créé(e) avec succès`,
      offering,
    })
  } catch (error) {
    console.error('Erreur POST /api/admin/offerings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
