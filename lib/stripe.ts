/**
 * Stripe Server-Side Configuration
 *
 * ⚠️ SÉCURITÉ: Ce fichier utilise la clé secrète Stripe
 * NE JAMAIS importer ce fichier dans un composant client ('use client')
 * Utiliser UNIQUEMENT dans les API routes (app/api/*)
 */

import Stripe from 'stripe'
import { getSettings, getDonationPresets, DEFAULT_SETTINGS } from './settings'

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
 * Configuration des prix par défaut (montants en centimes)
 * Ces valeurs sont utilisées comme fallback si les settings ne sont pas disponibles
 */
export const DEFAULT_DONATION_PRESETS = {
  small: DEFAULT_SETTINGS.donation_preset_1!,    // 20 CHF
  medium: DEFAULT_SETTINGS.donation_preset_2!,   // 50 CHF
  large: DEFAULT_SETTINGS.donation_preset_3!,    // 100 CHF
  xlarge: DEFAULT_SETTINGS.donation_preset_4!,   // 200 CHF
}

/**
 * Récupère les presets de dons depuis les settings (async)
 */
export async function getDonationPresetsFromSettings() {
  const settings = await getSettings()
  const presets = getDonationPresets(settings)
  return {
    small: presets[0],
    medium: presets[1],
    large: presets[2],
    xlarge: presets[3],
  }
}

/**
 * Configuration des prix (legacy - pour compatibilité)
 * @deprecated Utiliser getDonationPresetsFromSettings() pour les valeurs dynamiques
 */
export const DONATION_PRESETS = DEFAULT_DONATION_PRESETS

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
