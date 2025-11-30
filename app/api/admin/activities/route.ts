import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validation pour les activités
const activitySchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  category: z.enum(['QURAN', 'ARABIC', 'SUNDAY_SCHOOL', 'HALAQAT', 'WOMEN', 'SUPPORT', 'OTHER']),
  icon: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  order: z.number().optional(),
})

// GET - Liste toutes les activités
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const activities = await prisma.activity.findMany({
      include: {
        levels: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Erreur GET /api/admin/activities:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle activité
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = activitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: validatedData,
      include: {
        levels: true,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/admin/activities:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
