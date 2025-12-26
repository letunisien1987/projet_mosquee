/**
 * Configuration centralisée des durées de cache
 *
 * Définit les TTL (Time To Live) pour différents types de données.
 * Les valeurs sont en secondes sauf indication contraire.
 */

export const CACHE_DURATIONS = {
  /**
   * Cache des settings de la mosquée
   * Relativement court car modifiable par l'admin
   */
  settings: 60, // 1 minute

  /**
   * Cache des horaires de prière (Mawaqit)
   * Changent une fois par jour, cache plus long
   */
  prayerTimes: 3600, // 1 heure

  /**
   * Cache des annonces Mawaqit
   */
  announcements: 1800, // 30 minutes

  /**
   * Cache des équipes/membres
   */
  teamMembers: 3600, // 1 heure

  /**
   * Cache des événements publics
   */
  events: 300, // 5 minutes

  /**
   * Cache des activités publiques
   */
  activities: 300, // 5 minutes

  /**
   * Cache des statistiques du dashboard admin
   */
  adminStats: 60, // 1 minute

  /**
   * Cache des projets de don
   */
  donationProjects: 300, // 5 minutes
} as const

/**
 * Timeouts pour les opérations async
 * Valeurs en millisecondes
 */
export const TIMEOUTS = {
  /**
   * Timeout pour les appels API externes (Mawaqit, Stripe)
   */
  externalApi: 10000, // 10 secondes

  /**
   * Timeout pour les opérations de base de données
   */
  database: 30000, // 30 secondes

  /**
   * Timeout pour l'envoi d'emails
   */
  email: 15000, // 15 secondes

  /**
   * Timeout pour la génération de PDFs
   */
  pdfGeneration: 60000, // 1 minute
} as const

/**
 * Intervalles pour les tâches périodiques
 * Valeurs en millisecondes
 */
export const INTERVALS = {
  /**
   * Intervalle de rafraîchissement des horaires de prière
   */
  prayerTimesRefresh: 3600000, // 1 heure

  /**
   * Intervalle de nettoyage du cache de rate limiting
   */
  rateLimitCleanup: 300000, // 5 minutes

  /**
   * Intervalle du carousel d'annonces (frontend)
   */
  announcementCarousel: 8000, // 8 secondes

  /**
   * Délai avant de masquer les messages de succès
   */
  successMessageDismiss: 5000, // 5 secondes

  /**
   * Délai du tooltip "Copié !" pour IBAN
   */
  copiedTooltip: 2000, // 2 secondes
} as const

export type CacheKey = keyof typeof CACHE_DURATIONS
export type TimeoutKey = keyof typeof TIMEOUTS
export type IntervalKey = keyof typeof INTERVALS
