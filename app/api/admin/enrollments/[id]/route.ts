import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITING_LIST', 'INTERVIEW_REQUIRED', 'ACTIVE']).optional(),
  internalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  priority: z.number().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'TEACHER', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    // Filtrer les valeurs undefined pour éviter les erreurs Prisma
    const updateData: any = {}
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.internalNotes !== undefined) updateData.internalNotes = validatedData.internalNotes
    if (validatedData.rejectionReason !== undefined) updateData.rejectionReason = validatedData.rejectionReason
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'inscription' },
      { status: 500 }
    )
  }
}
