/**
 * Schémas Zod centralisés pour la validation des données
 *
 * Ce fichier contient tous les schémas de validation partagés
 * entre les routes API admin et membre.
 */

import { z } from 'zod'

// =============================================================================
// SCHÉMAS DE BASE RÉUTILISABLES
// =============================================================================

/**
 * Schéma de réduction groupe
 */
export const groupDiscountSchema = z.object({
  enabled: z.boolean().default(false),
  from_persons: z.number()
    .min(2, '⚠️ La réduction groupe doit s\'appliquer à partir de 2 personnes minimum')
    .default(4),
  discount_percent: z.number()
    .min(0, '⚠️ La réduction ne peut pas être négative')
    .max(100, '⚠️ La réduction ne peut pas dépasser 100%')
    .default(10),
})

/**
 * Schéma de tarification anticipée (early bird)
 */
export const earlyBirdSchema = z.object({
  enabled: z.boolean().default(false),
  until_date: z.string().nullable().optional(),
  discount_percent: z.number()
    .min(0, '⚠️ La réduction ne peut pas être négative')
    .max(100, '⚠️ La réduction ne peut pas dépasser 100%')
    .default(15),
})

/**
 * Schéma de tarification avancée (multi-prix famille, groupe, etc.)
 */
export const pricingSchema = z.object({
  adult_price: z.number()
    .min(0, '⚠️ Le prix adulte ne peut pas être négatif'),
  child_price: z.number()
    .min(0, '⚠️ Le prix enfant ne peut pas être négatif'),
  child_free_until_age: z.number()
    .min(0, '⚠️ L\'âge minimum est 0')
    .max(18, '⚠️ L\'âge maximum pour enfant gratuit est 18 ans')
    .default(0),
  group_discount: groupDiscountSchema,
  family_max_price: z.number()
    .nullable()
    .optional()
    .refine(val => !val || val > 0, {
      message: '💡 Le plafond famille doit être supérieur à 0 CHF pour être utile'
    }),
  early_bird: earlyBirdSchema,
}).nullable().optional()

/**
 * Schéma de restrictions d'inscription
 */
export const restrictionsSchema = z.object({
  enabled: z.boolean().default(false),
  participation_type: z.enum(['INDIVIDUAL', 'FAMILY', 'MIXED'], {
    message: '⚠️ Choisissez: Individuel, Famille ou Mixte'
  }).optional(),
  allowed_gender: z.enum(['MALE', 'FEMALE', 'CHILD', 'ALL'], {
    message: '⚠️ Choisissez: Hommes, Femmes, Enfants ou Tous'
  }).optional(),
  min_age: z.number()
    .nullable()
    .optional()
    .refine(val => !val || val >= 0, { message: '⚠️ L\'âge minimum ne peut pas être négatif' }),
  max_age: z.number()
    .nullable()
    .optional()
    .refine(val => !val || val <= 120, { message: '⚠️ L\'âge maximum semble trop élevé' }),
}).optional()

/**
 * Schéma de type de paiement
 */
export const paymentTypeSchema = z.enum(['FREE', 'ONE_TIME', 'SUBSCRIPTION'], {
  message: '⚠️ Choisissez: Gratuit, Paiement unique ou Abonnement'
}).default('FREE')

/**
 * Schéma d'intervalle d'abonnement
 */
export const subscriptionIntervalSchema = z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional()

// =============================================================================
// SCHÉMA ACTIVITÉ
// =============================================================================

/**
 * Catégories d'activités
 */
export const activityCategorySchema = z.enum(
  ['coran', 'arabe', 'ecole', 'tajweed', 'hifz', 'halaqat', 'autre'],
  { message: '⚠️ Choisissez une catégorie valide' }
)

/**
 * Schéma complet pour créer/modifier une activité
 */
