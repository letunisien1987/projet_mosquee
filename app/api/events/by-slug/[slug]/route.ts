import { NextRequest, NextResponse } from 'next/server'
import { getEventBySlug, getEventById } from '@/lib/content'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Essayer d'abord par slug
    let event = await getEventBySlug(slug)

    // Si pas trouvé par slug, essayer par ID (pour compatibilité)
    if (!event) {
      const eventById = await getEventById(slug)
      event = eventById as typeof event
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
