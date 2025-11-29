// Types pour l'API Mawaqit
// Documentation: https://mawaqit.elghoudi.net/api/v1/

// Format de réponse brut de l'API Mawaqit (endpoint /{masjid_id}/)
export interface MawaqitPrayerTime {
  fajr: string
  sunrise: string
  dohr: string
  asr: string
  maghreb: string
  icha: string
}

export interface MawaqitIqamaTime {
  fajr: string
  dohr: string
  asr: string
  maghreb: string
  icha: string
}

export interface MawaqitAnnouncement {
  id: number
  uuid: string
  title: string
  content: string | null
  image: string | null
  video: string | null
  startDate: string | null
  endDate: string | null
  updated: string
  duration: number
  isMobile: boolean
  isDesktop: boolean
}

export interface MawaqitServices {
  womenSpace: boolean
  janazaPrayer: boolean
  aidPrayer: boolean
  childrenCourses: boolean
  adultCourses: boolean
  ramadanMeal: boolean
  handicapAccessibility: boolean
  ablutions: boolean
  parking: boolean
}

// Structure complète de la réponse de l'endpoint /{masjid_id}/
export interface MawaqitFullData {
  uuid: string
  name: string
  localisation: string
  latitude: number
  longitude: number
  // Calendrier annuel: objet avec clés 0-11 (mois) contenant des objets avec clés "1"-"31" (jours)
  calendar: {
    [month: number]: {
      [day: string]: string[] // [fajr, sunrise, dohr, asr, maghreb, icha]
    }
  }
  // Calendrier iqama annuel: même structure
  iqamaCalendar: {
    [month: number]: {
      [day: string]: string[] // [fajr, dohr, asr, maghreb, icha]
    }
  }
  // Horaires Joumou'a
  jumuaTime?: string[] | string
  jumua?: string
  jumua2?: string
  jumua3?: string
  jumuaAsDuhr?: boolean
  jumuaMessage?: string // Message personnalisé pour le Joumou'a
  // Prières de l'Aïd
  aidPrayerTime?: string | null
  aidPrayerTime2?: string | null
  // Imsak (Ramadan)
  imsakNbMinBeforeFajr?: number
  // Annonces
  announcements?: MawaqitAnnouncement[]
  // Services
  womenSpace?: boolean
  janazaPrayer?: boolean
  aidPrayer?: boolean
  childrenCourses?: boolean
  adultCourses?: boolean
  ramadanMeal?: boolean
  handicapAccessibility?: boolean
  ablutions?: boolean
  parking?: boolean
}

// Types compatibles avec le système existant
export interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

export interface IqamaTimes {
  Fajr: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

// Horaires iqama avec informations sur le type (fixe ou relatif)
export interface IqamaTimesDetailed {
  Fajr: { time: string; isRelative: boolean; offset?: number }
  Dhuhr: { time: string; isRelative: boolean; offset?: number }
  Asr: { time: string; isRelative: boolean; offset?: number }
  Maghrib: { time: string; isRelative: boolean; offset?: number }
  Isha: { time: string; isRelative: boolean; offset?: number }
}

// Informations spéciales pour les prières (Joumou'a, Aïd, Imsak)
export interface SpecialPrayerInfo {
  jumua?: string[]
  jumuaAsDuhr?: boolean
  jumuaMessage?: string // Message personnalisé pour le Joumou'a
  aidPrayer?: string[]
  imsak?: string
  iftar?: string // Heure de rupture du jeûne (Maghrib)
}
