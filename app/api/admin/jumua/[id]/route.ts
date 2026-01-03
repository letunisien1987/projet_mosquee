/**
 * API Admin: Gestion d'un message Jumua spécifique
 * GET /api/admin/jumua/[id] - Détails d'un message
 * PATCH /api/admin/jumua/[id] - Modifier un message
 * DELETE /api/admin/jumua/[id] - Supprimer un message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getJumuaMessageById, updateJumuaMessage, deleteJumuaMessage } from '@/lib/content'
import { z } from 'zod'

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

  // Nettoyer spécifiquement les champs problématiques
  let cleanTimes: string[] | null = null
  if (message.times) {
    if (Array.isArray(message.times)) {
      // Filtrer les valeurs non-string et les objets vides
      const filtered = message.times.filter((t: any) =>
        typeof t === 'string' && t.trim() !== ''
      )
      cleanTimes = filtered.length === 0 ? null : filtered
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

const updateJumuaMessageSchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  image: z.string().optional(),
  times: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  order: z.number().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})

// GET - Détails d'un message Jumua
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const rawMessage = await getJumuaMessageById(id)

    if (!rawMessage) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    // Nettoyer le message pour éviter les objets vides
    const message = sanitizeJumuaMessage(rawMessage)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Erreur GET /api/admin/jumua/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH - Modifier un message Jumua
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const validatedData = updateJumuaMessageSchema.parse(body)

    // Convertir les chaînes vides en undefined pour les champs UUID (image)
    const sanitizedData = {
      ...validatedData,
      image: validatedData.image && validatedData.image.trim() !== '' ? validatedData.image : undefined,
    }

    const message = await updateJumuaMessage(id, sanitizedData)

    if (!message) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Message "${message.title}" mis à jour`,
      data: message,
    })
  } catch (error) {
    console.error('Erreur PATCH /api/admin/jumua/[id]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un message Jumua
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const success = await deleteJumuaMessage(id)

    if (!success) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Message supprimé',
    })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/jumua/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
