import { NextRequest, NextResponse } from 'next/server'
import { getPrayerTimesForDate, getMonthlyPrayerTimes, getJumuahTimes } from '@/lib/prayer-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type') // 'today', 'month', 'jumuah'

    if (type === 'jumuah') {
      const jumuahTimes = await getJumuahTimes()
      return NextResponse.json({ jumuahTimes })
    }

    if (type === 'month' && month && year) {
      const monthlyTimes = await getMonthlyPrayerTimes(parseInt(year), parseInt(month))
      return NextResponse.json({ monthlyTimes })
    }

    // Par défaut, retourner les horaires du jour
    const today = date || new Date().toISOString().split('T')[0]
    const prayerTimes = await getPrayerTimesForDate(today)

    if (!prayerTimes) {
      return NextResponse.json(
        { error: 'Horaires non disponibles pour cette date' },
        { status: 404 }
      )
    }

    return NextResponse.json({ date: today, prayerTimes })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
