import type {
  MawaqitFullData,
  MawaqitAnnouncement,
  PrayerTimes,
  IqamaTimes,
  IqamaTimesDetailed,
  SpecialPrayerInfo,
  TodayPrayerTimesRaw,
  IqamaDayRaw,
} from '@/types/mawaqit'
import { mapPrayerNamesToStandard } from '@/types/mawaqit'

const MAWAQIT_BASE_URL = process.env.MAWAQIT_API_URL || 'https://mawaqit.elghoudi.net/api/v1'
const MASJID_ID = process.env.masjid_id || 'mosque-madretsch-biel-bienne'

// ============================================
// Configuration des endpoints spécialisés
// ============================================
const ENDPOINTS = {
  // /prayer-times est bugué (retourne des horaires incorrects)
  // On utilise /calendar/{month} à la place
  calendar: (month: number) => `${MAWAQIT_BASE_URL}/${MASJID_ID}/calendar/${month}`,
  calendarIqama: (month: number) => `${MAWAQIT_BASE_URL}/${MASJID_ID}/calendar-iqama/${month}`,
  mosqueInfo: `${MAWAQIT_BASE_URL}/${MASJID_ID}/`,
}

// ============================================
// Caches séparés par type de données
// ============================================
interface CacheEntry<T> {
  data: T | null
  timestamp: number
  promise: Promise<T> | null
}

// Cache pour le calendrier mensuel des horaires (TTL: 1 heure) - Map par mois
// On utilise /calendar/{month} au lieu de /prayer-times (bugué)
const calendarCache: Map<number, CacheEntry<TodayPrayerTimesRaw[]>> = new Map()
const CALENDAR_TTL = 60 * 60 * 1000 // 1 heure

// Cache pour l'iqama mensuel (TTL: 1 heure) - Map par mois
const iqamaCache: Map<number, CacheEntry<IqamaDayRaw[]>> = new Map()
const IQAMA_TTL = 60 * 60 * 1000 // 1 heure

// Cache pour les infos mosquée (TTL: 24h)
const mosqueInfoCache: CacheEntry<MawaqitFullData> = {
  data: null,
  timestamp: 0,
  promise: null,
}
const MOSQUE_INFO_TTL = 24 * 60 * 60 * 1000 // 24 heures

// Cache legacy pour compatibilité (TTL: 5 min)
const legacyCache: CacheEntry<MawaqitFullData> = {
  data: null,
  timestamp: 0,
  promise: null,
}
const LEGACY_TTL = 5 * 60 * 1000

// ============================================
// Cache intelligent par date avec pré-fetch après Isha
// ============================================
const PREFETCH_DELAY_MINUTES = 5 // Minutes après Isha pour déclencher le pré-fetch

// Structure du cache quotidien
interface DailyCacheEntry {
  prayerTimes: TodayPrayerTimesRaw | null
  iqama: IqamaDayRaw | null
  timestamp: number
  promise: Promise<{ prayerTimes: TodayPrayerTimesRaw; iqama: IqamaDayRaw }> | null
}

// Cache par date (clé = "YYYY-MM-DD")
const dailyCache: Map<string, DailyCacheEntry> = new Map()

/**
 * Obtient la date au format "YYYY-MM-DD"
 */
function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

/**
 * Obtient la clé de demain
 */
function getTomorrowKey(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return getDateKey(tomorrow)
}

/**
 * Vérifie si on doit pré-charger les données de demain
 * (après Isha + PREFETCH_DELAY_MINUTES et si pas déjà en cache)
 */
function shouldPrefetchTomorrow(ishaTime: string): boolean {
  const now = new Date()
  const [ishaHours, ishaMinutes] = ishaTime.split(':').map(Number)

  // Calculer Isha + délai
  const prefetchTime = new Date()
  prefetchTime.setHours(ishaHours, ishaMinutes + PREFETCH_DELAY_MINUTES, 0, 0)

  // Si on est après Isha + délai ET on n'a pas encore les données de demain
  return now >= prefetchTime && !dailyCache.has(getTomorrowKey())
}

