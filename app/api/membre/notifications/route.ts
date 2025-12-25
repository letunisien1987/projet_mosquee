/**
 * API Membre: Gestion des notifications
 * GET /api/membre/notifications - Liste des notifications
 * PATCH /api/membre/notifications - Actions groupées (mark-all-read)
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireAuth,
  successResponse,
  ApiError,
} from '@/lib/api/middleware'

// GET - Liste des notifications
export const GET = apiHandler(async (req: NextRequest) => {
  const session = await requireAuth()

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')

  const where = {
    userId: session.user.id,
    ...(unreadOnly ? { read: false } : {}),
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ])

  return successResponse({ notifications, unreadCount })
})

// PATCH - Actions groupées
export const PATCH = apiHandler(async (req: NextRequest) => {
  const session = await requireAuth()

  const body = await req.json()
  const { action } = body

  if (action === 'mark-all-read') {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })

    return successResponse({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
    })
  }

  throw new ApiError('Action non reconnue', 400, 'INVALID_ACTION')
})
