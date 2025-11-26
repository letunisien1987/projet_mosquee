import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeClient } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'IMAM'].includes(session.user.role!)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { year, city = 'Bienne', country = 'Switzerland', method = 3 } = body

    if (!year) {
      return NextResponse.json({ error: 'Année requise' }, { status: 400 })
    }

    // Importer les horaires pour toute l'année
    const allPrayerTimes = []

    for (let month = 1; month <= 12; month++) {
      const response = await fetch(
        `https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=${method}&month=${month}&year=${year}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch prayer times for month ${month}`)
      }

      const data = await response.json()

      // Formater les données
      for (const day of data.data) {
        allPrayerTimes.push({
          date: day.date.gregorian.date,
          timings: {
            Fajr: day.timings.Fajr.split(' ')[0],
            Sunrise: day.timings.Sunrise.split(' ')[0],
            Dhuhr: day.timings.Dhuhr.split(' ')[0],
            Asr: day.timings.Asr.split(' ')[0],
            Maghrib: day.timings.Maghrib.split(' ')[0],
            Isha: day.timings.Isha.split(' ')[0],
          },
          hijri: day.date.hijri,
        })
      }

      // Pause pour éviter de surcharger l'API
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Trouver ou créer le document prayerSettings dans Sanity
    const existingSettings = await writeClient.fetch(`*[_type == "prayerSettings"][0]`)

    const settingsData = {
      _type: 'prayerSettings',
      city,
      country,
      calculationMethod: method,
      annualPrayerTimes: JSON.stringify(allPrayerTimes),
      lastImportDate: new Date().toISOString(),
    }

    let result
    if (existingSettings) {
      result = await writeClient.patch(existingSettings._id).set(settingsData).commit()
    } else {
      result = await writeClient.create(settingsData)
    }

    return NextResponse.json({
      success: true,
      message: `Horaires importés pour l'année ${year}`,
      totalDays: allPrayerTimes.length,
      result,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'importation' }, { status: 500 })
  }
}
