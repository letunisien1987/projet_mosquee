/**
 * API Admin: Upload de fichiers vers Directus
 * POST /api/admin/upload - Upload un fichier
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || !['ADMIN', 'IMAM', 'STAFF'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer le fichier depuis FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP.'
      }, { status: 400 })
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Fichier trop volumineux. Maximum 5MB.'
      }, { status: 400 })
    }

    // Créer le FormData pour Directus
    const directusFormData = new FormData()
    directusFormData.append('file', file)

    // Upload vers Directus
    const response = await fetch(`${DIRECTUS_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: directusFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Erreur upload Directus:', errorData)
      return NextResponse.json({
        error: 'Erreur lors de l\'upload vers Directus'
      }, { status: 500 })
    }

    const data = await response.json()
    const fileId = data.data?.id

    if (!fileId) {
      return NextResponse.json({
        error: 'Erreur: ID de fichier non retourné'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      fileId: fileId,
      url: `${DIRECTUS_URL}/assets/${fileId}`,
    })

  } catch (error) {
    console.error('Erreur POST /api/admin/upload:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
