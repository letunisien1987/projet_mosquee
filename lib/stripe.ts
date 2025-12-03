/**
 * Stripe Server-Side Configuration
 *
 * ⚠️ SÉCURITÉ: Ce fichier utilise la clé secrète Stripe
 * NE JAMAIS importer ce fichier dans un composant client ('use client')
 * Utiliser UNIQUEMENT dans les API routes (app/api/*)
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    '❌ STRIPE_SECRET_KEY manquante dans .env\n' +
    'Ajoutez: STRIPE_SECRET_KEY=sk_test_...'
  )
}

// Instance Stripe configurée (SERVER-SIDE ONLY)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

/**
 * Configuration des prix (montants en centimes)
 */
export const DONATION_PRESETS = {
  small: 2000,    // 20 CHF
  medium: 5000,   // 50 CHF
  large: 10000,   // 100 CHF
  xlarge: 20000,  // 200 CHF
}

/**
 * Devise utilisée
 */
export const CURRENCY = 'chf' as const

/**
 * URLs de redirection
 */
export function getStripeUrls(baseUrl: string) {
  return {
    success: `${baseUrl}/stripe-success`,
    cancel: `${baseUrl}/stripe-cancel`,
  }
}
