/**
 * API: Gérer une inscription spécifique (approuver/refuser)
 * GET /api/membre/mes-activites/[activityId]/enrollments/[enrollmentId]
 * PATCH /api/membre/mes-activites/[activityId]/enrollments/[enrollmentId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isActivityManager, getActivityById } from '@/lib/directus'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import {
  sendEnrollmentApprovalEmail,
  sendEnrollmentRejectionEmail,
  sendEnrollmentPaymentRequest,
} from '@/lib/email'

const updateSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  reason: z.string().optional(),
})

// GET - Détails d'une inscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string; enrollmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { activityId, enrollmentId } = await params
    const userId = session.user.id

    // Vérifier que l'utilisateur est responsable de cette activité
    const isManager = await isActivityManager(activityId, userId)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas responsable de cette activité' },
        { status: 403 }
      )
    }

    // Récupérer l'inscription
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        activityId: activityId.toString(),
      },
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
        payment: true,
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Erreur GET enrollment:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Approuver/Refuser une inscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string; enrollmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { activityId, enrollmentId } = await params
    const userId = session.user.id

    // Vérifier que l'utilisateur est responsable de cette activité
    const isManager = await isActivityManager(activityId, userId)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas responsable de cette activité' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, reason } = updateSchema.parse(body)

    // Récupérer l'inscription
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        activityId: activityId.toString(),
      },
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
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer l'activité pour le prix
    const activity = await getActivityById(activityId)

    let updatedEnrollment

    switch (action) {
      case 'approve':
        // Vérifier si l'activité est payante
        const requiresPayment = activity?.price && activity.price > 0

        if (requiresPayment) {
          // Générer un token de paiement
          const paymentToken = crypto.randomBytes(32).toString('hex')
          const paymentExpiresAt = new Date()
          paymentExpiresAt.setDate(paymentExpiresAt.getDate() + 7) // 7 jours pour payer

          updatedEnrollment = await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
              status: 'APPROVED',
              requiresPayment: true,
              paymentAmount: activity.price,
              paymentToken,
              paymentExpiresAt,
            },
          })

          // Créer une notification
          await prisma.notification.create({
            data: {
              userId: enrollment.user!.id,
              type: 'ENROLLMENT_PAYMENT_PENDING',
              title: 'Inscription approuvée - Paiement requis',
              message: `Votre inscription à "${activity?.title}" a été approuvée. Finalisez le paiement de ${activity?.price} CHF dans les 7 jours.`,
              link: '/membre/paiements',
              read: false,
              emailSent: true,
            },
          })

          // Envoyer l'email de demande de paiement
          if (enrollment.user?.email) {
            const paymentUrl = `${process.env.NEXTAUTH_URL}/payer?token=${paymentToken}`
            const participantName = enrollment.child
              ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
              : `${enrollment.user.firstName || ''} ${enrollment.user.lastName || ''}`

            await sendEnrollmentPaymentRequest({
              email: enrollment.user.email,
              firstName: enrollment.user.firstName || '',
              activityTitle: activity?.title || enrollment.activityTitle,
              participantName,
              amount: activity?.price || 0,
              paymentUrl,
              expiresAt: paymentExpiresAt,
            })
          }
        } else {
          // Activité gratuite - approuver directement en ACTIVE
          updatedEnrollment = await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
              status: 'ACTIVE',
              requiresPayment: false,
            },
          })

          // Créer une notification
          await prisma.notification.create({
            data: {
              userId: enrollment.user!.id,
              type: 'ENROLLMENT_APPROVED',
              title: 'Inscription confirmée',
              message: `Votre inscription à "${activity?.title || enrollment.activityTitle}" a été confirmée.`,
              link: '/membre/inscriptions',
              read: false,
              emailSent: true,
            },
          })

          // Envoyer l'email de confirmation
          if (enrollment.user?.email) {
            await sendEnrollmentApprovalEmail(
              enrollment.user.email,
              enrollment.user.firstName || '',
              activity?.title || enrollment.activityTitle
            )
          }
        }
        break

      case 'reject':
        updatedEnrollment = await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'REJECTED',
            notes: reason ? `Refusé: ${reason}` : enrollment.notes,
          },
        })

        // Créer une notification
        await prisma.notification.create({
          data: {
            userId: enrollment.user!.id,
            type: 'ENROLLMENT_REJECTED',
            title: 'Inscription refusée',
            message: reason
              ? `Votre inscription à "${activity?.title || enrollment.activityTitle}" a été refusée. Raison: ${reason}`
              : `Votre inscription à "${activity?.title || enrollment.activityTitle}" a été refusée.`,
            link: '/membre/inscriptions',
            read: false,
            emailSent: true,
          },
        })

        // Envoyer l'email de refus
        if (enrollment.user?.email) {
          await sendEnrollmentRejectionEmail(
            enrollment.user.email,
            enrollment.user.firstName || '',
            activity?.title || enrollment.activityTitle,
            reason
          )
        }
        break

      case 'cancel':
        updatedEnrollment = await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: {
            status: 'REJECTED',
          },
        })

        // Créer une notification
        await prisma.notification.create({
          data: {
            userId: enrollment.user!.id,
            type: 'ENROLLMENT_REJECTED',
            title: 'Inscription annulée',
            message: `Votre inscription à "${activity?.title || enrollment.activityTitle}" a été annulée par l'administration.`,
            link: '/membre/inscriptions',
            read: false,
            emailSent: true,
          },
        })
        break
    }

    return NextResponse.json({
      success: true,
      enrollment: updatedEnrollment,
      message:
        action === 'approve'
          ? 'Inscription approuvée'
          : action === 'reject'
          ? 'Inscription refusée'
          : 'Inscription annulée',
    })
  } catch (error) {
    console.error('Erreur PATCH enrollment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
