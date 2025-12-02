/**
 * API Route: Créer une session Stripe pour paiement de cotisation
 *
 * Utilisé après approbation admin via le lien avec token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    const request = await prisma.membershipRequest.findUnique({
      where: { paymentToken: token }
    })

    if (!request) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 404 })
    }

    if (!['APPROVED', 'PAYMENT_SENT'].includes(request.status)) {
      return NextResponse.json(
        { error: 'Demande non approuvée ou déjà traitée', status: request.status },
        { status: 400 }
      )
    }

    // Vérifier l'expiration
    if (request.paymentExpiresAt && request.paymentExpiresAt < new Date()) {
      await prisma.membershipRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json(
        { error: 'Lien de paiement expiré' },
        { status: 410 }
      )
    }

    // Créer la session Stripe
    const endDate = new Date(request.desiredStartDate)
    endDate.setFullYear(endDate.getFullYear() + 1)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'chf',
            product_data: {
              name: `Cotisation annuelle - Membre ${request.membershipType}`,
              description: `Adhésion du ${request.desiredStartDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`
            },
            unit_amount: 12000, // 120 CHF
          },
          quantity: 1,
        },
      ],
      customer_email: request.email,
      success_url: `${process.env.NEXTAUTH_URL}/adhesion/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/adhesion/payer/${token}`,
      metadata: {
        type: 'MEMBERSHIP',
        requestId: request.id,
        membershipType: request.membershipType,
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        phone: request.phone,
        address: request.address,
        city: request.city,
        postalCode: request.postalCode,
        country: request.country,
        desiredStartDate: request.desiredStartDate.toISOString(),
      }
    })

    // Mettre à jour le statut
    await prisma.membershipRequest.update({
      where: { id: request.id },
      data: {
        status: 'PAYMENT_SENT',
        paymentLinkSentAt: new Date()
      }
    })

    console.log('✅ Session Stripe cotisation créée:', session.id, '-', request.email)

    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('❌ Erreur création paiement cotisation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
