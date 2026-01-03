/**
 * API Admin: Upload de fichiers vers Cloudinary
 * POST /api/admin/upload - Upload un fichier
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImageFromFile, CLOUDINARY_FOLDERS, type CloudinaryFolder } from '@/lib/cloudinary'

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
    const folderParam = formData.get('folder') as string | null

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

    // Déterminer le dossier Cloudinary
    const folder: CloudinaryFolder = (folderParam && folderParam in CLOUDINARY_FOLDERS)
      ? folderParam as CloudinaryFolder
      : 'general'

    // Upload vers Cloudinary
    const result = await uploadImageFromFile(file, folder)

    return NextResponse.json({
      success: true,
      fileId: result.publicId,
      url: result.url,
      width: result.width,
      height: result.height,
    })

  } catch (error) {
    console.error('Erreur POST /api/admin/upload:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
