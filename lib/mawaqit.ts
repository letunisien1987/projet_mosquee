import type {
  MawaqitFullData,
  MawaqitPrayerTime,
  MawaqitIqamaTime,
  MawaqitAnnouncement,
  PrayerTimes,
  IqamaTimes,
  IqamaTimesDetailed,
  SpecialPrayerInfo,
} from '@/types/mawaqit'

const MAWAQIT_BASE_URL = process.env.MAWAQIT_API_URL || 'https://mawaqit.elghoudi.net/api/v1'
const MASJID_ID = process.env.masjid_id || 'mosque-madretsch-biel-bienne'

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

/**
 * Récupère TOUTES les données Mawaqit en 1 seul appel
 * Endpoint: /{masjid_id}/
 */
export async function getMawaqitData(): Promise<MawaqitFullData> {
  return fetchMawaqit<MawaqitFullData>(MASJID_ID, 3600) // Cache 1h
}

/**
 * Extrait les horaires de prière pour aujourd'hui
 * Structure: calendar[month][day] où month=0-11 et day="1"-"31"
 */
export async function getMawaqitPrayerTimes(): Promise<PrayerTimes & { iqama: IqamaTimes }> {
  const data = await getMawaqitData()
  const now = new Date()
  const month = now.getMonth() // 0-11
  const day = now.getDate().toString() // "1"-"31"

  // Le calendrier est organisé par mois, puis par jour (clés en string)
  const monthCalendar = data.calendar[month]
  const monthIqama = data.iqamaCalendar?.[month]

  if (!monthCalendar || !monthCalendar[day]) {
    throw new MawaqitError(`Horaires non disponibles pour le ${day}/${month + 1}`)
  }

  const todayPrayer = monthCalendar[day] as string[]
  const todayIqama = monthIqama?.[day] as string[] | undefined

  // Le calendrier Mawaqit retourne un tableau [fajr, sunrise, dohr, asr, maghreb, icha]
  return {
    Fajr: todayPrayer[0],
    Sunrise: todayPrayer[1],
    Dhuhr: todayPrayer[2],
    Asr: todayPrayer[3],
    Maghrib: todayPrayer[4],
    Isha: todayPrayer[5],
    iqama: todayIqama ? {
      Fajr: todayIqama[0],
      Dhuhr: todayIqama[1],
      Asr: todayIqama[2],
      Maghrib: todayIqama[3],
      Isha: todayIqama[4],
    } : {
      Fajr: '',
      Dhuhr: '',
      Asr: '',
      Maghrib: '',
      Isha: '',
    }
  }
}

/**
 * Extrait les horaires avec détails iqama (fixe ou +N minutes)
 */
export async function getMawaqitPrayerTimesWithDetails(): Promise<PrayerTimes & { iqamaDetailed: IqamaTimesDetailed }> {
  const data = await getMawaqitData()
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate().toString()

  const monthCalendar = data.calendar[month]
  const monthIqama = data.iqamaCalendar?.[month]

  if (!monthCalendar || !monthCalendar[day]) {
    throw new MawaqitError(`Horaires non disponibles pour le ${day}/${month + 1}`)
  }

  const todayPrayer = monthCalendar[day] as string[]
  const todayIqamaRaw = monthIqama?.[day] as string[] | undefined

  const prayerTimes: PrayerTimes = {
    Fajr: todayPrayer[0],
    Sunrise: todayPrayer[1],
    Dhuhr: todayPrayer[2],
    Asr: todayPrayer[3],
    Maghrib: todayPrayer[4],
    Isha: todayPrayer[5],
  }

  // Calculer les iqama avec détails (fixe ou +N)
  const iqamaDetailed: IqamaTimesDetailed = todayIqamaRaw ? {
    Fajr: calculateIqamaTime(prayerTimes.Fajr, todayIqamaRaw[0]),
    Dhuhr: calculateIqamaTime(prayerTimes.Dhuhr, todayIqamaRaw[1]),
    Asr: calculateIqamaTime(prayerTimes.Asr, todayIqamaRaw[2]),
    Maghrib: calculateIqamaTime(prayerTimes.Maghrib, todayIqamaRaw[3]),
    Isha: calculateIqamaTime(prayerTimes.Isha, todayIqamaRaw[4]),
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
 * Extrait les horaires Joumou'a
 */
export async function getMawaqitJumuahTimes(): Promise<string[]> {
  const data = await getMawaqitData()

  if (!data.jumuaTime) {
    return []
  }

  // jumuaTime peut être string ou string[]
  if (Array.isArray(data.jumuaTime)) {
    return data.jumuaTime
  }

  return [data.jumuaTime]
}

/**
 * Récupère toutes les informations de prières spéciales (Joumou'a, Aïd, Imsak)
 */
export async function getSpecialPrayerInfo(): Promise<SpecialPrayerInfo> {
  const data = await getMawaqitData()
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate().toString()

  const monthCalendar = data.calendar[month]

  // Horaires Joumou'a
  const jumua: string[] = []
  if (data.jumua) jumua.push(data.jumua)
  if (data.jumua2) jumua.push(data.jumua2)
  if (data.jumua3) jumua.push(data.jumua3)

  // Horaires Aïd
  const aidPrayer: string[] = []
  if (data.aidPrayerTime) aidPrayer.push(data.aidPrayerTime)
  if (data.aidPrayerTime2) aidPrayer.push(data.aidPrayerTime2)

  // Calculer Imsak si disponible
  let imsak: string | undefined
  if (monthCalendar && monthCalendar[day] && data.imsakNbMinBeforeFajr) {
    const todayPrayer = monthCalendar[day] as string[]
    const fajrTime = todayPrayer[0]
    imsak = subtractMinutesFromTime(fajrTime, data.imsakNbMinBeforeFajr)
  }

  // Iftar = Maghrib
  let iftar: string | undefined
  if (monthCalendar && monthCalendar[day]) {
    const todayPrayer = monthCalendar[day] as string[]
    iftar = todayPrayer[4] // Maghrib
  }

  // Récupérer le message du Joumou'a depuis la BDD (prioritaire sur Mawaqit)
  let jumuaMessage = data.jumuaMessage
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
    jumuaAsDuhr: data.jumuaAsDuhr,
    jumuaMessage,
    aidPrayer: aidPrayer.length > 0 ? aidPrayer : undefined,
    imsak,
    iftar,
  }
}

/**
 * Extrait les annonces
 */
export async function getMawaqitAnnouncements(): Promise<MawaqitAnnouncement[]> {
  const data = await getMawaqitData()

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
 * Extrait les services de la mosquée
 */
export async function getMawaqitServices() {
  const data = await getMawaqitData()

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
 * Récupère les informations de la mosquée (nom, localisation, coordonnées)
 */
export async function getMawaqitMosqueInfo() {
  const data = await getMawaqitData()

  return {
    uuid: data.uuid,
    name: data.name,
    localisation: data.localisation,
    latitude: data.latitude,
    longitude: data.longitude,
  }
}
