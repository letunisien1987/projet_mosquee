/**
 * API Public: Configuration des logos
 * GET /api/logos - Récupère toutes les configurations de logos par emplacement
 * GET /api/logos?location=HEADER - Récupère la config d'un emplacement spécifique
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LogoLocation } from '@prisma/client'

// Cache les résultats pendant 5 minutes (en production)
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') as LogoLocation | null

    if (location) {
      // Récupérer la config d'un emplacement spécifique
      const config = await prisma.logoLocationConfig.findUnique({
        where: { location },
        include: { logo: true },
      })

      if (!config) {
        return NextResponse.json({ config: null })
      }

      return NextResponse.json({
        config: {
          location: config.location,
          className: config.className,
          logo: {
            id: config.logo.id,
            name: config.logo.name,
            type: config.logo.type,
            colorVariant: config.logo.colorVariant,
            filePath: config.logo.filePath,
            mimeType: config.logo.mimeType,
            width: config.logo.width,
            height: config.logo.height,
          },
        },
      })
    }

    // Récupérer toutes les configs
    const configs = await prisma.logoLocationConfig.findMany({
      include: { logo: true },
    })

    const configMap: Record<string, {
      location: LogoLocation
      className: string | null
      logo: {
        id: string
        name: string
        type: string
        colorVariant: string
        filePath: string
        mimeType: string
        width: number | null
        height: number | null
      }
    }> = {}

    for (const config of configs) {
      configMap[config.location] = {
        location: config.location,
        className: config.className,
        logo: {
          id: config.logo.id,
          name: config.logo.name,
          type: config.logo.type,
          colorVariant: config.logo.colorVariant,
          filePath: config.logo.filePath,
          mimeType: config.logo.mimeType,
          width: config.logo.width,
          height: config.logo.height,
        },
      }
    }

    return NextResponse.json({ configs: configMap })
  } catch (error) {
    console.error('Erreur GET /api/logos:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
