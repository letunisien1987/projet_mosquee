/**
 * API: Favicon dynamique
 * GET /api/favicon - Sert le favicon configuré en base de données
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Cache de 1 heure pour le favicon
export const revalidate = 3600

export async function GET() {
  try {
    // Chercher la configuration du favicon en base de données
    const config = await prisma.logoLocationConfig.findUnique({
      where: { location: 'FAVICON' },
      include: { logo: true },
    })

    let faviconPath: string
    let mimeType: string

    if (config?.logo) {
      // Utiliser le favicon configuré
      faviconPath = path.join(process.cwd(), 'public', config.logo.filePath)
      mimeType = config.logo.mimeType
    } else {
      // Fallback sur le favicon par défaut
      faviconPath = path.join(process.cwd(), 'public', 'logos', 'favicon', 'favicon.ico')
      mimeType = 'image/x-icon'
    }

    // Vérifier que le fichier existe
    if (!existsSync(faviconPath)) {
      return new NextResponse('Favicon not found', { status: 404 })
    }

    // Lire et servir le fichier
    const fileBuffer = await readFile(faviconPath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Erreur GET /api/favicon:', error)

    // En cas d'erreur, essayer de servir le favicon par défaut
    try {
      const defaultPath = path.join(process.cwd(), 'public', 'logos', 'favicon', 'favicon.ico')
      if (existsSync(defaultPath)) {
        const fileBuffer = await readFile(defaultPath)
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'image/x-icon',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch {
      // Ignore
    }

    return new NextResponse('Favicon error', { status: 500 })
  }
}
