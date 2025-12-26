/**
 * Schémas de validation Zod pour les API membre
 */

import { z } from 'zod'

// Schéma pour la mise à jour du profil
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100),
  lastName: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).default('Suisse'),
  dateOfBirth: z.string().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  preferredLanguage: z.enum(['fr', 'ar']).default('fr'),
  notificationEmail: z.boolean().default(true),
  notificationSms: z.boolean().default(false),
  newsletter: z.boolean().default(true),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Schéma pour l'export de don (validation UUID)
export const donationExportSchema = z.object({
  donationId: z.string().uuid('ID de don invalide').optional().nullable(),
})

export type DonationExportInput = z.infer<typeof donationExportSchema>
