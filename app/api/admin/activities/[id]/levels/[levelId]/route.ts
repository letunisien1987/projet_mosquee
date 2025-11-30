import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const levelSchema = z.object({
  name: z.string().min(1).optional(),
  schedule: z.string().min(1).optional(),
  instructor: z.string().min(1).optional(),
  participants: z.string().optional(),
  details: z.string().min(1).optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  price: z.number().optional(),
  maxCapacity: z.number().optional(),
  order: z.number().optional(),
})

// PUT - Mettre à jour un niveau
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  const { id, levelId } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = levelSchema.parse(body)

    const level = await prisma.activityLevel.update({
      where: { id: levelId },
      data: validatedData,
    })

    return NextResponse.json(level)
  } catch (error) {
    console.error('Erreur PUT /api/admin/activities/[id]/levels/[levelId]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un niveau
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; levelId: string }> }
) {
  const { id, levelId } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await prisma.activityLevel.delete({
      where: { id: levelId },
    })

    return NextResponse.json({ message: 'Niveau supprimé avec succès' })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/activities/[id]/levels/[levelId]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
