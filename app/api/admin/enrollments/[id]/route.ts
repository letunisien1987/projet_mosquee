import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { directusClient } from '@/lib/directus'
import { readItem } from '@directus/sdk'
import { z } from 'zod'
import crypto from 'crypto'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITING_LIST', 'INTERVIEW_REQUIRED', 'ACTIVE']).optional(),
  internalNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  priority: z.number().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.role || !['ADMIN', 'IMAM', 'TEACHER', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    // Récupérer l'inscription actuelle pour vérifier le changement de statut
    const currentEnrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        child: { select: { id: true, firstName: true, lastName: true } },
      }
    })

    if (!currentEnrollment) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    // Filtrer les valeurs undefined pour éviter les erreurs Prisma
    const updateData: any = {}
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.internalNotes !== undefined) updateData.internalNotes = validatedData.internalNotes
    if (validatedData.rejectionReason !== undefined) updateData.rejectionReason = validatedData.rejectionReason
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority

    // Si on passe en APPROVED, vérifier si l'activité a un prix
    const isBeingApproved = validatedData.status === 'APPROVED' && currentEnrollment.status !== 'APPROVED'

    if (isBeingApproved && currentEnrollment.activityId) {
      // Récupérer le prix de l'activité depuis Directus
      try {
        const activity = await directusClient.request(
          readItem('activities', currentEnrollment.activityId as any, {
            fields: ['id', 'title', 'price']
          })
        ) as any

        if (activity && activity.price && activity.price > 0) {
          // L'activité a un prix, configurer le paiement
          const paymentToken = crypto.randomBytes(32).toString('hex')
          const paymentExpiresAt = new Date()
          paymentExpiresAt.setDate(paymentExpiresAt.getDate() + 7) // 7 jours

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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          },
        },
      },
    })

    // Envoyer notification et email si approbation avec paiement
    if (isBeingApproved && enrollment.user) {
      const participantName = enrollment.child
        ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
        : `${enrollment.user.firstName} ${enrollment.user.lastName}`

      if (enrollment.requiresPayment && enrollment.paymentAmount && enrollment.paymentToken) {
        // Activité payante : envoyer lien de paiement
        const paymentUrl = `${process.env.NEXTAUTH_URL}/membre/paiements?token=${enrollment.paymentToken}`

        // Créer notification
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

        // Envoyer email
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
          console.log('📧 Email de demande de paiement envoyé à:', enrollment.user.email)
        } catch (emailError) {
          console.error('⚠️  Erreur envoi email:', emailError)
        }
      } else {
        // Activité gratuite : créer notification d'approbation simple
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

        // Envoyer email de confirmation
        try {
          const { sendEnrollmentConfirmationEmail } = await import('@/lib/email')
          await sendEnrollmentConfirmationEmail(
            enrollment.user.email,
            enrollment.user.firstName,
            enrollment.activityTitle,
            'ACTIVE'
          )
          console.log('📧 Email de confirmation envoyé à:', enrollment.user.email)
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

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'inscription' },
      { status: 500 }
    )
  }
}
