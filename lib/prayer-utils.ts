import { getPrayerSettings, getPrayerOverrides } from './sanity'

export interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  Tarawih?: string
  Imsak?: string
  Qiyam?: string
}

export async function getPrayerTimesForDate(date: string): Promise<PrayerTimes | null> {
  try {
    // 1. Vérifier s'il existe un override pour cette date
    const overrides = await getPrayerOverrides(date)

    if (overrides && overrides.length > 0) {
      const override = overrides[0]
      const prayers: PrayerTimes = {
        Fajr: override.prayers?.fajr || '',
        Sunrise: override.prayers?.sunrise || '',
        Dhuhr: override.prayers?.dhuhr || '',
        Asr: override.prayers?.asr || '',
        Maghrib: override.prayers?.maghrib || '',
        Isha: override.prayers?.isha || '',
      }

      if (override.specialPrayers) {
        if (override.specialPrayers.tarawih) prayers.Tarawih = override.specialPrayers.tarawih
        if (override.specialPrayers.imsak) prayers.Imsak = override.specialPrayers.imsak
        if (override.specialPrayers.qiyam) prayers.Qiyam = override.specialPrayers.qiyam
      }

      return prayers
    }

    // 2. Sinon, utiliser le JSON annuel
    const settings = await getPrayerSettings()
    if (settings?.annualPrayerTimes) {
      const annualData = JSON.parse(settings.annualPrayerTimes)

      // Trouver l'horaire pour la date donnée
      const dayData = annualData.find((day: any) => day.date === date)

      if (dayData && dayData.timings) {
        return {
          Fajr: dayData.timings.Fajr,
          Sunrise: dayData.timings.Sunrise,
          Dhuhr: dayData.timings.Dhuhr,
          Asr: dayData.timings.Asr,
          Maghrib: dayData.timings.Maghrib,
          Isha: dayData.timings.Isha,
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching prayer times:', error)
    return null
  }
}

export async function getJumuahTimes() {
  const settings = await getPrayerSettings()
  return settings?.jumuahTimes || []
}

export async function getMonthlyPrayerTimes(year: number, month: number) {
  try {
    const settings = await getPrayerSettings()
    if (!settings?.annualPrayerTimes) return []

    const annualData = JSON.parse(settings.annualPrayerTimes)

    // Filtrer pour le mois demandé
    return annualData.filter((day: any) => {
      const [y, m] = day.date.split('-')
      return parseInt(y) === year && parseInt(m) === month
    })
  } catch (error) {
    console.error('Error fetching monthly prayer times:', error)
    return []
  }
}
