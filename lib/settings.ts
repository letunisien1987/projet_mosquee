/**
 * Helper centralisé pour les paramètres de la mosquée
 *
 * Récupère les settings depuis Directus avec cache (60s)
 * et fournit des valeurs par défaut sécurisées.
 */

import { getMosqueSettings, DirectusMosqueSettings } from './directus'

/**
 * Interface étendue avec tous les champs configurables
 */
export interface MosqueSettings extends DirectusMosqueSettings {
  // ========== COUCHE 1: IDENTITÉ ==========

  // Horaires d'ouverture
  opening_hours_weekday?: string   // "09:00 - 20:00"
  opening_hours_friday?: string    // "09:00 - 22:00"
  opening_hours_weekend?: string   // "08:00 - 21:00"

  // Transport
  transport_bus?: string           // "Lignes 1, 4, 5 - Arrêt Madretsch"
  transport_tram?: string          // "Ligne 2 - Arrêt Madretsch"
  parking_info?: string            // "Places de stationnement disponibles"

  // Coordonnées GPS (pour carte)
  map_latitude?: number            // 47.14449
  map_longitude?: number           // 7.245678

  // Statistiques (page About)
  founding_year?: number           // 1995
  stat_regular_attendees?: string  // "500+"
  stat_programs?: string           // "25+"
  stat_students?: string           // "150+"

  // ========== COUCHE 2: TARIFS GLOBAUX ==========

  // Tarification adhésion
  membership_monthly_price?: number
  membership_annual_price?: number
  membership_full_price?: number

  // Presets dons (en centimes)
  donation_preset_1?: number       // 2000 (20 CHF)
  donation_preset_2?: number       // 5000 (50 CHF)
  donation_preset_3?: number       // 10000 (100 CHF)
  donation_preset_4?: number       // 20000 (200 CHF)

  // Limites dons (en centimes)
  donation_min?: number            // 100 (1 CHF min)
  donation_max?: number            // 10000000 (100000 CHF max)

  // Délais système
  payment_link_validity_days?: number  // 7 jours
  default_cancellation_days?: number   // 7 jours

  // Email dons (distinct de contact_email)
  donation_email?: string

  // Nom de la banque
  bank_name?: string
}

/**
 * Valeurs par défaut si Directus n'est pas disponible
 */
export const DEFAULT_SETTINGS: MosqueSettings = {
  id: 'default',
  name: 'Mosquée Madretsch',
  description: 'Association Islamique de Bienne',

  // Adresse
  address_street: 'Madretschstrasse 64',
  address_city: 'Biel/Bienne',
  address_postal_code: '2503',
  address_country: 'Suisse',

  // Contact
  contact_email: 'info@mosque-madretsch.ch',
  contact_phone: '+41 32 123 45 67',
  donation_email: 'dons@mosque-madretsch.ch',

  // Banque
  bank_iban: 'CH00 0000 0000 0000 0000 0',
  bank_bic: 'POFICHBEXXX',
  bank_account_holder: 'Association Mosquée Madretsch',
  bank_name: 'PostFinance SA',

  // ========== COUCHE 1: IDENTITÉ ==========

  // Horaires d'ouverture
  opening_hours: 'Ouvert tous les jours\nPrières du Fajr jusqu\'à Isha',
  opening_hours_weekday: '09:00 - 20:00',
  opening_hours_friday: '09:00 - 22:00',
  opening_hours_weekend: '08:00 - 21:00',

  // Transport
  transport_bus: 'Lignes 1, 4, 5 - Arrêt Madretsch',
  transport_tram: 'Ligne 2 - Arrêt Madretsch',
  parking_info: 'Places de stationnement disponibles',

  // Coordonnées GPS
  map_latitude: 47.14449,
  map_longitude: 7.245678,

  // Statistiques
  founding_year: 1995,
  stat_regular_attendees: '500+',
  stat_programs: '25+',
  stat_students: '150+',

  // Capacité
  capacity: 200,

  // ========== COUCHE 2: TARIFS GLOBAUX ==========

  // Tarification adhésion
  membership_monthly_price: 20,
  membership_annual_price: 200,
  membership_full_price: 120,

  // Presets dons (en centimes)
  donation_preset_1: 2000,   // 20 CHF
  donation_preset_2: 5000,   // 50 CHF
  donation_preset_3: 10000,  // 100 CHF
  donation_preset_4: 20000,  // 200 CHF

  // Limites dons (en centimes)
  donation_min: 100,         // 1 CHF min
  donation_max: 10000000,    // 100000 CHF max

  // Délais système
  payment_link_validity_days: 7,
  default_cancellation_days: 7,
}

// Cache pour les settings
let cachedSettings: MosqueSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 1000 // 60 secondes

/**
 * Récupère les paramètres de la mosquée avec cache
 *
 * @param forceRefresh - Forcer le rafraîchissement du cache
 * @returns Les paramètres de la mosquée
 */
