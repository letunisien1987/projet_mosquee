/**
 * API Route: Créer une session Stripe Checkout
 *
 * ⚠️ SÉCURITÉ: Route serveur uniquement
 * Utilise la clé secrète Stripe (jamais exposée au client)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, CURRENCY } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, projectId, projectTitle, donorEmail, donorName } = body

    // Validation des données
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: 'Montant invalide (minimum 1 CHF)' },
        { status: 400 }
      )
    }

    if (!projectId || !projectTitle) {
      return NextResponse.json(
        { error: 'Projet manquant' },
        { status: 400 }
      )
    }

    // URL de base (production ou développement)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Créer une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: `Don - ${projectTitle}`,
              description: `Contribution pour le projet: ${projectTitle}`,
            },
            unit_amount: amount, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/stripe-cancel`,
      customer_email: donorEmail || undefined,
      metadata: {
        projectId,
        projectTitle,
        donorName: donorName || '',
        donorEmail: donorEmail || '',
      },
    })

    // Retourner l'URL de checkout pour redirection directe
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('❌ Erreur création session Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
