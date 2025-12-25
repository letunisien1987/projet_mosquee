/**
 * API Admin: Gestion d'une inscription spécifique
 * GET /api/admin/event-registrations/[id] - Détails d'une inscription
 * PATCH /api/admin/event-registrations/[id] - Modifier le statut
 * DELETE /api/admin/event-registrations/[id] - Supprimer une inscription
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEventById } from '@/lib/directus'
import {
  sendEventPaymentRequest,
  sendEventRegistrationEmail
} from '@/lib/email'
import {
  apiHandler,
  requireRoles,
  successResponse,
  ApiError,
  ADMIN_ROLES,
} from '@/lib/api/middleware'

// GET - Détails d'une inscription
export const GET = apiHandler(async (
  _req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  await requireRoles(ADMIN_ROLES)

  const { id } = await context!.params

  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      child: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!registration) {
    throw new ApiError('Inscription non trouvée', 404, 'NOT_FOUND')
  }

  return successResponse(registration)
})

// PATCH - Modifier le statut d'une inscription
export const PATCH = apiHandler(async (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  await requireRoles(ADMIN_ROLES)

  const { id } = await context!.params
  const body = await req.json()
  const { status, action } = body

  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
  })

  if (!registration) {
    throw new ApiError('Inscription non trouvée', 404, 'NOT_FOUND')
  }

  // Gestion de l'action APPROVE
  if (action === 'APPROVE') {
    if (registration.status !== 'PENDING') {
      throw new ApiError('Seules les inscriptions en attente peuvent être approuvées', 400, 'INVALID_STATUS')
    }

    const event = await getEventById(registration.eventId)
    const isPaidEvent = event?.payment_type && event.payment_type !== 'FREE' && event.price && event.price > 0

    let newStatus: 'PENDING_PAYMENT' | 'CONFIRMED'
    let message: string

    if (isPaidEvent && registration.requiresPayment && registration.paymentAmount) {
      newStatus = 'PENDING_PAYMENT'
      message = 'Inscription approuvée - En attente de paiement'

      const updatedRegistration = await prisma.eventRegistration.update({
        where: { id },
        data: { status: newStatus },
      })

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
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email de paiement:', emailError)
      }

      if (registration.userId) {
        await prisma.notification.create({
          data: {
            userId: registration.userId,
            type: 'EVENT_REGISTRATION_NEW',
            title: 'Inscription approuvée - Paiement requis',
            message: `Votre inscription à "${registration.eventTitle}" a été approuvée. Veuillez procéder au paiement de ${registration.paymentAmount} CHF.`,
            link: paymentUrl,
            read: false,
            emailSent: true,
          },
        })
      }

      return successResponse({
        success: true,
        message,
        registration: updatedRegistration,
        requiresPayment: true,
      })
    } else {
      newStatus = 'CONFIRMED'
      message = 'Inscription approuvée et confirmée'

      const updatedRegistration = await prisma.eventRegistration.update({
        where: { id },
        data: { status: newStatus },
      })

      const eventDateFormatted = event?.date
        ? new Date(event.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'À confirmer'

      try {
        await sendEventRegistrationEmail(
          registration.email,
          registration.firstName,
          registration.eventTitle,
          eventDateFormatted
        )
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email de confirmation:', emailError)
      }

      if (registration.userId) {
        await prisma.notification.create({
          data: {
            userId: registration.userId,
            type: 'EVENT_CONFIRMATION',
            title: 'Inscription confirmée',
            message: `Votre inscription à "${registration.eventTitle}" a été approuvée et confirmée.`,
            link: `/evenements/${registration.eventId}`,
            read: false,
            emailSent: true,
          },
        })
      }

      return successResponse({
        success: true,
        message,
        registration: updatedRegistration,
      })
    }
  }

  // Gestion classique des changements de statut
  if (!status || !['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'WAITLIST'].includes(status)) {
    throw new ApiError('Statut invalide', 400, 'INVALID_STATUS')
  }

  const updatedRegistration = await prisma.eventRegistration.update({
    where: { id },
    data: { status },
  })

  if (registration.userId && (status === 'CONFIRMED' || status === 'CANCELLED')) {
    const notificationType = status === 'CONFIRMED' ? 'EVENT_CONFIRMATION' : 'EVENT_CANCELLED'
    const notificationMessage = status === 'CONFIRMED'
      ? `Votre inscription à "${registration.eventTitle}" a été confirmée.`
      : `Votre inscription à "${registration.eventTitle}" a été annulée.`

    await prisma.notification.create({
      data: {
        userId: registration.userId,
        type: notificationType,
        title: status === 'CONFIRMED' ? 'Inscription confirmée' : 'Inscription annulée',
        message: notificationMessage,
        link: `/evenements/${registration.eventId}`,
        read: false,
        emailSent: false,
      },
    })
  }

  return successResponse({
    success: true,
    message: `Inscription ${status === 'CONFIRMED' ? 'confirmée' : status === 'CANCELLED' ? 'annulée' : 'mise à jour'}`,
    registration: updatedRegistration,
  })
})

// DELETE - Supprimer une inscription
export const DELETE = apiHandler(async (
  _req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  await requireRoles(ADMIN_ROLES)

  const { id } = await context!.params

  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
  })

  if (!registration) {
    throw new ApiError('Inscription non trouvée', 404, 'NOT_FOUND')
  }

  await prisma.eventRegistration.delete({
    where: { id },
  })

  return successResponse({
    success: true,
    message: 'Inscription supprimée',
  })
})
