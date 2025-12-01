import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Validation schema for creating/updating a child
const childSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  nickName: z.string().optional(),
  birthDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

// GET /api/account/children - List all children for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const children = await prisma.child.findMany({
      where: {
        parentId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
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

    return NextResponse.json({ children })
  } catch (error) {
    console.error('Error fetching children:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des enfants' },
      { status: 500 }
    )
  }
}

// POST /api/account/children - Create a new child
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = childSchema.parse(body)

    // Convert birthDate string to Date
    const birthDate = new Date(validatedData.birthDate)

    // Create the child
    const child = await prisma.child.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        nickName: validatedData.nickName,
        birthDate,
        gender: validatedData.gender,
        notes: validatedData.notes,
        avatarUrl: validatedData.avatarUrl,
        parentId: session.user.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        child,
        message: 'Enfant ajouté avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating child:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de l\'enfant' },
      { status: 500 }
    )
  }
}