/**
 * Pré-charge les données de demain (non-bloquant)
 * Cette fonction est appelée après Isha + 5 min
 */
async function prefetchTomorrowData(): Promise<void> {
  const tomorrowKey = getTomorrowKey()

  if (dailyCache.has(tomorrowKey)) {
    console.log(`[Mawaqit] Données de demain déjà en cache: ${tomorrowKey}`)
    return
  }

  console.log(`[Mawaqit] Pré-chargement des données de demain: ${tomorrowKey}`)

  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const month = tomorrow.getMonth() + 1
    const dayIndex = tomorrow.getDate() - 1

    // Fetch en parallèle les horaires et l'iqama
    const [calendar, iqamaMonth] = await Promise.all([
      fetchMonthCalendar(month),
      fetchMonthIqama(month),
    ])

    const tomorrowPrayer = calendar[dayIndex]
    const tomorrowIqama = iqamaMonth[dayIndex]

    dailyCache.set(tomorrowKey, {
      prayerTimes: tomorrowPrayer,
      iqama: tomorrowIqama,
      timestamp: Date.now(),
      promise: null,
    })

    console.log(`[Mawaqit] ✅ Données de demain pré-chargées: ${tomorrowKey}`)
  } catch (error) {
    console.error('[Mawaqit] Erreur lors du pré-chargement:', error)
  }
}

/**
 * Nettoie les anciennes entrées du cache (plus de 2 jours)
 */
function cleanupDailyCache(): void {
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const cutoffKey = getDateKey(twoDaysAgo)

  for (const key of dailyCache.keys()) {
    if (key < cutoffKey) {
      dailyCache.delete(key)
      console.log(`[Mawaqit] Cache nettoyé: ${key}`)
    }
  }
}

// Horaires par défaut (approximatifs pour Biel/Bienne) si l'API échoue
const FALLBACK_PRAYER_TIMES: PrayerTimes & { iqama: IqamaTimes } = {
  Fajr: '06:00',
  Sunrise: '07:45',
  Dhuhr: '12:30',
  Asr: '15:00',
  Maghrib: '18:00',
  Isha: '19:30',
  iqama: {
    Fajr: '06:15',
    Dhuhr: '12:45',
    Asr: '15:15',
    Maghrib: '+5',
    Isha: '19:45',
  }
}

/**
 * Ajoute des minutes à une heure au format "HH:mm"
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, mins + minutes, 0, 0)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/**
 * Calcule l'heure d'iqama à partir d'une valeur (fixe ou +N)
 */
function calculateIqamaTime(adhanTime: string, iqamaValue: string): { time: string; isRelative: boolean; offset?: number } {
  if (iqamaValue.startsWith('+')) {
    const offset = parseInt(iqamaValue.substring(1), 10)
    return {
      time: addMinutesToTime(adhanTime, offset),
      isRelative: true,
      offset
    }
  }
  return {
    time: iqamaValue,
    isRelative: false
  }
}

/**
 * Soustrait des minutes à une heure au format "HH:mm"
 */
function subtractMinutesFromTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, mins - minutes, 0, 0)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Erreur personnalisée pour Mawaqit
class MawaqitError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'MawaqitError'
  }
}

// Client principal avec retry logic et cache
async function fetchMawaqit<T>(endpoint: string, revalidate: number = 3600): Promise<T> {
  const url = `${MAWAQIT_BASE_URL}/${endpoint}`
  const maxRetries = 3
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[Mawaqit] Fetching: ${url} (attempt ${i + 1}/${maxRetries})`)

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate, tags: ['mawaqit'] }
      })

      if (!response.ok) {
        throw new MawaqitError(`HTTP ${response.status}: ${response.statusText}`, response.status)
      }

      const response_data = await response.json()
      console.log(`[Mawaqit] Success: ${url}`)

      // L'API Mawaqit retourne { rawdata: {...} }
      const data = response_data.rawdata || response_data
      return data
    } catch (error) {
      lastError = error as Error
      console.error(`[Mawaqit] Error on attempt ${i + 1}:`, error)

      // Attendre avant de retry (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000
        console.log(`[Mawaqit] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new MawaqitError(`Failed after ${maxRetries} attempts: ${lastError?.message}`)
}

