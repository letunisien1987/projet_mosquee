/**
 * API Admin: Liste des inscriptions aux événements
 * GET /api/admin/event-registrations
 */

import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireRoles,
  successResponse,
  ADMIN_ROLES,
} from '@/lib/api/middleware'

export const GET = apiHandler(async () => {
  await requireRoles(ADMIN_ROLES)

  const registrations = await prisma.eventRegistration.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(registrations)
})
