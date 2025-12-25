/**
 * API Admin: Gestion des utilisateurs
 * GET /api/admin/users - Liste tous les utilisateurs
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireRoles,
  successResponse,
  FULL_ADMIN_ROLES,
} from '@/lib/api/middleware'

export const GET = apiHandler(async (req: NextRequest) => {
  await requireRoles(FULL_ADMIN_ROLES)

  const { searchParams } = new URL(req.url)
  const includeMemberships = searchParams.get('includeMemberships') === 'true'

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          city: true,
          postalCode: true,
          country: true,
        },
      },
      memberships: includeMemberships
        ? {
            select: {
              id: true,
              type: true,
              status: true,
              paymentStatus: true,
              amount: true,
              startDate: true,
              endDate: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          }
        : false,
      _count: {
        select: {
          memberships: true,
          donations: true,
          eventRegistrations: true,
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse(users)
})
