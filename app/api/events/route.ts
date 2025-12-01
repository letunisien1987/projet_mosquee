import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/directus'

export async function GET() {
  try {
    const events = await getEvents()
    return NextResponse.json(events)
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
