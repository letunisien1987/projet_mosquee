/**
 * API Membre: Gestion d'une notification individuelle
 * PATCH /api/membre/notifications/[id] - Marquer comme lue
 * DELETE /api/membre/notifications/[id] - Supprimer
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireAuth,
  requireOwnership,
  successResponse,
  ApiError,
} from '@/lib/api/middleware'

// PATCH - Marquer comme lue
export const PATCH = apiHandler(async (
  _req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const session = await requireAuth()
  const { id } = await context!.params

  const notification = await prisma.notification.findUnique({
    where: { id },
  })

  if (!notification) {
    throw new ApiError('Notification non trouvée', 404, 'NOT_FOUND')
  }

  requireOwnership(notification.userId, session.user.id)

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  })

  return successResponse({ success: true, notification: updated })
})

// DELETE - Supprimer
export const DELETE = apiHandler(async (
  _req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const session = await requireAuth()
  const { id } = await context!.params

  const notification = await prisma.notification.findUnique({
    where: { id },
  })

  if (!notification) {
    throw new ApiError('Notification non trouvée', 404, 'NOT_FOUND')
  }

  requireOwnership(notification.userId, session.user.id)

  await prisma.notification.delete({
    where: { id },
  })

  return successResponse({ success: true })
})
