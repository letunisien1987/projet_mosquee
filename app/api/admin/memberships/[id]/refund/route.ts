/**
 * API Route: Rembourser une cotisation (via Stripe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin uniquement' }, { status: 401 })
    }

    const { id } = await params
    const membershipId = id

    // Récupérer la cotisation
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Cotisation non trouvée' }, { status: 404 })
    }

    if (membership.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Cette cotisation n\'a pas été payée' },
        { status: 400 }
      )
    }

    if (!membership.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Aucun paiement Stripe trouvé pour cette cotisation' },
        { status: 400 }
      )
    }

    // Effectuer le remboursement via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: membership.stripePaymentIntentId,
      reason: 'requested_by_customer',
    })

    console.log('💰 Remboursement Stripe créé:', refund.id)

    // Mettre à jour la cotisation
    await prisma.membership.update({
      where: { id: membershipId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'EXPIRED',
      },
    })

    // Créer une notification pour le membre
    await prisma.notification.create({
      data: {
        userId: membership.userId,
        type: 'MEMBERSHIP_REFUNDED',
        title: 'Remboursement effectué',
        message: `Votre cotisation de ${membership.amount.toFixed(2)} CHF a été remboursée. Le montant sera crédité sur votre compte sous 5-10 jours.`,
        link: '/membre/cotisation',
        read: false,
        emailSent: true // Email déjà envoyé
      }
    })

    console.log('📬 Notification de remboursement créée pour:', membership.user.email)

    // Envoyer un email de confirmation
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Confirmation de remboursement</h2>

        <p>Bonjour ${membership.user.firstName},</p>

        <p>Nous vous confirmons que votre cotisation a été remboursée.</p>

        <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0;">Détails du remboursement</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Montant remboursé:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${membership.amount.toFixed(2)} CHF</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Type de cotisation:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${membership.type === 'ACTIF' ? 'Membre Actif' : membership.type === 'PASSIF' ? 'Membre Passif' : membership.type}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Période:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">
                ${new Date(membership.startDate).toLocaleDateString('fr-FR')} - ${new Date(membership.endDate).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          </table>
        </div>

        <p>Le remboursement sera traité par Stripe et apparaîtra sur votre compte bancaire sous 5-10 jours ouvrables.</p>

        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

        <p>Cordialement,<br>
        <strong>Mosquée Madretsch</strong></p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

        <p style="font-size: 12px; color: #6B7280;">
          ID de remboursement Stripe: ${refund.id}
        </p>
      </div>
    `

    const emailResult = await sendEmail({
      to: membership.user.email,
      subject: 'Confirmation de remboursement de cotisation',
      html: emailHtml,
    })

    if (emailResult.success) {
      console.log('📧 Email de confirmation de remboursement envoyé')
    } else {
      console.error('⚠️  Erreur envoi email (non bloquant):', emailResult.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Remboursement effectué avec succès',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur remboursement:', error)

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Erreur Stripe', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
