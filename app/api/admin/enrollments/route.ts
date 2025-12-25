/**
 * API Admin: Liste des inscriptions aux activités
 * GET /api/admin/enrollments
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

  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          birthDate: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(enrollments)
})
