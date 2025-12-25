/**
 * API Admin: Gestion d'une inscription individuelle
 * PATCH /api/admin/enrollments/[id] - Mettre à jour une inscription
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { directusClient } from '@/lib/directus'
import { readItem } from '@directus/sdk'
import { z } from 'zod'
import crypto from 'crypto'
import {
  apiHandler,
  requireRoles,
  successResponse,
  ApiError,
  ADMIN_ROLES,
} from '@/lib/api/middleware'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITING_LIST', 'INTERVIEW_REQUIRED', 'ACTIVE']).optional(),
  internalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  priority: z.number().optional(),
})

export const PATCH = apiHandler(async (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  await requireRoles(ADMIN_ROLES)

  const { id } = await context!.params
  const body = await req.json()
  const validatedData = updateSchema.parse(body)

  // Récupérer l'inscription actuelle
  const currentEnrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      child: { select: { id: true, firstName: true, lastName: true } },
    }
  })

  if (!currentEnrollment) {
    throw new ApiError('Inscription introuvable', 404, 'NOT_FOUND')
  }

  // Construire les données de mise à jour
  const updateData: Record<string, unknown> = {}
  if (validatedData.status !== undefined) updateData.status = validatedData.status
  if (validatedData.internalNotes !== undefined) updateData.internalNotes = validatedData.internalNotes
  if (validatedData.rejectionReason !== undefined) updateData.rejectionReason = validatedData.rejectionReason
  if (validatedData.priority !== undefined) updateData.priority = validatedData.priority

  // Gestion de l'approbation avec paiement
  const isBeingApproved = validatedData.status === 'APPROVED' && currentEnrollment.status !== 'APPROVED'

  if (isBeingApproved && currentEnrollment.activityId) {
    try {
      const activity = await directusClient.request(
        readItem('activities', currentEnrollment.activityId as unknown as string, {
          fields: ['id', 'title', 'price']
        })
      ) as { id: string; title: string; price?: number }

      if (activity?.price && activity.price > 0) {
        const paymentToken = crypto.randomBytes(32).toString('hex')
        const paymentExpiresAt = new Date()
        paymentExpiresAt.setDate(paymentExpiresAt.getDate() + 7)

        updateData.requiresPayment = true
        updateData.paymentAmount = activity.price
        updateData.paymentToken = paymentToken
        updateData.paymentExpiresAt = paymentExpiresAt
      }
    } catch (e) {
      console.log('⚠️  Impossible de récupérer le prix de l\'activité:', e)
    }
  }

  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      child: {
        select: { id: true, firstName: true, lastName: true, birthDate: true },
      },
    },
  })

  // Notifications et emails
  if (isBeingApproved && enrollment.user) {
    const participantName = enrollment.child
      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
      : `${enrollment.user.firstName} ${enrollment.user.lastName}`

    if (enrollment.requiresPayment && enrollment.paymentAmount && enrollment.paymentToken) {
      const paymentUrl = `${process.env.NEXTAUTH_URL}/membre/paiements?token=${enrollment.paymentToken}`

      await prisma.notification.create({
        data: {
          userId: enrollment.user.id,
          type: 'ENROLLMENT_PAYMENT_PENDING',
          title: 'Inscription approuvée - Paiement requis',
          message: `L'inscription de ${participantName} à "${enrollment.activityTitle}" a été approuvée. Veuillez finaliser le paiement de ${enrollment.paymentAmount.toFixed(2)} CHF.`,
          link: '/membre/paiements',
          read: false,
          emailSent: true
        }
      })

      try {
        const { sendEnrollmentPaymentRequest } = await import('@/lib/email')
        await sendEnrollmentPaymentRequest({
          email: enrollment.user.email,
          firstName: enrollment.user.firstName,
          activityTitle: enrollment.activityTitle,
          participantName,
          amount: enrollment.paymentAmount,
          paymentUrl,
          expiresAt: enrollment.paymentExpiresAt!
        })
      } catch (emailError) {
        console.error('⚠️  Erreur envoi email:', emailError)
      }
    } else {
      await prisma.notification.create({
        data: {
          userId: enrollment.user.id,
          type: 'ENROLLMENT_APPROVED',
          title: 'Inscription approuvée',
          message: `L'inscription de ${participantName} à "${enrollment.activityTitle}" a été approuvée.`,
          link: '/membre/inscriptions',
          read: false,
          emailSent: true
        }
      })

      try {
        const { sendEnrollmentConfirmationEmail } = await import('@/lib/email')
        await sendEnrollmentConfirmationEmail(
          enrollment.user.email,
          enrollment.user.firstName,
          enrollment.activityTitle,
          'ACTIVE'
        )
      } catch (emailError) {
        console.error('⚠️  Erreur envoi email:', emailError)
      }
    }
  }

  // Notification de rejet
  if (validatedData.status === 'REJECTED' && currentEnrollment.status !== 'REJECTED' && enrollment.user) {
    const participantName = enrollment.child
      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
      : `${enrollment.user.firstName} ${enrollment.user.lastName}`

    await prisma.notification.create({
      data: {
        userId: enrollment.user.id,
        type: 'ENROLLMENT_REJECTED',
        title: 'Inscription refusée',
        message: `L'inscription de ${participantName} à "${enrollment.activityTitle}" n'a pas pu être acceptée. ${validatedData.rejectionReason || ''}`,
        link: '/membre/inscriptions',
        read: false,
        emailSent: true
      }
    })
  }

  return successResponse(enrollment)
})
