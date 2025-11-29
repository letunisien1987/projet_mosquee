import { getMawaqitPrayerTimes, getMawaqitMonthlyCalendar } from './mawaqit'
import type { IqamaTimes } from '@/types/mawaqit'

export interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

export interface HijriDate {
  date: string
  format: string
  day: string
  weekday: {
    ar: string
    en: string
  }
  month: {
    number: number
    ar: string
    en: string
  }
  year: string
  designation: {
    abbreviated: string
    expanded: string
  }
}

export interface PrayerTimesResponse {
  timings: PrayerTimes
  iqama?: IqamaTimes
  date: {
    readable: string
    timestamp: string
    hijri: HijriDate
    gregorian: {
      date: string
      format: string
      day: string
      weekday: {
        en: string
      }
      month: {
        number: number
        en: string
      }
      year: string
      designation: {
        abbreviated: string
        expanded: string
      }
    }
  }
  meta: {
    latitude: number
    longitude: number
    timezone: string
    method: {
      id: number
      name: string
    }
  }
}

// Noms des mois hijri
const hijriMonthsAr = [
  'مُحَرَّم', 'صَفَر', 'رَبِيع ٱلْأَوَّل', 'رَبِيع ٱلثَّانِي',
  'جُمَادَىٰ ٱلْأُولَىٰ', 'جُمَادَىٰ ٱلثَّانِيَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو ٱلْقَعْدَة', 'ذُو ٱلْحِجَّة'
]

const hijriMonthsEn = [
  'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
  'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
]

const hijriWeekdaysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const hijriWeekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Convertit une date grégorienne en date hijri (calcul approx)
 * Note: Ce n'est qu'une approximation. Pour une précision absolue, utiliser une librairie dédiée
 */
function gregorianToHijri(date: Date): HijriDate {
  // Formule approximative de conversion
  const gregorianYear = date.getFullYear()
  const gregorianMonth = date.getMonth() + 1
  const gregorianDay = date.getDate()

  // Calcul du jour julien
  const a = Math.floor((14 - gregorianMonth) / 12)
  const y = gregorianYear + 4800 - a
  const m = gregorianMonth + (12 * a) - 3
  let jd = gregorianDay + Math.floor((153 * m + 2) / 5) + (365 * y) + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // Conversion en hijri
  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238))
  const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29
  const hijriMonth = Math.floor((24 * l3) / 709)
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24)
  const hijriYear = (30 * n) + j - 30

  const dayOfWeek = date.getDay()

  return {
    date: `${hijriDay.toString().padStart(2, '0')}-${hijriMonth.toString().padStart(2, '0')}-${hijriYear}`,
    format: 'DD-MM-YYYY',
    day: hijriDay.toString().padStart(2, '0'),
    weekday: {
      ar: hijriWeekdaysAr[dayOfWeek],
      en: hijriWeekdaysEn[dayOfWeek]
    },
    month: {
      number: hijriMonth,
      ar: hijriMonthsAr[hijriMonth - 1],
      en: hijriMonthsEn[hijriMonth - 1]
    },
    year: hijriYear.toString(),
    designation: {
      abbreviated: 'AH',
      expanded: 'Anno Hegirae'
    }
  }
}

/**
 * Récupère les horaires de prière du jour depuis l'API Mawaqit
 */
export async function getPrayerTimes(): Promise<PrayerTimesResponse> {
  try {
    const mawaqitData = await getMawaqitPrayerTimes()
    const now = new Date()

    // Date hijri (calcul local)
    const hijri = gregorianToHijri(now)

    // Date grégorienne
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']

    const gregorianDate = {
      date: `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`,
      format: 'DD-MM-YYYY',
      day: now.getDate().toString().padStart(2, '0'),
      weekday: {
        en: dayNames[now.getDay()]
      },
      month: {
        number: now.getMonth() + 1,
        en: monthNames[now.getMonth()]
      },
      year: now.getFullYear().toString(),
      designation: {
        abbreviated: 'CE',
        expanded: 'Common Era'
      }
    }

    return {
      timings: {
        Fajr: mawaqitData.Fajr,
        Sunrise: mawaqitData.Sunrise,
        Dhuhr: mawaqitData.Dhuhr,
        Asr: mawaqitData.Asr,
        Maghrib: mawaqitData.Maghrib,
        Isha: mawaqitData.Isha,
      },
      iqama: mawaqitData.iqama,
      date: {
        readable: now.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        timestamp: now.getTime().toString(),
        hijri,
        gregorian: gregorianDate
      },
      meta: {
        latitude: 47.1449,
        longitude: 7.2437,
        timezone: 'Europe/Zurich',
        method: {
          id: 3,
          name: 'Mosquée Madretsch (Mawaqit)'
        }
      }
    }
  } catch (error) {
    console.error('[Prayer Times] Erreur Mawaqit:', error)
    throw error
  }
}

/**
 * Récupère le calendrier mensuel des horaires de prière
 */
export async function getMonthlyPrayerTimes(
  _city?: string,
  _country?: string,
  month?: number,
  year?: number
): Promise<PrayerTimesResponse[]> {
  try {
    const monthlyData = await getMawaqitMonthlyCalendar(month, year)

    return monthlyData.map((day) => {
      const dayDate = new Date(
        parseInt(day.date.gregorian.year),
        day.date.gregorian.month.number - 1,
        parseInt(day.date.gregorian.day)
      )

      const hijri = gregorianToHijri(dayDate)

      return {
        timings: day.timings,
        iqama: day.iqama,
        date: {
          readable: dayDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          timestamp: dayDate.getTime().toString(),
          hijri,
          gregorian: {
            ...day.date.gregorian,
            format: 'DD-MM-YYYY',
            designation: {
              abbreviated: 'CE',
              expanded: 'Common Era'
            }
          }
        },
        meta: {
          latitude: 47.1449,
          longitude: 7.2437,
          timezone: 'Europe/Zurich',
          method: {
            id: 3,
            name: 'Mosquée Madretsch (Mawaqit)'
          }
        }
      }
    })
  } catch (error) {
    console.error('[Prayer Times] Erreur Mawaqit monthly:', error)
    throw error
  }
}

/**
 * Détermine la prochaine prière
 */
export function getNextPrayer(timings: PrayerTimes): { name: string; time: string } | null {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const prayers = [
    { name: 'Fajr', time: timings.Fajr },
    { name: 'Dhuhr', time: timings.Dhuhr },
    { name: 'Asr', time: timings.Asr },
    { name: 'Maghrib', time: timings.Maghrib },
    { name: 'Isha', time: timings.Isha },
  ]

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number)
    const prayerTime = hours * 60 + minutes

    if (prayerTime > currentTime) {
      return prayer
    }
  }

  // Si aucune prière trouvée aujourd'hui, retourner Fajr de demain
  return { name: 'Fajr', time: timings.Fajr }
}

/**
 * Formate une date hijri
 */
export function formatHijriDate(hijri: HijriDate): string {
  return `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`
}

/**
 * Vérifie si nous sommes dans le mois de Ramadan
 */
export function isRamadan(hijri: HijriDate): boolean {
  return hijri.month.number === 9 // Ramadan = mois 9 du calendrier hijri
}
