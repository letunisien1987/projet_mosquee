/**
 * API Account: Gestion des enfants
 * GET /api/account/children - Liste des enfants
 * POST /api/account/children - Créer un enfant
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireAuth,
  successResponse,
} from '@/lib/api/middleware'
import { createChildSchema } from '@/lib/schemas'

// GET - Liste des enfants
export const GET = apiHandler(async () => {
  const session = await requireAuth()

  const children = await prisma.child.findMany({
    where: { parentId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          enrollments: true,
          eventRegistrations: true,
        },
      },
    },
  })

  return successResponse({ children })
})

// POST - Créer un enfant
export const POST = apiHandler(async (req: NextRequest) => {
  const session = await requireAuth()

  const body = await req.json()
  const validatedData = createChildSchema.parse(body)

  const child = await prisma.child.create({
    data: {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      nickName: validatedData.nickName,
      birthDate: new Date(validatedData.birthDate),
      gender: validatedData.gender,
      notes: validatedData.notes,
      avatarUrl: validatedData.avatarUrl,
      parentId: session.user.id,
    },
  })

  return successResponse(
    { success: true, child, message: 'Enfant ajouté avec succès' },
    201
  )
})
