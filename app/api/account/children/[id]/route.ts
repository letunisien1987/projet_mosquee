import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const childUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  nickName: z.string().optional(),
  birthDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

// GET /api/account/children/[id] - Get a specific child
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id } = await params

    const child = await prisma.child.findFirst({
      where: {
        id,
        parentId: session.user.id, // Ensure user owns this child
      },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        eventRegistrations: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!child) {
      return NextResponse.json(
        { error: 'Enfant introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({ child })
  } catch (error) {
    console.error('Error fetching child:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'enfant' },
      { status: 500 }
    )
  }
}

// PATCH /api/account/children/[id] - Update a child
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = childUpdateSchema.parse(body)

    // Check if child exists and belongs to user
    const existingChild = await prisma.child.findFirst({
      where: {
        id,
        parentId: session.user.id,
      },
    })

    if (!existingChild) {
      return NextResponse.json(
        { error: 'Enfant introuvable' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (validatedData.firstName) updateData.firstName = validatedData.firstName
    if (validatedData.lastName) updateData.lastName = validatedData.lastName
    if (validatedData.nickName !== undefined) updateData.nickName = validatedData.nickName
    if (validatedData.birthDate) updateData.birthDate = new Date(validatedData.birthDate)
    if (validatedData.gender) updateData.gender = validatedData.gender
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.avatarUrl !== undefined) updateData.avatarUrl = validatedData.avatarUrl || null

    // Update the child
    const child = await prisma.child.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      child,
      message: 'Enfant modifié avec succès',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating child:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'enfant' },
      { status: 500 }
    )
  }
}

// DELETE /api/account/children/[id] - Delete a child
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if child exists and belongs to user
    const existingChild = await prisma.child.findFirst({
      where: {
        id,
        parentId: session.user.id,
      },
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
      return NextResponse.json(
        { error: 'Enfant introuvable' },
        { status: 404 }
      )
    }

    // Check if child has active registrations
    const hasActiveRegistrations =
      existingChild._count.enrollments > 0 ||
      existingChild._count.eventRegistrations > 0

    if (hasActiveRegistrations) {
      return NextResponse.json(
        {
          error: 'Impossible de supprimer cet enfant car il a des inscriptions actives',
          details: {
            enrollments: existingChild._count.enrollments,
            eventRegistrations: existingChild._count.eventRegistrations,
          },
        },
        { status: 400 }
      )
    }

    // Delete the child
    await prisma.child.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Enfant supprimé avec succès',
    })
  } catch (error) {
    console.error('Error deleting child:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'enfant' },
      { status: 500 }
    )
  }
}
