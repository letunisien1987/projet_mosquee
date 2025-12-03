/**
 * API Admin: Gestion d'une inscription specifique
 * GET /api/admin/event-registrations/[id] - Details d'une inscription
 * PATCH /api/admin/event-registrations/[id] - Modifier le statut
 * DELETE /api/admin/event-registrations/[id] - Supprimer une inscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Details d'une inscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvee' }, { status: 404 })
    }

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Error fetching registration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation' },
      { status: 500 }
    )
  }
}

// PATCH - Modifier le statut d'une inscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLIST'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvee' }, { status: 404 })
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id },
      data: { status },
    })

    // Creer une notification pour l'utilisateur si l'inscription est confirmee ou annulee
    if (registration.userId && (status === 'CONFIRMED' || status === 'CANCELLED')) {
      const notificationType = status === 'CONFIRMED'
        ? 'EVENT_CONFIRMATION'
        : 'EVENT_CANCELLED'

      const message = status === 'CONFIRMED'
        ? `Votre inscription a "${registration.eventTitle}" a ete confirmee.`
        : `Votre inscription a "${registration.eventTitle}" a ete annulee.`

      await prisma.notification.create({
        data: {
          userId: registration.userId,
          type: notificationType,
          title: status === 'CONFIRMED' ? 'Inscription confirmee' : 'Inscription annulee',
          message,
          link: `/evenements/${registration.eventId}`,
          read: false,
          emailSent: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Inscription ${status === 'CONFIRMED' ? 'confirmee' : status === 'CANCELLED' ? 'annulee' : 'mise a jour'}`,
      registration: updatedRegistration,
    })
  } catch (error) {
    console.error('Error updating registration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise a jour' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une inscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'STAFF', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = await params

    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvee' }, { status: 404 })
    }

    await prisma.eventRegistration.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Inscription supprimee',
    })
  } catch (error) {
    console.error('Error deleting registration:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
