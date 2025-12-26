/**
 * Schémas de validation Zod pour les dons
 *
 * Centralise toutes les validations liées aux donations pour éviter la duplication
 * et assurer la cohérence entre les différentes API routes.
 */

import { z } from 'zod'

// Types de don disponibles
export const donationTypes = [
  'ZAKAT',
  'SADAQA',
  'ZAKAT_AL_FITR',
  'PROJECT',
  'MEMBERSHIP',
] as const

export type DonationType = (typeof donationTypes)[number]

// Schéma de base pour un don (création directe)
export const donationSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  amount: z.number().positive('Le montant doit être positif'),
  type: z.enum(donationTypes),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  message: z.string().optional(),
  anonymous: z.boolean().default(false),
})

export type DonationInput = z.infer<typeof donationSchema>

// Schéma pour les dons venant de RaiseNow/Tamaro
export const externalDonationSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num) || num <= 0 || num > 1000000) {
      throw new Error('Montant invalide')
    }
    return num
  }),
  currency: z.string().default('CHF'),
  purpose: z.string().optional(),
  transactionId: z.string().min(1, 'Transaction ID requis'),
  donorEmail: z.string().email().optional().nullable(),
  donorName: z.string().optional().nullable(),
  customFields: z
    .object({
      phone: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().optional(),
})

export type ExternalDonationInput = z.infer<typeof externalDonationSchema>

// Schéma pour le formulaire Stripe
export const stripeDonationSchema = z.object({
  amount: z.number().min(100, 'Montant minimum: 1 CHF').max(10000000, 'Montant maximum: 100000 CHF'),
  email: z.string().email('Email invalide'),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  type: z.enum(donationTypes).default('SADAQA'),
  metadata: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      message: z.string().optional(),
      anonymous: z.boolean().optional(),
    })
    .optional(),
})

export type StripeDonationInput = z.infer<typeof stripeDonationSchema>

// Schéma pour l'export PDF (reçu fiscal)
export const donationExportSchema = z.object({
  donationIds: z.array(z.string().uuid('ID de don invalide')).optional(),
  year: z.number().min(2020).max(2100).optional(),
})

export type DonationExportInput = z.infer<typeof donationExportSchema>

// Montants préréglés pour les formulaires (en centimes pour Stripe)
export const PRESET_AMOUNTS = {
  centimes: [2000, 5000, 10000, 20000] as const, // 20, 50, 100, 200 CHF
  francs: [20, 50, 100, 200] as const,
}

// Labels des types de don
export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  ZAKAT: 'Zakat',
  SADAQA: 'Sadaqa',
  ZAKAT_AL_FITR: 'Zakat al-Fitr',
  PROJECT: 'Projet',
  MEMBERSHIP: 'Cotisation',
}

// Configuration de la mosquée (à externaliser dans les settings)
export const MOSQUE_BANK_INFO = {
  name: 'Association Islamique de Bienne',
  iban: process.env.MOSQUE_IBAN || 'CH00 0000 0000 0000 0000 0',
  bic: process.env.MOSQUE_BIC || 'POFICHBEXXX',
  bank: 'PostFinance SA',
  address: 'Rue de la Mosquée 1, 2502 Bienne',
}

// Helper pour mapper le purpose vers le type de don
export function purposeToDonationType(
  purpose: string | undefined
): DonationType {
  if (purpose === 'zakat') return 'ZAKAT'
  if (purpose === 'sadaqa' || purpose === 'general') return 'SADAQA'
  return 'PROJECT'
}

// Helper pour obtenir le label d'un purpose
export function getPurposeLabel(purpose: string | undefined): string {
  const purposes: Record<string, string> = {
    general: 'Don général',
    zakat: 'Zakat',
    sadaqa: 'Sadaqa',
    renovation: 'Rénovation mosquée',
    education: 'Éducation & Cours',
    ramadan: 'Campagne Ramadan',
  }
  return purposes[purpose || 'general'] || 'Don général'
}
