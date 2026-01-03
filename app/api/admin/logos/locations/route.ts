/**
 * API Admin: Configuration des logos par emplacement
 * GET /api/admin/logos/locations - Liste toutes les configurations
 * PUT /api/admin/logos/locations - Met à jour une configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LogoLocation } from '@prisma/client'

// GET: Liste toutes les configurations de logo par emplacement
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const configs = await prisma.logoLocationConfig.findMany({
      include: {
        logo: true,
      },
      orderBy: { location: 'asc' },
    })

    // Retourner aussi la liste des emplacements possibles
    const locations = Object.values(LogoLocation)

    return NextResponse.json({ configs, locations })
  } catch (error) {
    console.error('Erreur GET /api/admin/logos/locations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT: Met à jour ou crée une configuration
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { location, logoId, className } = body as {
      location: LogoLocation
      logoId: string
      className?: string
    }

    if (!location || !logoId) {
      return NextResponse.json({ error: 'Emplacement et logo requis' }, { status: 400 })
    }

    // Vérifier que le logo existe
    const logo = await prisma.logo.findUnique({ where: { id: logoId } })
    if (!logo) {
      return NextResponse.json({ error: 'Logo non trouvé' }, { status: 404 })
    }

    // Upsert: mettre à jour si existe, sinon créer
    const config = await prisma.logoLocationConfig.upsert({
      where: { location },
      update: {
        logoId,
        className: className || null,
      },
      create: {
        location,
        logoId,
        className: className || null,
      },
      include: { logo: true },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Erreur PUT /api/admin/logos/locations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Supprime une configuration (remet à défaut)
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

    if (!user || !['ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Seuls les admins peuvent supprimer' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') as LogoLocation

    if (!location) {
      return NextResponse.json({ error: 'Emplacement requis' }, { status: 400 })
    }

    await prisma.logoLocationConfig.delete({
      where: { location },
    }).catch(() => {
      // Config n'existe pas, pas grave
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE /api/admin/logos/locations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
