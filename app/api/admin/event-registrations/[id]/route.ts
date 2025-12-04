/**
 * API Admin: Gestion d'une inscription specifique
 * GET /api/admin/event-registrations/[id] - Details d'une inscription
 * PATCH /api/admin/event-registrations/[id] - Modifier le statut (avec gestion approbation + paiement)
 * DELETE /api/admin/event-registrations/[id] - Supprimer une inscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventById } from '@/lib/directus'
import {
  sendEventPaymentRequest,
  sendEventRegistrationEmail
} from '@/lib/email'

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
// Action speciale: "APPROVE" pour approuver une inscription en attente
// Si l'evenement est payant, passe en PENDING_PAYMENT et envoie le lien de paiement
// Sinon, passe directement en CONFIRMED
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
    const { status, action } = body

    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvee' }, { status: 404 })
    }

    // Gestion de l'action APPROVE (approbation d'une inscription en attente)
    if (action === 'APPROVE') {
      if (registration.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Seules les inscriptions en attente peuvent etre approuvees' },
          { status: 400 }
        )
      }

      // Verifier si l'evenement necessite un paiement
      const event = await getEventById(registration.eventId)
      const isPaidEvent = event?.payment_type && event.payment_type !== 'FREE' && event.price && event.price > 0

      let newStatus: 'PENDING_PAYMENT' | 'CONFIRMED'
      let message: string

      if (isPaidEvent && registration.requiresPayment && registration.paymentAmount) {
        // Evenement payant: passer en PENDING_PAYMENT et envoyer le lien de paiement
        newStatus = 'PENDING_PAYMENT'
        message = 'Inscription approuvee - En attente de paiement'

        const updatedRegistration = await prisma.eventRegistration.update({
          where: { id },
          data: { status: newStatus },
        })

        // Envoyer l'email avec le lien de paiement
        const paymentUrl = `${process.env.NEXTAUTH_URL}/api/events/${registration.eventId}/checkout?registrationId=${registration.id}`
        try {
          await sendEventPaymentRequest({
            email: registration.email,
            firstName: registration.firstName,
            eventTitle: registration.eventTitle,
            eventDate: event?.date,
            participationType: registration.participationType,
            numberOfAdults: registration.numberOfAdults,
            numberOfChildren: registration.numberOfChildren,
            amount: registration.paymentAmount,
            paymentUrl,
            registrationId: registration.id,
          })
          console.log('📧 Email de paiement envoye apres approbation:', registration.email)
        } catch (emailError) {
          console.error('⚠️ Erreur envoi email de paiement:', emailError)
        }

        // Notification a l'utilisateur
        if (registration.userId) {
          await prisma.notification.create({
            data: {
              userId: registration.userId,
              type: 'EVENT_REGISTRATION_NEW',
              title: 'Inscription approuvee - Paiement requis',
              message: `Votre inscription a "${registration.eventTitle}" a ete approuvee. Veuillez proceder au paiement de ${registration.paymentAmount} CHF.`,
              link: paymentUrl,
              read: false,
              emailSent: true,
            },
          })
        }

        return NextResponse.json({
          success: true,
          message,
          registration: updatedRegistration,
          requiresPayment: true,
        })
      } else {
        // Evenement gratuit: confirmer directement
        newStatus = 'CONFIRMED'
        message = 'Inscription approuvee et confirmee'

        const updatedRegistration = await prisma.eventRegistration.update({
          where: { id },
          data: { status: newStatus },
        })

        // Envoyer l'email de confirmation
        const eventDateFormatted = event?.date
          ? new Date(event.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'A confirmer'

        try {
          await sendEventRegistrationEmail(
            registration.email,
            registration.firstName,
            registration.eventTitle,
            eventDateFormatted
          )
          console.log('📧 Email de confirmation envoye:', registration.email)
        } catch (emailError) {
          console.error('⚠️ Erreur envoi email de confirmation:', emailError)
        }

        // Notification a l'utilisateur
        if (registration.userId) {
          await prisma.notification.create({
            data: {
              userId: registration.userId,
              type: 'EVENT_CONFIRMATION',
              title: 'Inscription confirmee',
              message: `Votre inscription a "${registration.eventTitle}" a ete approuvee et confirmee.`,
              link: `/evenements/${registration.eventId}`,
              read: false,
              emailSent: true,
            },
          })
        }

        return NextResponse.json({
          success: true,
          message,
          registration: updatedRegistration,
        })
      }
    }

    // Gestion classique des changements de statut
    if (!status || !['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'WAITLIST'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
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
