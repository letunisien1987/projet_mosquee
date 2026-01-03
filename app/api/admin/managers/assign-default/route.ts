/**
 * API Admin: Assigner un responsable par défaut à toutes les activités/événements sans responsable
 * POST /api/admin/managers/assign-default
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assignDefaultManagerToActivities, assignDefaultManagerToEvents } from '@/lib/content'

// POST - Assigner le responsable par défaut (admin) à tous les éléments sans responsable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin requis' }, { status: 403 })
    }

    // Récupérer le premier admin comme responsable par défaut
    const defaultAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'asc' },
    })

    if (!defaultAdmin || !defaultAdmin.email) {
      return NextResponse.json({ error: 'Aucun admin trouvé' }, { status: 404 })
    }

    // Assigner aux activités
    const activitiesCount = await assignDefaultManagerToActivities(
      defaultAdmin.id,
      defaultAdmin.email
    )

    // Assigner aux événements
    const eventsCount = await assignDefaultManagerToEvents(
      defaultAdmin.id,
      defaultAdmin.email
    )

    return NextResponse.json({
      success: true,
      message: `Responsable par défaut assigné`,
      details: {
        defaultManager: `${defaultAdmin.firstName} ${defaultAdmin.lastName}`,
        activitiesUpdated: activitiesCount,
        eventsUpdated: eventsCount,
      },
    })
  } catch (error) {
    console.error('Erreur POST /api/admin/managers/assign-default:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
