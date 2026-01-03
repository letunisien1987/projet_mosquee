/**
 * API Route: Annulation d'une inscription à un événement
 *
 * Logique de remboursement:
 * 1. Si l'événement n'a pas de paiement → annulation simple
 * 2. Si délai d'annulation respecté (X jours avant l'événement) → remboursement automatique
 * 3. Si délai dépassé → création d'une demande de remboursement à approuver par l'organisateur
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventById } from '@/lib/content'
import { stripe } from '@/lib/stripe'
import { sendEventCancellationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body // Raison optionnelle de l'annulation

    // Récupérer l'inscription avec le paiement associé
    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
      include: {
        payment: true,
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscription introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien l'utilisateur qui a fait l'inscription
    if (registration.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas annuler cette inscription' },
        { status: 403 }
      )
    }

    // Vérifier que l'inscription n'est pas déjà annulée
    if (registration.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cette inscription est déjà annulée' },
        { status: 400 }
      )
    }

    // Récupérer les détails de l'événement depuis Prisma
    const event = registration.eventId ? await getEventById(registration.eventId) : null

    // Déterminer si un remboursement est nécessaire
    const hasPaidPayment = registration.payment &&
                          registration.payment.status === 'COMPLETED' &&
                          !registration.payment.refundedAt

    let refundResult: {
      type: 'NO_REFUND' | 'AUTO_REFUND' | 'REFUND_REQUEST'
      refundId?: string
      requestId?: string
      message: string
    } = {
      type: 'NO_REFUND',
      message: 'Inscription annulée sans remboursement'
    }

    if (hasPaidPayment && event) {
      const allowRefund = event.allowRefund ?? true // Par défaut, autoriser les remboursements
      const deadlineDays = event.cancellationDeadlineDays ?? 7 // Par défaut 7 jours

      // Calculer si on est dans le délai d'annulation
      const eventDate = event.date ? new Date(event.date) : new Date()
      const today = new Date()
      const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const isWithinDeadline = daysUntilEvent >= deadlineDays

      if (allowRefund && isWithinDeadline) {
        // REMBOURSEMENT AUTOMATIQUE
        // Effectuer le remboursement via Stripe
        if (registration.payment?.stripePaymentId) {
          try {
            const refund = await stripe.refunds.create({
              payment_intent: registration.payment.stripePaymentId,
              reason: 'requested_by_customer',
            })

            // Mettre à jour le paiement
            await prisma.payment.update({
              where: { id: registration.payment.id },
              data: {
                refundedAt: new Date(),
                refundAmount: registration.payment.amount,
              }
            })

            refundResult = {
              type: 'AUTO_REFUND',
              refundId: refund.id,
              message: `Remboursement automatique de ${registration.payment.amount} CHF effectué`
            }

            console.log('💰 Remboursement Stripe effectué:', refund.id)
          } catch (stripeError: any) {
            console.error('❌ Erreur remboursement Stripe:', stripeError)
            // En cas d'erreur Stripe, créer une demande de remboursement manuelle
            refundResult = await createRefundRequest(
              registration,
              session.user.id,
              reason || 'Erreur technique lors du remboursement automatique'
            )
          }
        } else {
          // Pas d'ID Stripe, créer une demande manuelle
          refundResult = await createRefundRequest(
            registration,
            session.user.id,
            reason || 'Remboursement requis (pas de payment_intent)'
          )
        }
      } else if (allowRefund && !isWithinDeadline) {
        // DEMANDE DE REMBOURSEMENT (délai dépassé)
        refundResult = await createRefundRequest(
          registration,
          session.user.id,
          reason || `Annulation tardive (${daysUntilEvent} jour(s) avant l'événement)`
        )
      } else {
        // Remboursement non autorisé pour cet événement
        refundResult = {
          type: 'NO_REFUND',
          message: 'Cet événement n\'autorise pas les remboursements'
        }
      }
    }

    // Annuler l'inscription
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    // Créer une notification pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'EVENT_CANCELLED',
        title: 'Inscription annulée',
        message: refundResult.type === 'AUTO_REFUND'
          ? `Votre inscription à "${registration.eventTitle}" a été annulée. ${refundResult.message}`
          : refundResult.type === 'REFUND_REQUEST'
          ? `Votre inscription à "${registration.eventTitle}" a été annulée. Une demande de remboursement a été soumise.`
          : `Votre inscription à "${registration.eventTitle}" a été annulée.`,
        link: '/membre/evenements',
        read: false,
        emailSent: false,
      }
    })

    // Envoyer l'email d'annulation
    try {
      await sendEventCancellationEmail(
        registration.email,
        registration.firstName,
        registration.eventTitle
      )
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError)
    }

    // Notifier l'organisateur si c'est un événement payant
    if (event?.managerEmail && hasPaidPayment) {
      const managerUser = await prisma.user.findFirst({
        where: { email: event.managerEmail },
        select: { id: true }
      })

      if (managerUser) {
        await prisma.notification.create({
          data: {
            userId: managerUser.id,
            type: refundResult.type === 'REFUND_REQUEST' ? 'REFUND_REQUEST' : 'EVENT_CANCELLATION',
            title: refundResult.type === 'REFUND_REQUEST'
              ? 'Nouvelle demande de remboursement'
              : 'Annulation avec remboursement',
            message: refundResult.type === 'REFUND_REQUEST'
              ? `${registration.firstName} ${registration.lastName} a annulé son inscription à "${registration.eventTitle}" et demande un remboursement de ${registration.payment?.amount} CHF.`
              : `${registration.firstName} ${registration.lastName} a annulé son inscription à "${registration.eventTitle}". Remboursement automatique effectué.`,
            link: `/membre/mes-evenements/${registration.eventId}`,
            read: false,
            emailSent: false,
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Votre inscription a été annulée avec succès',
      registration: updatedRegistration,
      refund: refundResult
    })

  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'annulation' },
      { status: 500 }
    )
  }
}

/**
 * Créer une demande de remboursement
 */
async function createRefundRequest(
  registration: any,
  userId: string,
  reason: string
): Promise<{
  type: 'REFUND_REQUEST'
  requestId: string
  message: string
}> {
  const refundRequest = await prisma.refundRequest.create({
    data: {
      userId,
      registrationId: registration.id,
      paymentId: registration.payment.id,
      eventId: registration.eventId,
      eventTitle: registration.eventTitle,
      amount: registration.payment.amount,
      reason,
      status: 'PENDING',
    }
  })

  console.log('📝 Demande de remboursement créée:', refundRequest.id)

  return {
    type: 'REFUND_REQUEST',
    requestId: refundRequest.id,
    message: `Demande de remboursement de ${registration.payment.amount} CHF soumise à l'organisateur`
  }
}
