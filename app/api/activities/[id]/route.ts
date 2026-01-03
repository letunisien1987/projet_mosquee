import { NextRequest, NextResponse } from 'next/server'
import { getActivityById } from '@/lib/content'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'

// GET - Récupère une activité par ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const activity = await getActivityById(id)

    if (!activity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Erreur GET /api/activities/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
