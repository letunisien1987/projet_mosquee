/**
 * API Admin: Gestion des messages Jumua (CRUD vers Directus)
 * GET /api/admin/jumua - Liste tous les messages
 * POST /api/admin/jumua - Créer un nouveau message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAllJumuaMessages, createJumuaMessage } from '@/lib/directus'
import { z } from 'zod'

// Vérifie si une valeur est un objet vide {}
const isEmptyObject = (val: any): boolean => {
  if (val === null || val === undefined) return false
  if (typeof val !== 'object') return false
  if (Array.isArray(val)) return false
  return Object.keys(val).length === 0
}

// Nettoie récursivement les objets vides d'une valeur
const sanitizeValue = (val: any): any => {
  if (val === null || val === undefined) return null
  if (isEmptyObject(val)) return null
  if (typeof val !== 'object') return val

  // Pour les tableaux, filtrer les objets vides et les valeurs null
  if (Array.isArray(val)) {
    const cleaned = val
      .map(item => sanitizeValue(item))
      .filter(item => item !== null && !isEmptyObject(item))
    return cleaned.length === 0 ? null : cleaned
  }

  // Pour les objets, nettoyer chaque propriété
  const cleaned: Record<string, any> = {}
  for (const [key, value] of Object.entries(val)) {
    const sanitized = sanitizeValue(value)
    if (sanitized !== null) {
      cleaned[key] = sanitized
    }
  }
  return Object.keys(cleaned).length === 0 ? null : cleaned
}

// Nettoie un message Jumua pour éviter les objets vides
const sanitizeJumuaMessage = (message: any) => {
  if (!message) return null

  // Nettoyer spécifiquement les champs problématiques
  let cleanTimes: string[] | null = null
  if (message.times) {
    if (Array.isArray(message.times)) {
      // Filtrer les valeurs non-string et les objets vides
      cleanTimes = message.times.filter((t: any) =>
        typeof t === 'string' && t.trim() !== ''
      )
      if (cleanTimes.length === 0) cleanTimes = null
    } else if (isEmptyObject(message.times)) {
      cleanTimes = null
    }
  }

  return {
    ...message,
    times: cleanTimes,
    image: message.image && typeof message.image === 'string' ? message.image : null,
  }
}

const jumuaMessageSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  message: z.string().min(1, 'Le message est requis'),
  image: z.string().optional(),
  times: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  order: z.number().default(0),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})

// GET - Liste tous les messages Jumua
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'IMAM', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const rawMessages = await getAllJumuaMessages()

    // Nettoyer les messages pour éviter les objets vides
    const messages = rawMessages.map(sanitizeJumuaMessage).filter(Boolean)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur GET /api/admin/jumua:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau message Jumua
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || !['ADMIN', 'IMAM'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Non autorisé - Admin ou Imam requis' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = jumuaMessageSchema.parse(body)

    // Convertir les chaînes vides en null pour les champs UUID (image)
    const sanitizedData = {
      ...validatedData,
      image: validatedData.image && validatedData.image.trim() !== '' ? validatedData.image : null,
    }

    const message = await createJumuaMessage(sanitizedData)

    if (!message) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Message "${message.title}" créé avec succès`,
      data: message,
    })
  } catch (error) {
    console.error('Erreur POST /api/admin/jumua:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
