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
  // === INFORMATIONS DE BASE ===
  title: z.string()
    .min(1, '⚠️ Le titre est obligatoire - Donnez un nom clair à votre événement (ex: "Conférence sur le Ramadan")')
    .min(3, '⚠️ Le titre doit contenir au moins 3 caractères pour être explicite'),
  slug: z.string()
    .min(1, '⚠️ Le slug est obligatoire - Il sera généré automatiquement à partir du titre')
    .regex(/^[a-z0-9-]+$/, '⚠️ Le slug ne peut contenir que des lettres minuscules, chiffres et tirets (ex: conference-ramadan)'),
  description: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, {
      message: '💡 Astuce: Une description d\'au moins 10 caractères aide les participants à comprendre l\'événement'
    }),
  content: z.string().optional(),
  category: z.enum(['religieux', 'communaute', 'education', 'charite'], {
    message: '⚠️ Choisissez une catégorie: religieux, communauté, éducation ou charité'
  }),

  // === DATE ET HORAIRES ===
  date: z.string()
    .min(1, '⚠️ La date est obligatoire - Quand aura lieu l\'événement?')
    .refine(val => {
      const eventDate = new Date(val)
      return eventDate >= new Date(new Date().setHours(0, 0, 0, 0))
    }, { message: '⚠️ La date ne peut pas être dans le passé' }),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string()
    .optional()
    .refine(val => !val || val.length >= 3, {
      message: '💡 Précisez le lieu (ex: "Salle de prière principale", "En ligne via Zoom")'
    }),
  image: z.string().optional(),

  // === INSCRIPTIONS ===
  registration_required: z.boolean().default(false),
  max_capacity: z.number()
    .optional()
    .refine(val => !val || val >= 1, {
      message: '⚠️ La capacité doit être d\'au moins 1 personne'
    }),
  requires_approval: z.boolean().default(false),
  registration_deadline: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),

  // === PAIEMENT ===
  price: z.number()
    .optional()
    .refine(val => !val || val >= 0, {
      message: '⚠️ Le prix ne peut pas être négatif'
    }),
  payment_type: z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION'], {
    message: '⚠️ Choisissez: Gratuit, Paiement unique ou Abonnement'
  }).default('FREE'),
  subscription_interval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  stripe_price_id: z.string().optional(),

  // === POLITIQUE DE REMBOURSEMENT ===
  allow_refund: z.boolean().default(true),
  cancellation_deadline_days: z.number()
    .min(0, '⚠️ Le délai ne peut pas être négatif')
    .max(365, '⚠️ Le délai ne peut pas dépasser 365 jours')
    .default(7),

  // === TARIFICATION AVANCÉE (multi-prix famille, groupe, etc.) ===
  pricing: z.object({
    adult_price: z.number()
      .min(0, '⚠️ Le prix adulte ne peut pas être négatif'),
    child_price: z.number()
      .min(0, '⚠️ Le prix enfant ne peut pas être négatif'),
    child_free_until_age: z.number()
      .min(0, '⚠️ L\'âge minimum est 0')
      .max(18, '⚠️ L\'âge maximum pour enfant gratuit est 18 ans')
      .default(0),
    group_discount: z.object({
      enabled: z.boolean().default(false),
      from_persons: z.number()
        .min(2, '⚠️ La réduction groupe doit s\'appliquer à partir de 2 personnes minimum')
        .default(4),
      discount_percent: z.number()
        .min(0, '⚠️ La réduction ne peut pas être négative')
        .max(100, '⚠️ La réduction ne peut pas dépasser 100%')
        .default(10),
    }),
    family_max_price: z.number()
      .nullable()
      .optional()
      .refine(val => !val || val > 0, {
        message: '💡 Le plafond famille doit être supérieur à 0 CHF pour être utile'
      }),
    early_bird: z.object({
      enabled: z.boolean().default(false),
      until_date: z.string().nullable().optional(),
      discount_percent: z.number()
        .min(0, '⚠️ La réduction ne peut pas être négative')
        .max(100, '⚠️ La réduction ne peut pas dépasser 100%')
        .default(15),
    }),
  }).nullable().optional(),

  // === RESPONSABLE ===
  manager_id: z.string()
    .uuid('⚠️ L\'identifiant du responsable n\'est pas valide')
    .optional(),
  manager_email: z.string()
    .email('⚠️ L\'adresse email du responsable n\'est pas valide (ex: nom@exemple.com)')
    .optional(),

  // === RESTRICTIONS ===
  restrictions: z.object({
    enabled: z.boolean().default(false),
    participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED'], {
      message: '⚠️ Choisissez: Individuel, Famille ou Mixte'
    }).optional(),
    allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL'], {
      message: '⚠️ Choisissez: Hommes, Femmes, Enfants ou Tous'
    }).optional(),
    min_age: z.number()
      .nullable()
      .optional()
      .refine(val => !val || val >= 0, { message: '⚠️ L\'âge minimum ne peut pas être négatif' }),
    max_age: z.number()
      .nullable()
      .optional()
      .refine(val => !val || val <= 120, { message: '⚠️ L\'âge maximum semble trop élevé' }),
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

    // Créer l'événement dans Directus (lance une erreur si échec)
    const event = await createEvent({
      ...validatedData,
      manager_id: finalManagerId,
      manager_email: finalManagerEmail,
    } as Parameters<typeof createEvent>[0])

    return NextResponse.json({
      success: true,
      message: `Événement "${event.title}" créé avec succès`,
      event,
    })
  } catch (error: unknown) {
    console.error('Erreur POST /api/admin/evenements-gestion:', error)

    // Erreurs de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Veuillez corriger les champs suivants',
        details: error.issues.map(issue => ({
          path: issue.path,
          message: issue.message
        }))
      }, { status: 400 })
    }

    // Erreurs Directus
    const err = error as { errors?: Array<{ message?: string }>; message?: string }
    if (err.errors && Array.isArray(err.errors)) {
      return NextResponse.json({
        error: 'Erreur Directus',
        details: err.errors.map((e: { message?: string }) => ({
          path: ['directus'],
          message: e.message || 'Erreur inconnue'
        }))
      }, { status: 500 })
    }

    // Erreur générique avec message
    const errorMessage = err.message || 'Une erreur inattendue est survenue'
    return NextResponse.json({
      error: 'Erreur serveur',
      details: [{ path: ['serveur'], message: errorMessage }]
    }, { status: 500 })
  }
}
