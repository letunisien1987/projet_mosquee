/**
 * API Admin: Gestion des événements (CRUD vers Directus)
 * GET /api/admin/evenements-gestion - Liste tous les événements
 * POST /api/admin/evenements-gestion - Créer un nouvel événement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllEvents, createEvent, getEventsByManager } from '@/lib/directus'
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

// Nettoie un événement pour éviter les objets vides
const sanitizeEvent = (event: any) => {
  if (!event) return null
  return {
    ...event,
    restrictions: sanitizeEmptyObjects(event.restrictions),
    pricing: sanitizeEmptyObjects(event.pricing),
  }
}

const eventSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  description: z.string().optional(),
  content: z.string().optional(),
  category: z.enum(['religieux', 'communaute', 'education', 'charite']),
  date: z.string().min(1, 'La date est requise'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
  registration_required: z.boolean().default(false),
  max_capacity: z.number().optional(),
  requires_approval: z.boolean().default(false),
  registration_deadline: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  // Champs de paiement
  price: z.number().optional(),
  payment_type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION']).default('FREE'),
  subscription_interval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  // Responsable
  manager_id: z.string().uuid().optional(),
  manager_email: z.string().email().optional(),
  restrictions: z.object({
    enabled: z.boolean().default(false),
    participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED']).optional(),
    allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL']).optional(),
    min_age: z.number().nullable().optional(),
    max_age: z.number().nullable().optional(),
  }).optional(),
})

// GET - Liste tous les événements (filtrés par rôle)
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
    const canViewEvents = await hasPermission(role, 'VIEW_EVENTS')
    if (!canViewEvents) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Déterminer si l'utilisateur voit tous les événements ou seulement les siens
    // ADMIN, IMAM, STAFF voient tout
    // MANAGER et TEACHER ne voient que leurs événements
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)

    let events
    if (isFullAccess) {
      events = await getAllEvents()
    } else {
      // MANAGER/TEACHER: ne voir que les événements dont ils sont responsables
      events = await getEventsByManager(session.user.id)
    }

    // Compter les inscriptions pour chaque événement et nettoyer les données
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await prisma.eventRegistration.count({
          where: { eventId: event.id.toString() },
        })
        // Nettoyer l'événement pour éviter les objets vides
        const sanitized = sanitizeEvent(event)
        return {
          ...sanitized,
          registrationCount,
          isManager: event.manager_id === session.user.id, // Indicateur si l'utilisateur est le responsable
        }
      })
    )

    return NextResponse.json({
      events: eventsWithStats,
      isFullAccess, // Permet au frontend de savoir si l'utilisateur a accès complet
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/evenements-gestion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouvel événement
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

    // Vérifier la permission de gérer les événements
    const canManageEvents = await hasPermission(adminUser.role as UserRole, 'MANAGE_EVENTS')
    if (!canManageEvents) {
      return NextResponse.json({ error: 'Non autorisé - Permission MANAGE_EVENTS requise' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = eventSchema.parse(body)

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

    // Créer l'événement dans Directus
    const event = await createEvent({
      ...validatedData,
      manager_id: finalManagerId,
      manager_email: finalManagerEmail,
    } as Parameters<typeof createEvent>[0])

    if (!event) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Événement "${event.title}" créé avec succès`,
      event,
    })
  } catch (error) {
    console.error('Erreur POST /api/admin/evenements-gestion:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
