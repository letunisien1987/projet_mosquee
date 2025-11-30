import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const activitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['QURAN', 'ARABIC', 'SUNDAY_SCHOOL', 'HALAQAT', 'WOMEN', 'SUPPORT', 'OTHER']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  order: z.number().optional(),
})

// GET - Récupérer une activité spécifique
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        levels: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Erreur GET /api/admin/activities/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une activité
export async function PUT(
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
    const validatedData = activitySchema.parse(body)

    const activity = await prisma.activity.update({
      where: { id },
      data: validatedData,
      include: {
        levels: true,
      },
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Erreur PUT /api/admin/activities/[id]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une activité
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await prisma.activity.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Activité supprimée avec succès' })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/activities/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
