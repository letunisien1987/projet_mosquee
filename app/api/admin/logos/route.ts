/**
 * API Admin: Gestion des logos
 * GET /api/admin/logos - Liste tous les logos
 * POST /api/admin/logos - Upload un nouveau logo
 * DELETE /api/admin/logos?id=xxx - Supprime un logo
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { LogoType, LogoColorVariant } from '@prisma/client'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'logos', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon']

// GET: Liste tous les logos
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'IMAM', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const logos = await prisma.logo.findMany({
      orderBy: [
        { type: 'asc' },
        { colorVariant: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        locationConfigs: true,
      },
    })

    return NextResponse.json({ logos })
  } catch (error) {
    console.error('Erreur GET /api/admin/logos:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Upload un nouveau logo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'IMAM', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string
    const type = formData.get('type') as LogoType
    const colorVariant = formData.get('colorVariant') as LogoColorVariant

    // Validations
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!name || !type || !colorVariant) {
      return NextResponse.json({ error: 'Nom, type et variante requis' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Type de fichier non autorisé. Utilisez PNG, JPG, SVG, WEBP ou ICO.'
      }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'Fichier trop volumineux. Maximum 5MB.'
      }, { status: 400 })
    }

    // Créer le répertoire si nécessaire
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Générer un nom unique
    const ext = path.extname(file.name)
    const uniqueName = `${type.toLowerCase()}-${colorVariant.toLowerCase()}-${Date.now()}${ext}`
    const filePath = path.join(UPLOAD_DIR, uniqueName)
    const publicPath = `/logos/uploads/${uniqueName}`

    // Écrire le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Obtenir les dimensions de l'image (si disponible)
    let width: number | null = null
    let height: number | null = null

    // Pour les SVG, on ne peut pas facilement obtenir les dimensions côté serveur
    // On les laisse null et on pourrait les mettre à jour côté client si nécessaire

    // Créer l'entrée en base de données
    const logo = await prisma.logo.create({
      data: {
        name,
        type,
        colorVariant,
        filePath: publicPath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height,
        isDefault: false,
      },
    })

    return NextResponse.json({ success: true, logo })
  } catch (error) {
    console.error('Erreur POST /api/admin/logos:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Supprime un logo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Seuls les admins peuvent supprimer des logos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Récupérer le logo
    const logo = await prisma.logo.findUnique({
      where: { id },
      include: { locationConfigs: true },
    })

    if (!logo) {
      return NextResponse.json({ error: 'Logo non trouvé' }, { status: 404 })
    }

    // Vérifier si le logo est utilisé
    if (logo.locationConfigs.length > 0) {
      return NextResponse.json({
        error: 'Ce logo est utilisé. Changez la configuration des emplacements avant de le supprimer.'
      }, { status: 400 })
    }

    // Supprimer le fichier physique (seulement pour les fichiers uploadés)
    if (logo.filePath.startsWith('/logos/uploads/')) {
      const physicalPath = path.join(process.cwd(), 'public', logo.filePath)
      try {
        await unlink(physicalPath)
      } catch {
        console.warn('Fichier non trouvé:', physicalPath)
      }
    }

    // Supprimer de la base de données
    await prisma.logo.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/logos:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