export async function getSettings(forceRefresh = false): Promise<MosqueSettings> {
  const now = Date.now()

  // Retourner le cache si valide et pas de force refresh
  if (!forceRefresh && cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSettings
  }

  try {
    const directusSettings = await getMosqueSettings()

    if (directusSettings) {
      // Fusionner avec les valeurs par défaut pour les champs manquants
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...directusSettings,
        // S'assurer que les tarifs ont des valeurs numériques
        membership_monthly_price: (directusSettings as any).membership_monthly_price ?? DEFAULT_SETTINGS.membership_monthly_price,
        membership_annual_price: (directusSettings as any).membership_annual_price ?? DEFAULT_SETTINGS.membership_annual_price,
        membership_full_price: (directusSettings as any).membership_full_price ?? DEFAULT_SETTINGS.membership_full_price,
      }
      cacheTimestamp = now
      return cachedSettings
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des settings:', error)
  }

  // Retourner les valeurs par défaut si erreur
  return DEFAULT_SETTINGS
}

/**
 * Invalide le cache des settings
 * Appelé après une modification des paramètres
 */
export function invalidateSettingsCache(): void {
  cachedSettings = null
  cacheTimestamp = 0
}

/**
 * Obtient l'adresse formatée
 */
export function getFormattedAddress(settings: MosqueSettings): string {
  const parts = [
    settings.address_street,
    `${settings.address_postal_code} ${settings.address_city}`,
    settings.address_country,
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Obtient les informations bancaires formatées
 */
export function getBankInfo(settings: MosqueSettings) {
  return {
    name: settings.bank_account_holder || DEFAULT_SETTINGS.bank_account_holder,
    iban: settings.bank_iban || DEFAULT_SETTINGS.bank_iban,
    bic: settings.bank_bic || DEFAULT_SETTINGS.bank_bic,
    bank: settings.bank_name || DEFAULT_SETTINGS.bank_name,
    address: getFormattedAddress(settings),
  }
}

/**
 * Obtient les tarifs d'adhésion
 */
export function getMembershipPrices(settings: MosqueSettings) {
  return {
    monthly: settings.membership_monthly_price ?? DEFAULT_SETTINGS.membership_monthly_price!,
    annual: settings.membership_annual_price ?? DEFAULT_SETTINGS.membership_annual_price!,
    full: settings.membership_full_price ?? DEFAULT_SETTINGS.membership_full_price!,
  }
}

/**
 * Obtient les horaires d'ouverture formatés
 */
export function getOpeningHours(settings: MosqueSettings) {
  return [
    {
      day: 'Lundi - Jeudi',
      hours: settings.opening_hours_weekday ?? DEFAULT_SETTINGS.opening_hours_weekday!,
    },
    {
      day: 'Vendredi',
      hours: settings.opening_hours_friday ?? DEFAULT_SETTINGS.opening_hours_friday!,
    },
    {
      day: 'Samedi - Dimanche',
      hours: settings.opening_hours_weekend ?? DEFAULT_SETTINGS.opening_hours_weekend!,
    },
  ]
}

/**
 * Obtient les informations de transport
 */
export function getTransportInfo(settings: MosqueSettings) {
  return {
    bus: settings.transport_bus ?? DEFAULT_SETTINGS.transport_bus!,
    tram: settings.transport_tram ?? DEFAULT_SETTINGS.transport_tram!,
    parking: settings.parking_info ?? DEFAULT_SETTINGS.parking_info!,
  }
}

/**
 * Obtient les coordonnées GPS pour la carte
 */
export function getMapCoordinates(settings: MosqueSettings) {
  return {
    latitude: settings.map_latitude ?? DEFAULT_SETTINGS.map_latitude!,
    longitude: settings.map_longitude ?? DEFAULT_SETTINGS.map_longitude!,
  }
}

/**
 * Obtient les statistiques de la mosquée
 */
export function getMosqueStats(settings: MosqueSettings) {
  return {
    foundingYear: settings.founding_year ?? DEFAULT_SETTINGS.founding_year!,
    regularAttendees: settings.stat_regular_attendees ?? DEFAULT_SETTINGS.stat_regular_attendees!,
    programs: settings.stat_programs ?? DEFAULT_SETTINGS.stat_programs!,
    students: settings.stat_students ?? DEFAULT_SETTINGS.stat_students!,
  }
}

/**
 * Obtient les presets de dons (en centimes)
 */
export function getDonationPresets(settings: MosqueSettings) {
  return [
    settings.donation_preset_1 ?? DEFAULT_SETTINGS.donation_preset_1!,
    settings.donation_preset_2 ?? DEFAULT_SETTINGS.donation_preset_2!,
    settings.donation_preset_3 ?? DEFAULT_SETTINGS.donation_preset_3!,
    settings.donation_preset_4 ?? DEFAULT_SETTINGS.donation_preset_4!,
  ]
}

/**
 * Obtient les limites de dons (en centimes)
 */
export function getDonationLimits(settings: MosqueSettings) {
  return {
    min: settings.donation_min ?? DEFAULT_SETTINGS.donation_min!,
    max: settings.donation_max ?? DEFAULT_SETTINGS.donation_max!,
  }
}

/**
 * Obtient les délais système
 */
export function getSystemDelays(settings: MosqueSettings) {
  return {
    paymentLinkValidityDays: settings.payment_link_validity_days ?? DEFAULT_SETTINGS.payment_link_validity_days!,
    defaultCancellationDays: settings.default_cancellation_days ?? DEFAULT_SETTINGS.default_cancellation_days!,
  }
}
