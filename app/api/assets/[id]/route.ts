/**
 * API Proxy: Servir les assets Directus avec authentification
 * GET /api/assets/[id] - Récupère un fichier depuis Directus
 */

import { NextRequest, NextResponse } from 'next/server'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Récupérer les paramètres de transformation d'image
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    // Construire l'URL Directus avec les paramètres
    const directusUrl = `${DIRECTUS_URL}/assets/${id}${queryString ? `?${queryString}` : ''}`

    // Récupérer l'asset depuis Directus
    const response = await fetch(directusUrl, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Asset non trouvé' },
        { status: response.status }
      )
    }

    // Récupérer les données binaires
    const buffer = await response.arrayBuffer()

    // Récupérer le content-type
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Retourner l'image avec le bon content-type
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Erreur GET /api/assets/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
