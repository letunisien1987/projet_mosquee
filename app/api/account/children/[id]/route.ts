/**
 * API Account: Gestion d'un enfant spécifique
 * GET /api/account/children/[id] - Détails d'un enfant
 * PATCH /api/account/children/[id] - Modifier un enfant
 * DELETE /api/account/children/[id] - Supprimer un enfant
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireAuth,
  successResponse,
  ApiError,
} from '@/lib/api/middleware'
import { updateChildSchema } from '@/lib/schemas'

// GET - Détails d'un enfant
export const GET = apiHandler(async (
  _req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const session = await requireAuth()
  const { id } = await context!.params

  const child = await prisma.child.findFirst({
    where: { id, parentId: session.user.id },
    include: {
      enrollments: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      eventRegistrations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!child) {
    throw new ApiError('Enfant introuvable', 404, 'NOT_FOUND')
  }

  return successResponse({ child })
})

// PATCH - Modifier un enfant
export const PATCH = apiHandler(async (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const session = await requireAuth()
  const { id } = await context!.params

  const existingChild = await prisma.child.findFirst({
    where: { id, parentId: session.user.id },
  })

  if (!existingChild) {
    throw new ApiError('Enfant introuvable', 404, 'NOT_FOUND')
  }

  const body = await req.json()
  const validatedData = updateChildSchema.parse(body)

  // Préparer les données de mise à jour
  const updateData: Record<string, unknown> = {}
  if (validatedData.firstName) updateData.firstName = validatedData.firstName
  if (validatedData.lastName) updateData.lastName = validatedData.lastName
  if (validatedData.nickName !== undefined) updateData.nickName = validatedData.nickName
  if (validatedData.birthDate) updateData.birthDate = new Date(validatedData.birthDate)
  if (validatedData.gender) updateData.gender = validatedData.gender
  if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
  if (validatedData.avatarUrl !== undefined) updateData.avatarUrl = validatedData.avatarUrl || null

  const child = await prisma.child.update({
    where: { id },
    data: updateData,
  })

  return successResponse({
    success: true,
    child,
    message: 'Enfant modifié avec succès',
  })
})

// DELETE - Supprimer un enfant
export const DELETE = apiHandler(async (
  _req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const session = await requireAuth()
  const { id } = await context!.params

  const existingChild = await prisma.child.findFirst({
    where: { id, parentId: session.user.id },
    include: {
      _count: {
        select: {
          enrollments: true,
          eventRegistrations: true,
        },
      },
    },
  })

  if (!existingChild) {
    throw new ApiError('Enfant introuvable', 404, 'NOT_FOUND')
  }

  // Vérifier les inscriptions actives
  const hasActiveRegistrations =
    existingChild._count.enrollments > 0 ||
    existingChild._count.eventRegistrations > 0

  if (hasActiveRegistrations) {
    throw new ApiError(
      'Impossible de supprimer cet enfant car il a des inscriptions actives',
      400,
      'HAS_REGISTRATIONS'
    )
  }

  await prisma.child.delete({ where: { id } })

  return successResponse({
    success: true,
    message: 'Enfant supprimé avec succès',
  })
})
