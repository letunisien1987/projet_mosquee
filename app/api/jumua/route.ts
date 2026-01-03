/**
 * API Publique: Messages Jumua actifs
 * GET /api/jumua - Retourne les messages Jumua actifs pour l'affichage public
 */

import { NextRequest, NextResponse } from 'next/server'
import { getActiveJumuaMessages } from '@/lib/content'

// Vérifie si une valeur est un objet vide {}
const isEmptyObject = (val: any): boolean => {
  if (val === null || val === undefined) return false
  if (typeof val !== 'object') return false
  if (Array.isArray(val)) return false
  return Object.keys(val).length === 0
}

// Nettoie un message Jumua pour éviter les objets vides
const sanitizeJumuaMessage = (message: any) => {
  if (!message) return null

  let cleanTimes: string[] | null = null
  if (message.times) {
    if (Array.isArray(message.times)) {
      const filtered = message.times.filter((t: any) =>
        typeof t === 'string' && t.trim() !== ''
      )
      cleanTimes = filtered.length === 0 ? null : filtered
    } else if (isEmptyObject(message.times)) {
      cleanTimes = null
    }
  }

  return {
    id: message.id,
    title: message.title,
    message: message.message,
    times: cleanTimes,
    image: message.image && typeof message.image === 'string' ? message.image : null,
    valid_from: message.valid_from || null,
    valid_until: message.valid_until || null,
    order: message.order,
  }
}

// GET - Messages Jumua actifs (public)
export async function GET(request: NextRequest) {
  try {
    const rawMessages = await getActiveJumuaMessages()

    // Nettoyer et filtrer les messages
    const messages = rawMessages
      .map(sanitizeJumuaMessage)
      .filter(Boolean)
      .sort((a: any, b: any) => (a?.order || 0) - (b?.order || 0))

    return NextResponse.json({
      messages,
      count: messages.length
    })
  } catch (error) {
    console.error('Erreur GET /api/jumua:', error)
    return NextResponse.json({ error: 'Erreur serveur', messages: [] }, { status: 500 })
  }
}
