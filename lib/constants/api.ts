/**
 * API Endpoints Constants
 *
 * Centralizes all API endpoint URLs to avoid magic strings across the codebase.
 * Import these constants instead of hardcoding endpoint paths.
 */

// Base paths
export const API_BASE = '/api'
export const API_MEMBRE = `${API_BASE}/membre`
export const API_ADMIN = `${API_BASE}/admin`
export const API_ACCOUNT = `${API_BASE}/account`

// Member API endpoints
export const API_ENDPOINTS = {
  // Auth
  auth: {
    session: '/api/auth/session',
    signIn: '/api/auth/signin',
    signOut: '/api/auth/signout',
  },

  // Member profile
  membre: {
    profil: `${API_MEMBRE}/profil`,
    notifications: `${API_MEMBRE}/notifications`,
    notificationRead: (id: string) => `${API_MEMBRE}/notifications/${id}/read`,
    donsExport: `${API_MEMBRE}/dons/export`,
    organisateur: {
      events: `${API_MEMBRE}/organisateur/events`,
      activities: `${API_MEMBRE}/organisateur/activities`,
      eventDetail: (id: string) => `${API_MEMBRE}/organisateur/events/${id}`,
      activityDetail: (id: string) => `${API_MEMBRE}/organisateur/activities/${id}`,
    },
  },

  // Account (children management)
  account: {
    children: `${API_ACCOUNT}/children`,
    child: (id: string) => `${API_ACCOUNT}/children/${id}`,
  },

  // Public endpoints
  public: {
    prayerTimes: `${API_BASE}/prayer-times`,
    contact: `${API_BASE}/contact`,
    donations: `${API_BASE}/donations`,
    enrollments: `${API_BASE}/enrollments`,
    events: {
      list: `${API_BASE}/events`,
      register: (id: string) => `${API_BASE}/events/${id}/register`,
      checkout: (id: string) => `${API_BASE}/events/${id}/checkout`,
      availability: (id: string) => `${API_BASE}/events/${id}/availability`,
    },
    activities: {
      list: `${API_BASE}/activities`,
      enroll: (id: string) => `${API_BASE}/activities/${id}/enroll`,
    },
    serviceRequests: `${API_BASE}/service-requests`,
  },

  // Admin endpoints
  admin: {
    stats: `${API_ADMIN}/stats`,
    users: `${API_ADMIN}/users`,
    user: (id: string) => `${API_ADMIN}/users/${id}`,
    members: `${API_ADMIN}/members`,
    member: (id: string) => `${API_ADMIN}/members/${id}`,
    eventRegistrations: `${API_ADMIN}/event-registrations`,
    eventRegistration: (id: string) => `${API_ADMIN}/event-registrations/${id}`,
    enrollments: `${API_ADMIN}/enrollments`,
    enrollment: (id: string) => `${API_ADMIN}/enrollments/${id}`,
    donations: `${API_ADMIN}/donations`,
    donation: (id: string) => `${API_ADMIN}/donations/${id}`,
    messages: `${API_ADMIN}/messages`,
    message: (id: string) => `${API_ADMIN}/messages/${id}`,
    services: `${API_ADMIN}/services`,
    service: (id: string) => `${API_ADMIN}/services/${id}`,
    cotisations: `${API_ADMIN}/cotisations`,
    cotisation: (id: string) => `${API_ADMIN}/cotisations/${id}`,
    importPrayerTimes: `${API_ADMIN}/import-prayer-times`,
    parametres: `${API_ADMIN}/parametres`,
    adhesions: `${API_ADMIN}/adhesions`,
    adhesion: (id: string) => `${API_ADMIN}/adhesions/${id}`,
    activities: {
      list: `${API_ADMIN}/activities`,
      detail: (id: string) => `${API_ADMIN}/activities/${id}`,
      registrations: (id: string) => `${API_ADMIN}/activities/${id}/registrations`,
    },
    events: {
      list: `${API_ADMIN}/events`,
      detail: (id: string) => `${API_ADMIN}/events/${id}`,
      registrations: (id: string) => `${API_ADMIN}/events/${id}/registrations`,
    },
  },

  // Stripe
  stripe: {
    webhook: `${API_BASE}/stripe/webhook`,
    checkout: `${API_BASE}/stripe/checkout`,
  },

  // Setup
  setup: {
    createAdmin: `${API_BASE}/setup/create-admin`,
  },
} as const

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

// Common error messages (French)
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action',
  FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires',
  NOT_FOUND: 'Ressource non trouvée',
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  TIMEOUT: 'La requête a pris trop de temps',
  UNKNOWN: 'Une erreur inattendue est survenue',
  VALIDATION: 'Les données fournies sont invalides',
  CONFLICT: 'Cette ressource existe déjà',
} as const

// Date format constants (Swiss French)
export const DATE_FORMAT = {
  locale: 'fr-CH',
  date: { day: '2-digit', month: '2-digit', year: 'numeric' } as const,
  dateTime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } as const,
  dateLong: { day: 'numeric', month: 'long', year: 'numeric' } as const,
  time: { hour: '2-digit', minute: '2-digit' } as const,
} as const

// Helper function to format dates consistently
export type DateFormatType = 'date' | 'dateTime' | 'dateLong' | 'time'

export function formatDate(
  date: Date | string,
  format: DateFormatType = 'date'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  switch (format) {
    case 'dateTime':
      return d.toLocaleDateString(DATE_FORMAT.locale, DATE_FORMAT.dateTime)
    case 'dateLong':
      return d.toLocaleDateString(DATE_FORMAT.locale, DATE_FORMAT.dateLong)
    case 'time':
      return d.toLocaleTimeString(DATE_FORMAT.locale, DATE_FORMAT.time)
    default:
      return d.toLocaleDateString(DATE_FORMAT.locale, DATE_FORMAT.date)
  }
}

export default API_ENDPOINTS
