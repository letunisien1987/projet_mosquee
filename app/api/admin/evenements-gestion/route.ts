/**
 * API Admin: Gestion des événements (CRUD vers Directus)
 * GET /api/admin/evenements-gestion - Liste tous les événements
 * POST /api/admin/evenements-gestion - Créer un nouvel événement
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllEvents, createEvent, getEventsByManager } from '@/lib/directus'
import {
  apiHandler,
  requirePermission,
  successResponse,
  FULL_ADMIN_ROLES,
} from '@/lib/api/middleware'
import { eventSchema, sanitizeContentItem } from '@/lib/schemas'

// GET - Liste tous les événements (filtrés par rôle)
export const GET = apiHandler(async () => {
  const session = await requirePermission('VIEW_EVENTS')
  const { role, id: userId } = session.user

  // ADMIN, IMAM, STAFF voient tout; MANAGER/TEACHER voient leurs événements
  const isFullAccess = FULL_ADMIN_ROLES.includes(role)

  const events = isFullAccess
    ? await getAllEvents()
    : await getEventsByManager(userId)

  // Compter les inscriptions et nettoyer les données
  const eventsWithStats = await Promise.all(
    events.map(async (event) => {
      const registrationCount = await prisma.eventRegistration.count({
        where: { eventId: event.id.toString() },
      })

      return {
        ...sanitizeContentItem(event),
        registrationCount,
        isManager: event.manager_id === userId,
      }
    })
  )

  return successResponse({ events: eventsWithStats, isFullAccess })
})

// POST - Créer un nouvel événement
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await requirePermission('MANAGE_EVENTS')
  const { id: userId } = session.user

  // Récupérer l'email de l'utilisateur
  const adminUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })

  const body = await req.json()
  const validatedData = eventSchema.parse(body)

  // Déterminer le responsable
  let finalManagerId = validatedData.manager_id || userId
  let finalManagerEmail = validatedData.manager_email

  if (validatedData.manager_id && !validatedData.manager_email) {
    const manager = await prisma.user.findUnique({
      where: { id: validatedData.manager_id },
      select: { email: true },
    })
    finalManagerEmail = manager?.email || undefined
  } else if (!validatedData.manager_id) {
    finalManagerEmail = adminUser?.email || undefined
  }

  // Créer l'événement dans Directus
  const event = await createEvent({
    ...validatedData,
    manager_id: finalManagerId,
    manager_email: finalManagerEmail,
  } as Parameters<typeof createEvent>[0])

  return successResponse({
    success: true,
    message: `Événement "${event.title}" créé avec succès`,
    event,
  })
})
