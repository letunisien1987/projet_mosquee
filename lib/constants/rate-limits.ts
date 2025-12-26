/**
 * Configuration centralisée du rate limiting
 *
 * Définit les limites de requêtes par IP pour chaque endpoint sensible.
 * Ces valeurs peuvent être ajustées selon les besoins de sécurité.
 */

export const RATE_LIMITS = {
  /**
   * Limite pour les dons (POST /api/donations)
   * Protège contre les abus de paiement
   */
  donations: {
    limit: 5,
    windowMs: 60000, // 1 minute
  },

  /**
   * Limite pour l'enregistrement de dons (POST /api/donations/record)
   */
  donationsRecord: {
    limit: 10,
    windowMs: 60000,
  },

  /**
   * Limite pour le formulaire de contact (POST /api/contact)
   * Protège contre le spam
   */
  contact: {
    limit: 5,
    windowMs: 60000,
  },

  /**
   * Limite pour les demandes d'adhésion (POST /api/membership/apply)
   * Plus restrictif car action sensible
   */
  membership: {
    limit: 3,
    windowMs: 60000,
  },

  /**
   * Limite pour les inscriptions aux événements
   */
  eventRegistrations: {
    limit: 10,
    windowMs: 60000,
  },

  /**
   * Limite pour les inscriptions aux activités
   */
  enrollments: {
    limit: 10,
    windowMs: 60000,
  },

  /**
   * Limite pour les demandes de service
   */
  serviceRequests: {
    limit: 5,
    windowMs: 60000,
  },

  /**
   * Limite générale pour les API authentifiées
   */
  authenticated: {
    limit: 30,
    windowMs: 60000,
  },

  /**
   * Limite pour les tentatives de connexion
   */
  login: {
    limit: 5,
    windowMs: 300000, // 5 minutes
  },
} as const

export type RateLimitKey = keyof typeof RATE_LIMITS
