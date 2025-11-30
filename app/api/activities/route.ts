import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Liste les activités actives (public)
export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        levels: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Erreur GET /api/activities:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
