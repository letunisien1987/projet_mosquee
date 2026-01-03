import { NextResponse } from 'next/server'
import { getMawaqitPrayerTimes } from '@/lib/mawaqit'

/**
 * API Route: Horaires de prière
 * GET /api/prayer-times
 *
 * Récupère les horaires depuis Mawaqit (avec cache intégré dans lib/mawaqit.ts)
 */
export async function GET() {
  try {
    console.log('[PrayerTimes] Récupération depuis Mawaqit')
    const prayerTimes = await getMawaqitPrayerTimes()

    return NextResponse.json({
      Fajr: prayerTimes.Fajr,
      Sunrise: prayerTimes.Sunrise,
      Dhuhr: prayerTimes.Dhuhr,
      Asr: prayerTimes.Asr,
      Maghrib: prayerTimes.Maghrib,
      Isha: prayerTimes.Isha,
      iqama: prayerTimes.iqama,
      source: 'mawaqit',
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires de prière:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des horaires de prière' },
      { status: 500 }
    )
  }
}