// ============================================
// Fonctions de fetch spécialisées (optimisées)
// ============================================

/**
 * Récupère le calendrier mensuel des horaires (endpoint ~3KB)
 * GET /calendar/{month}
 *
 * Note: On utilise cet endpoint au lieu de /prayer-times car ce dernier
 * retourne des horaires incorrects (bug de l'API Mawaqit)
 */
async function fetchMonthCalendar(month: number): Promise<TodayPrayerTimesRaw[]> {
  const now = Date.now()

  // Initialiser le cache pour ce mois si nécessaire
  if (!calendarCache.has(month)) {
    calendarCache.set(month, { data: null, timestamp: 0, promise: null })
  }

  const monthCache = calendarCache.get(month)!

  // Cache valide ?
  if (monthCache.data && (now - monthCache.timestamp) < CALENDAR_TTL) {
    console.log(`[Mawaqit] Cache hit: calendar/${month}`)
    return monthCache.data
  }

  // Requête en cours ?
  if (monthCache.promise) {
    console.log(`[Mawaqit] Waiting for calendar/${month} request...`)
    return monthCache.promise
  }

  console.log(`[Mawaqit] Fetching calendar/${month} (~3KB)`)
  monthCache.promise = fetchMawaqitDirect<TodayPrayerTimesRaw[]>(ENDPOINTS.calendar(month))
    .then(data => {
      monthCache.data = data
      monthCache.timestamp = Date.now()
      monthCache.promise = null
      return data
    })
    .catch(error => {
      monthCache.promise = null
      throw error
    })

  return monthCache.promise
}

/**
 * Récupère les horaires de prière du jour depuis le calendrier mensuel
 */
async function fetchTodayPrayerTimesRaw(): Promise<TodayPrayerTimesRaw> {
  const now = new Date()
  const month = now.getMonth() + 1 // API utilise 1-12
  const dayIndex = now.getDate() - 1 // Index 0-based

  const calendar = await fetchMonthCalendar(month)
  return calendar[dayIndex]
}

/**
 * Récupère l'iqama du mois (endpoint ~2KB)
 * GET /calendar-iqama/{month}
 */
async function fetchMonthIqama(month: number): Promise<IqamaDayRaw[]> {
  const now = Date.now()

  // Initialiser le cache pour ce mois si nécessaire
  if (!iqamaCache.has(month)) {
    iqamaCache.set(month, { data: null, timestamp: 0, promise: null })
  }

  const monthCache = iqamaCache.get(month)!

  // Cache valide ?
  if (monthCache.data && (now - monthCache.timestamp) < IQAMA_TTL) {
    console.log(`[Mawaqit] Cache hit: calendar-iqama/${month}`)
    return monthCache.data
  }

  // Requête en cours ?
  if (monthCache.promise) {
    console.log(`[Mawaqit] Waiting for calendar-iqama/${month} request...`)
    return monthCache.promise
  }

  console.log(`[Mawaqit] Fetching calendar-iqama/${month} (~2KB)`)
  monthCache.promise = fetchMawaqitDirect<IqamaDayRaw[]>(ENDPOINTS.calendarIqama(month))
    .then(data => {
      monthCache.data = data
      monthCache.timestamp = Date.now()
      monthCache.promise = null
      return data
    })
    .catch(error => {
      monthCache.promise = null
      throw error
    })

  return monthCache.promise
}

/**
 * Récupère les infos mosquée (jumua, services, etc.) avec cache long (24h)
 * GET /
 */
