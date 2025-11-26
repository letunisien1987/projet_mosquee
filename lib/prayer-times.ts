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

export async function getPrayerTimes(city: string = "Paris", country: string = "France"): Promise<PrayerTimesResponse> {
  const response = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=3`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  )

  if (!response.ok) {
    throw new Error('Failed to fetch prayer times')
  }

  const data = await response.json()
  return data.data
}

export async function getMonthlyPrayerTimes(
  city: string = "Paris",
  country: string = "France",
  month?: number,
  year?: number
): Promise<PrayerTimesResponse[]> {
  const now = new Date()
  const targetMonth = month ?? now.getMonth() + 1
  const targetYear = year ?? now.getFullYear()

  const response = await fetch(
    `https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=3&month=${targetMonth}&year=${targetYear}`,
    { next: { revalidate: 86400 } } // Cache for 24 hours
  )

  if (!response.ok) {
    throw new Error('Failed to fetch monthly prayer times')
  }

  const data = await response.json()
  return data.data
}

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

  // If no prayer is found today, return Fajr for tomorrow
  return { name: 'Fajr', time: timings.Fajr }
}

export function formatHijriDate(hijri: HijriDate): string {
  return `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`
}
