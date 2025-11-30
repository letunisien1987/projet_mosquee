import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const levelSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  schedule: z.string().min(1, 'L\'horaire est requis'),
  instructor: z.string().min(1, 'L\'enseignant est requis'),
  participants: z.string().optional(),
  details: z.string().min(1, 'Les détails sont requis'),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  price: z.number().optional(),
  maxCapacity: z.number().optional(),
  order: z.number().optional(),
})

// POST - Ajouter un niveau à une activité
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = levelSchema.parse(body)

    const level = await prisma.activityLevel.create({
      data: {
        ...validatedData,
        activityId: id,
      },
    })

    return NextResponse.json(level, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/admin/activities/[id]/levels:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