async function fetchMosqueInfoCached(): Promise<MawaqitFullData> {
  const now = Date.now()

  // Cache valide ?
  if (mosqueInfoCache.data && (now - mosqueInfoCache.timestamp) < MOSQUE_INFO_TTL) {
    console.log('[Mawaqit] Cache hit: mosque-info (24h)')
    return mosqueInfoCache.data
  }

  // Requête en cours ?
  if (mosqueInfoCache.promise) {
    console.log('[Mawaqit] Waiting for mosque-info request...')
    return mosqueInfoCache.promise
  }

  console.log('[Mawaqit] Fetching mosque-info (cache 24h)')
  mosqueInfoCache.promise = fetchMawaqit<MawaqitFullData>(MASJID_ID, 86400) // 24h
    .then(data => {
      mosqueInfoCache.data = data
      mosqueInfoCache.timestamp = Date.now()
      mosqueInfoCache.promise = null
      return data
    })
    .catch(error => {
      mosqueInfoCache.promise = null
      throw error
    })

  return mosqueInfoCache.promise
}

/**
 * Fetch direct sans le wrapper rawdata (pour endpoints spécialisés)
 */
async function fetchMawaqitDirect<T>(url: string): Promise<T> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[Mawaqit] Direct fetch: ${url} (attempt ${i + 1}/${maxRetries})`)

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 } // 5 min pour Next.js
      })

      if (!response.ok) {
        throw new MawaqitError(`HTTP ${response.status}: ${response.statusText}`, response.status)
      }

      const data = await response.json()
      console.log(`[Mawaqit] Success: ${url}`)
      return data
    } catch (error) {
      lastError = error as Error
      console.error(`[Mawaqit] Error on attempt ${i + 1}:`, error)

      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new MawaqitError(`Failed after ${maxRetries} attempts: ${lastError?.message}`)
}

// ============================================
// Fonctions legacy (maintenues pour compatibilité)
// ============================================

/**
 * Récupère TOUTES les données Mawaqit en 1 seul appel avec cache mémoire
 * Endpoint: /{masjid_id}/
 *
 * Le cache mémoire évite les appels multiples lors du rendu d'une page
 * (plusieurs composants peuvent appeler cette fonction simultanément)
 */
export async function getMawaqitData(): Promise<MawaqitFullData> {
  const now = Date.now()

  // Si le cache legacy est valide, retourner les données en cache
  if (legacyCache.data && (now - legacyCache.timestamp) < LEGACY_TTL) {
    console.log('[Mawaqit] Utilisation du cache legacy')
    return legacyCache.data
  }

  // Si une requête est déjà en cours, attendre le résultat
  if (legacyCache.promise) {
    console.log('[Mawaqit] Attente de la requête legacy en cours...')
    return legacyCache.promise
  }

  // Sinon, lancer une nouvelle requête
  console.log('[Mawaqit] Nouvelle requête legacy API...')
  legacyCache.promise = fetchMawaqit<MawaqitFullData>(MASJID_ID, 3600)
    .then(data => {
      legacyCache.data = data
      legacyCache.timestamp = Date.now()
      legacyCache.promise = null
      return data
    })
    .catch(error => {
      legacyCache.promise = null
      throw error
    })

  return legacyCache.promise
}

/**
 * Invalide tous les caches Mawaqit (utile pour forcer un refresh)
 */
export function invalidateMawaqitCache(): void {
  // Cache legacy
  legacyCache.data = null
  legacyCache.timestamp = 0
  legacyCache.promise = null

  // Cache calendar (horaires mensuels)
  calendarCache.clear()

  // Cache iqama (tous les mois)
  iqamaCache.clear()

  // Cache mosque info
  mosqueInfoCache.data = null
  mosqueInfoCache.timestamp = 0
  mosqueInfoCache.promise = null

  // Cache quotidien (par date)
  dailyCache.clear()

  console.log('[Mawaqit] Tous les caches invalidés')
}

/**
 * Retourne les statistiques du cache (pour debugging)
 */
export function getMawaqitCacheStats(): {
  dailyCacheSize: number
  dailyCacheKeys: string[]
  calendarCacheSize: number
  iqamaCacheSize: number
} {
  return {
    dailyCacheSize: dailyCache.size,
    dailyCacheKeys: Array.from(dailyCache.keys()),
    calendarCacheSize: calendarCache.size,
    iqamaCacheSize: iqamaCache.size,
  }
}

/**
 * Récupère les horaires de prière pour aujourd'hui (OPTIMISÉ avec cache intelligent)
 *
 * STRATÉGIE DE CACHE:
 * - Cache par date: chaque jour a son propre cache
 * - Pré-fetch après Isha + 5 min: on charge les données de demain
 * - À minuit: les données de demain sont déjà prêtes (0 latence)
 *
 * Cela réduit les appels API à 1 seul par jour (après Isha)
 * au lieu de multiples appels avec un TTL classique.
 *
 * Retourne des horaires par défaut si l'API échoue
 */
export async function getMawaqitPrayerTimes(): Promise<PrayerTimes & { iqama: IqamaTimes }> {
  try {
    const today = getDateKey()

    // Nettoyer les anciennes entrées du cache
    cleanupDailyCache()

    // Vérifier si on a les données du jour en cache
    if (dailyCache.has(today)) {
      const cached = dailyCache.get(today)!

      if (cached.prayerTimes && cached.iqama) {
        console.log(`[Mawaqit] Cache hit: ${today}`)

        // Vérifier si on doit pré-charger les données de demain
        if (shouldPrefetchTomorrow(cached.prayerTimes.icha)) {
          // Lancer le pré-fetch en arrière-plan (non-bloquant)
          prefetchTomorrowData()
        }

        // Retourner les données en cache
        const prayerTimes = mapPrayerNamesToStandard(cached.prayerTimes)
        return {
          ...prayerTimes,
          iqama: {
            Fajr: cached.iqama.fajr,
            Dhuhr: cached.iqama.dohr,
            Asr: cached.iqama.asr,
            Maghrib: cached.iqama.maghreb,
            Isha: cached.iqama.icha,
          }
        }
      }
    }

    // Pas de cache → fetch les données
    console.log(`[Mawaqit] Cache miss: ${today}, fetching...`)

    const now = new Date()
    const month = now.getMonth() + 1 // API utilise 1-12
    const dayIndex = now.getDate() - 1 // Index 0-based pour le tableau

    // Fetch en parallèle: horaires du jour + iqama du mois
    const [calendar, iqamaMonth] = await Promise.all([
      fetchMonthCalendar(month),
      fetchMonthIqama(month),
    ])

    const prayerTimesRaw = calendar[dayIndex]
    const todayIqama = iqamaMonth[dayIndex]

    // Sauvegarder dans le cache quotidien
    dailyCache.set(today, {
      prayerTimes: prayerTimesRaw,
      iqama: todayIqama,
      timestamp: Date.now(),
      promise: null,
    })

    console.log(`[Mawaqit] Données en cache: ${today}`)

    // Vérifier si on doit pré-charger demain (après Isha + 5 min)
    if (shouldPrefetchTomorrow(prayerTimesRaw.icha)) {
      prefetchTomorrowData()
    }

    // Convertir les noms de prières
    const prayerTimes = mapPrayerNamesToStandard(prayerTimesRaw)

    return {
      ...prayerTimes,
      iqama: todayIqama ? {
        Fajr: todayIqama.fajr,
        Dhuhr: todayIqama.dohr,
        Asr: todayIqama.asr,
        Maghrib: todayIqama.maghreb,
        Isha: todayIqama.icha,
      } : {
        Fajr: '',
        Dhuhr: '',
        Asr: '',
        Maghrib: '',
        Isha: '',
      }
    }
  } catch (error) {
    console.error('[Mawaqit] Erreur lors de la récupération des horaires, utilisation du fallback:', error)
    return FALLBACK_PRAYER_TIMES
  }
}

/**
 * Récupère les horaires avec détails iqama (fixe ou +N minutes) (OPTIMISÉ)
 *
 * Utilise les endpoints spécialisés pour plus de performance
 */
export async function getMawaqitPrayerTimesWithDetails(): Promise<PrayerTimes & { iqamaDetailed: IqamaTimesDetailed }> {
  const now = new Date()
  const month = now.getMonth() + 1 // API utilise 1-12
  const dayIndex = now.getDate() - 1 // Index 0-based

  // Fetch en parallèle
  const [prayerTimesRaw, iqamaMonth] = await Promise.all([
    fetchTodayPrayerTimesRaw(),
    fetchMonthIqama(month),
  ])

  const prayerTimes = mapPrayerNamesToStandard(prayerTimesRaw)
  const todayIqama = iqamaMonth[dayIndex]

  // Calculer les iqama avec détails (fixe ou +N)
  const iqamaDetailed: IqamaTimesDetailed = todayIqama ? {
    Fajr: calculateIqamaTime(prayerTimes.Fajr, todayIqama.fajr),
    Dhuhr: calculateIqamaTime(prayerTimes.Dhuhr, todayIqama.dohr),
    Asr: calculateIqamaTime(prayerTimes.Asr, todayIqama.asr),
    Maghrib: calculateIqamaTime(prayerTimes.Maghrib, todayIqama.maghreb),
    Isha: calculateIqamaTime(prayerTimes.Isha, todayIqama.icha),
  } : {
    Fajr: { time: '', isRelative: false },
    Dhuhr: { time: '', isRelative: false },
    Asr: { time: '', isRelative: false },
    Maghrib: { time: '', isRelative: false },
    Isha: { time: '', isRelative: false },
  }

  return { ...prayerTimes, iqamaDetailed }
}

/**
 * Extrait le calendrier mensuel des horaires de prière
 * Structure: calendar[month][day] où month=0-11 et day="1"-"31"
 */
export async function getMawaqitMonthlyCalendar(month?: number, year?: number): Promise<Array<{
  timings: PrayerTimes
  iqama: IqamaTimes
  date: { gregorian: { day: string; month: { en: string; number: number }; year: string; weekday: { en: string } } }
}>> {
  const data = await getMawaqitData()
  const now = new Date()
  const targetMonth = month ?? now.getMonth() // 0-indexed
  const targetYear = year ?? now.getFullYear()

  const monthCalendar = data.calendar[targetMonth]
  const monthIqama = data.iqamaCalendar?.[targetMonth]

  if (!monthCalendar) {
    throw new MawaqitError(`Calendrier non disponible pour le mois ${targetMonth + 1}`)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Calculer le nombre de jours dans le mois cible
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  const result: Array<{
    timings: PrayerTimes
    iqama: IqamaTimes
    date: { gregorian: { day: string; month: { en: string; number: number }; year: string; weekday: { en: string } } }
  }> = []

  // Parcourir chaque jour du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const dayKey = day.toString()
    const currentDate = new Date(targetYear, targetMonth, day)

    const dayPrayer = monthCalendar[dayKey] as string[]
    const dayIqama = monthIqama?.[dayKey] as string[] | undefined

    if (!dayPrayer) {
      console.warn(`Horaires non disponibles pour le ${day}/${targetMonth + 1}/${targetYear}`)
      continue
    }

    result.push({
      timings: {
        Fajr: dayPrayer[0],
        Sunrise: dayPrayer[1],
        Dhuhr: dayPrayer[2],
        Asr: dayPrayer[3],
        Maghrib: dayPrayer[4],
        Isha: dayPrayer[5],
      },
      iqama: dayIqama ? {
        Fajr: dayIqama[0],
        Dhuhr: dayIqama[1],
        Asr: dayIqama[2],
        Maghrib: dayIqama[3],
        Isha: dayIqama[4],
      } : {
        Fajr: '',
        Dhuhr: '',
        Asr: '',
        Maghrib: '',
        Isha: '',
      },
      date: {
        gregorian: {
          day: day.toString().padStart(2, '0'),
          month: {
            en: monthNames[targetMonth],
            number: targetMonth + 1
          },
          year: targetYear.toString(),
          weekday: {
            en: dayNames[currentDate.getDay()]
          }
        }
      }
    })
  }

  return result
}

/**
 * Récupère les horaires Joumou'a (OPTIMISÉ avec cache 24h)
 */
export async function getMawaqitJumuahTimes(): Promise<string[]> {
  const data = await fetchMosqueInfoCached() // Cache 24h

  const jumua: string[] = []
  if (data.jumua) jumua.push(data.jumua)
  if (data.jumua2) jumua.push(data.jumua2)
  if (data.jumua3) jumua.push(data.jumua3)

  return jumua
}

/**
 * Récupère les informations de prières spéciales (Joumou'a, Aïd, Imsak) (OPTIMISÉ)
 *
 * Combine:
 * - Cache 24h pour jumua, aid, imsak minutes
 * - Endpoint léger /prayer-times pour le fajr actuel (calcul imsak)
 */
export async function getSpecialPrayerInfo(): Promise<SpecialPrayerInfo> {
  // Fetch en parallèle: infos mosquée (24h cache) + horaires du jour
  const [mosqueData, prayerTimesRaw] = await Promise.all([
    fetchMosqueInfoCached(),
    fetchTodayPrayerTimesRaw(),
  ])

  // Horaires Joumou'a
  const jumua: string[] = []
  if (mosqueData.jumua) jumua.push(mosqueData.jumua)
  if (mosqueData.jumua2) jumua.push(mosqueData.jumua2)
  if (mosqueData.jumua3) jumua.push(mosqueData.jumua3)

  // Horaires Aïd
  const aidPrayer: string[] = []
  if (mosqueData.aidPrayerTime) aidPrayer.push(mosqueData.aidPrayerTime)
  if (mosqueData.aidPrayerTime2) aidPrayer.push(mosqueData.aidPrayerTime2)

  // Calculer Imsak (X minutes avant Fajr)
  let imsak: string | undefined
  if (mosqueData.imsakNbMinBeforeFajr && prayerTimesRaw.fajr) {
    imsak = subtractMinutesFromTime(prayerTimesRaw.fajr, mosqueData.imsakNbMinBeforeFajr)
  }

  // Iftar = Maghrib
  const iftar = prayerTimesRaw.maghreb || undefined

  // Récupérer le message du Joumou'a depuis la BDD (prioritaire sur Mawaqit)
  let jumuaMessage = mosqueData.jumuaMessage
  try {
    const { prisma } = await import('./prisma')
    const localMessage = await prisma.mosqueSettings.findUnique({
      where: { key: 'jumua_message' },
    })
    if (localMessage?.value) {
      jumuaMessage = localMessage.value
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du message local:', error)
  }

  return {
    jumua: jumua.length > 0 ? jumua : undefined,
    jumuaAsDuhr: mosqueData.jumuaAsDuhr,
    jumuaMessage,
    aidPrayer: aidPrayer.length > 0 ? aidPrayer : undefined,
    imsak,
    iftar,
  }
}

/**
 * Récupère les annonces (OPTIMISÉ avec cache 24h)
 */
export async function getMawaqitAnnouncements(): Promise<MawaqitAnnouncement[]> {
  const data = await fetchMosqueInfoCached() // Cache 24h

  if (!data.announcements || data.announcements.length === 0) {
    return []
  }

  // Filtrer les annonces actives
  const now = new Date()
  return data.announcements.filter(ann => {
    if (ann.startDate) {
      const start = new Date(ann.startDate)
      if (now < start) return false
    }
    if (ann.endDate) {
      const end = new Date(ann.endDate)
      if (now > end) return false
    }
    return true
  })
}

/**
 * Récupère les services de la mosquée (OPTIMISÉ avec cache 24h)
 */
export async function getMawaqitServices() {
  const data = await fetchMosqueInfoCached() // Cache 24h

  return {
    womenSpace: data.womenSpace ?? false,
    janazaPrayer: data.janazaPrayer ?? false,
    aidPrayer: data.aidPrayer ?? false,
    childrenCourses: data.childrenCourses ?? false,
    adultCourses: data.adultCourses ?? false,
    ramadanMeal: data.ramadanMeal ?? false,
    handicapAccessibility: data.handicapAccessibility ?? false,
    ablutions: data.ablutions ?? false,
    parking: data.parking ?? false,
  }
}

/**
 * Récupère les informations de la mosquée (OPTIMISÉ avec cache 24h)
 */
export async function getMawaqitMosqueInfo() {
  const data = await fetchMosqueInfoCached() // Cache 24h

  return {
    uuid: data.uuid,
    name: data.name,
    localisation: data.localisation,
    latitude: data.latitude,
    longitude: data.longitude,
  }
}