export const activitySchema = z.object({
  // Informations de base
  title: z.string()
    .min(1, '⚠️ Le titre est obligatoire')
    .min(3, '⚠️ Le titre doit contenir au moins 3 caractères'),
  slug: z.string()
    .min(1, '⚠️ Le slug est obligatoire')
    .regex(/^[a-z0-9-]+$/, '⚠️ Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  category: activityCategorySchema,
  description: z.string().optional(),
  content: z.string().optional(),

  // Détails de l'activité
  level: z.string().optional(),
  age_group: z.string().optional(),
  schedule: z.string().optional(),
  instructor: z.string().optional(),

  // Inscriptions
  max_participants: z.number()
    .optional()
    .refine(val => !val || val >= 1, {
      message: '⚠️ Le nombre de participants doit être au moins 1'
    }),
  requires_approval: z.boolean().default(false),

  // Paiement
  price: z.number()
    .optional()
    .refine(val => !val || val >= 0, {
      message: '⚠️ Le prix ne peut pas être négatif'
    }),
  payment_type: paymentTypeSchema,
  subscription_interval: subscriptionIntervalSchema,

  // Tarification avancée
  pricing: pricingSchema,

  // État
  active: z.boolean().default(true),
  enrollment_open: z.boolean().default(true),

  // Restrictions
  restrictions: restrictionsSchema,

  // Responsable (ajouté côté serveur si non fourni)
  manager_id: z.string().uuid().optional(),
  manager_email: z.string().email().optional(),
})

/**
 * Schéma partiel pour mise à jour d'activité
 */
export const updateActivitySchema = activitySchema.partial()

/**
 * Types inférés
 */
export type ActivityInput = z.infer<typeof activitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>

// =============================================================================
// SCHÉMA ÉVÉNEMENT
// =============================================================================

/**
 * Catégories d'événements
 */
export const eventCategorySchema = z.enum(
  ['religieux', 'communaute', 'education', 'charite'],
  { message: '⚠️ Choisissez une catégorie: religieux, communauté, éducation ou charité' }
)

/**
 * Schéma complet pour créer/modifier un événement
 */
export const eventSchema = z.object({
  // === INFORMATIONS DE BASE ===
  title: z.string()
    .min(1, '⚠️ Le titre est obligatoire - Donnez un nom clair à votre événement (ex: "Conférence sur le Ramadan")')
    .min(3, '⚠️ Le titre doit contenir au moins 3 caractères pour être explicite'),
  slug: z.string()
    .min(1, '⚠️ Le slug est obligatoire - Il sera généré automatiquement à partir du titre')
    .regex(/^[a-z0-9-]+$/, '⚠️ Le slug ne peut contenir que des lettres minuscules, chiffres et tirets (ex: conference-ramadan)'),
  description: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, {
      message: '💡 Astuce: Une description d\'au moins 10 caractères aide les participants à comprendre l\'événement'
    }),
  content: z.string().optional(),
  category: eventCategorySchema,

  // === DATE ET HORAIRES ===
  date: z.string()
    .min(1, '⚠️ La date est obligatoire - Quand aura lieu l\'événement?')
    .refine(val => {
      const eventDate = new Date(val)
      return eventDate >= new Date(new Date().setHours(0, 0, 0, 0))
    }, { message: '⚠️ La date ne peut pas être dans le passé' }),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string()
    .optional()
    .refine(val => !val || val.length >= 3, {
      message: '💡 Précisez le lieu (ex: "Salle de prière principale", "En ligne via Zoom")'
    }),
  image: z.string().optional(),

  // === INSCRIPTIONS ===
  registration_required: z.boolean().default(false),
  max_capacity: z.number()
    .optional()
    .refine(val => !val || val >= 1, {
      message: '⚠️ La capacité doit être d\'au moins 1 personne'
    }),
  requires_approval: z.boolean().default(false),
  registration_deadline: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),

  // === PAIEMENT ===
  price: z.number()
    .optional()
    .refine(val => !val || val >= 0, {
      message: '⚠️ Le prix ne peut pas être négatif'
    }),
  payment_type: paymentTypeSchema,
  subscription_interval: subscriptionIntervalSchema,
  stripe_price_id: z.string().optional(),

  // === POLITIQUE DE REMBOURSEMENT ===
  allow_refund: z.boolean().default(true),
  cancellation_deadline_days: z.number()
    .min(0, '⚠️ Le délai ne peut pas être négatif')
    .max(365, '⚠️ Le délai ne peut pas dépasser 365 jours')
    .default(7),

  // === TARIFICATION AVANCÉE ===
  pricing: pricingSchema,

  // === RESPONSABLE ===
  manager_id: z.string()
    .uuid('⚠️ L\'identifiant du responsable n\'est pas valide')
    .optional(),
  manager_email: z.string()
    .email('⚠️ L\'adresse email du responsable n\'est pas valide (ex: nom@exemple.com)')
    .optional(),

  // === RESTRICTIONS ===
  restrictions: restrictionsSchema,
})

/**
 * Schéma partiel pour mise à jour d'événement
 */
export const updateEventSchema = eventSchema.partial()

/**
 * Types inférés
 */
export type EventInput = z.infer<typeof eventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>

// =============================================================================
// SCHÉMAS ENFANT
// =============================================================================

/**
 * Schéma de genre
 */
export const genderSchema = z.enum(['MALE', 'FEMALE'], {
  message: '⚠️ Le genre doit être MALE ou FEMALE'
})

/**
 * Schéma pour créer un enfant
 */
