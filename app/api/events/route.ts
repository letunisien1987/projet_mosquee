import { NextResponse } from 'next/server'
import { getPublishedEvents } from '@/lib/content'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const events = await getPublishedEvents()
    return NextResponse.json(events)
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
