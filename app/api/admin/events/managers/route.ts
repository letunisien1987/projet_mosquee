/**
 * API Admin: Gestion des responsables d'événements
 * GET /api/admin/events/managers - Liste événements avec leurs responsables
 * POST /api/admin/events/managers - Assigner un responsable
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEvents, assignEventManager, removeEventManager } from '@/lib/directus'
import { z } from 'zod'

const assignSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().uuid().nullable(),
})

// GET - Liste tous les événements avec leurs responsables
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'IMAM', 'STAFF'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer tous les événements depuis Directus (publiés et non publiés)
    const events = await getEvents(false)

    // Pour chaque événement avec un manager_id, récupérer les infos du manager
    const eventsWithManagers = await Promise.all(
      events.map(async (event: any) => {
        let manager = null
        if (event.manager_id) {
          manager = await prisma.user.findUnique({
            where: { id: event.manager_id },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          })
        }
        return {
          ...event,
          manager,
        }
      })
    )

    // Récupérer la liste des utilisateurs pouvant être responsables
    const potentialManagers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'IMAM', 'STAFF', 'TEACHER', 'MEMBER'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    })

    return NextResponse.json({
      events: eventsWithManagers,
      potentialManagers,
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/events/managers:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Assigner ou retirer un responsable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || !['ADMIN', 'IMAM'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Non autorisé - Admin ou Imam requis' }, { status: 403 })
    }

    const body = await request.json()
    const { eventId, userId } = assignSchema.parse(body)

    if (userId === null) {
      // Retirer le responsable
      const success = await removeEventManager(eventId)
      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Responsable retiré',
        })
      } else {
        return NextResponse.json({ error: 'Erreur lors du retrait' }, { status: 500 })
      }
    }

    // Assigner un nouveau responsable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const event = await assignEventManager(eventId, user.id, user.email!)

    if (event) {
      // Créer une notification pour le nouveau responsable
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'Nouvelle responsabilité',
          message: `Vous avez été désigné responsable de l'événement "${event.title}". Vous pouvez maintenant gérer les inscriptions depuis votre espace membre.`,
          link: '/membre/mes-evenements',
          read: false,
          emailSent: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: `${user.firstName} ${user.lastName} est maintenant responsable de "${event.title}"`,
        event,
      })
    } else {
      return NextResponse.json({ error: 'Erreur lors de l\'assignation' }, { status: 500 })
    }
  } catch (error) {
    console.error('Erreur POST /api/admin/events/managers:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