export const createChildSchema = z.object({
  firstName: z.string()
    .min(1, '⚠️ Le prénom est obligatoire')
    .min(2, '⚠️ Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string()
    .min(1, '⚠️ Le nom est obligatoire')
    .min(2, '⚠️ Le nom doit contenir au moins 2 caractères'),
  nickName: z.string().optional(),
  birthDate: z.string()
    .min(1, '⚠️ La date de naissance est obligatoire')
    .refine(val => {
      const date = new Date(val)
      return date < new Date()
    }, { message: '⚠️ La date de naissance ne peut pas être dans le futur' }),
  gender: genderSchema,
  notes: z.string().optional(),
  avatarUrl: z.string().url().optional().nullable(),
})

/**
 * Schéma partiel pour mise à jour d'enfant
 */
export const updateChildSchema = createChildSchema.partial()

/**
 * Types inférés
 */
export type CreateChildInput = z.infer<typeof createChildSchema>
export type UpdateChildInput = z.infer<typeof updateChildSchema>

// =============================================================================
// SCHÉMAS INSCRIPTION ÉVÉNEMENT
// =============================================================================

/**
 * Schéma de statut d'inscription
 */
export const registrationStatusSchema = z.enum([
  'PENDING',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'WAITING_LIST',
  'PENDING_APPROVAL'
])

/**
 * Schéma pour inscription à un événement
 */
export const eventRegistrationSchema = z.object({
  eventId: z.string().min(1, '⚠️ L\'identifiant de l\'événement est obligatoire'),
  childIds: z.array(z.string()).optional(),
  numberOfAdults: z.number().min(0).default(1),
  numberOfChildren: z.number().min(0).default(0),
  notes: z.string().optional(),
})

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>

// =============================================================================
// SCHÉMAS INSCRIPTION ACTIVITÉ (ENROLLMENT)
// =============================================================================

/**
 * Schéma pour inscription à une activité
 */
export const enrollmentSchema = z.object({
  activityId: z.string().min(1, '⚠️ L\'identifiant de l\'activité est obligatoire'),
  childId: z.string().optional(),
  notes: z.string().optional(),
})

export type EnrollmentInput = z.infer<typeof enrollmentSchema>

// =============================================================================
// SCHÉMAS CONTACT ET SERVICES
// =============================================================================

/**
 * Schéma de message de contact
 */
export const contactMessageSchema = z.object({
  name: z.string().min(1, '⚠️ Le nom est obligatoire'),
  email: z.string().email('⚠️ L\'adresse email n\'est pas valide'),
  phone: z.string().optional(),
  subject: z.string().min(1, '⚠️ Le sujet est obligatoire'),
  message: z.string()
    .min(10, '⚠️ Le message doit contenir au moins 10 caractères'),
})

export type ContactMessageInput = z.infer<typeof contactMessageSchema>

/**
 * Types de services
 */
export const serviceTypeSchema = z.enum([
  'mariage',
  'funerailles',
  'shahada',
  'aqiqa',
  'autre'
])

/**
 * Schéma de demande de service
 */
export const serviceRequestSchema = z.object({
  type: serviceTypeSchema,
  firstName: z.string().min(1, '⚠️ Le prénom est obligatoire'),
  lastName: z.string().min(1, '⚠️ Le nom est obligatoire'),
  email: z.string().email('⚠️ L\'adresse email n\'est pas valide'),
  phone: z.string().min(1, '⚠️ Le téléphone est obligatoire'),
  preferredDate: z.string().optional(),
  notes: z.string().optional(),
})

export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>

// =============================================================================
// SCHÉMAS DON
// =============================================================================

/**
 * Schéma de don
 */
export const donationSchema = z.object({
  amount: z.number()
    .min(1, '⚠️ Le montant minimum est de 1 CHF'),
  projectId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  message: z.string().optional(),
})

export type DonationInput = z.infer<typeof donationSchema>

// =============================================================================
// UTILITAIRES
// =============================================================================

/**
 * Convertit les objets vides {} en null pour éviter les erreurs React
 */
export function sanitizeEmptyObjects<T extends Record<string, unknown>>(
  obj: T | null | undefined
): T | null {
  if (!obj) return null
  if (typeof obj !== 'object') return obj
  if (Object.keys(obj).length === 0) return null
  return obj
}

/**
 * Nettoie un objet avec pricing et restrictions
 */
export function sanitizeContentItem<T extends { pricing?: unknown; restrictions?: unknown }>(
  item: T | null
): T | null {
  if (!item) return null
  return {
    ...item,
    pricing: sanitizeEmptyObjects(item.pricing as Record<string, unknown>),
    restrictions: sanitizeEmptyObjects(item.restrictions as Record<string, unknown>),
  }
}

/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-')     // Remplace caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '')          // Supprime tirets en début/fin
    .substring(0, 100)                // Limite la longueur
}
