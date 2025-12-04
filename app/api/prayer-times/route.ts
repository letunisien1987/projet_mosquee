import { NextResponse } from 'next/server'
import { getMawaqitPrayerTimes } from '@/lib/mawaqit'
import { createDirectus, rest, readItems, createItem, updateItem, staticToken } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN

interface StoredPrayerTimes {
  id?: number
  date: string
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
}

// Récupérer les horaires stockés dans Directus
async function getStoredPrayerTimes(): Promise<StoredPrayerTimes | null> {
  if (!DIRECTUS_TOKEN) return null

  try {
    const client = createDirectus(DIRECTUS_URL)
      .with(staticToken(DIRECTUS_TOKEN))
      .with(rest())
    const today = new Date().toISOString().split('T')[0]

    const results = await client.request(
      readItems('daily_prayer_times' as any, {
        filter: { date: { _eq: today } },
        limit: 1,
      })
    ) as StoredPrayerTimes[]

    return results?.[0] || null
  } catch {
    // Collection n'existe pas encore ou erreur
    return null
  }
}

// Stocker les horaires dans Directus
async function storePrayerTimes(prayerTimes: {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}): Promise<void> {
  if (!DIRECTUS_TOKEN) return

  try {
    const client = createDirectus(DIRECTUS_URL)
      .with(staticToken(DIRECTUS_TOKEN))
      .with(rest())
    const today = new Date().toISOString().split('T')[0]

    // Vérifier si un enregistrement existe déjà
    const existing = await getStoredPrayerTimes()

    const data = {
      date: today,
      fajr: prayerTimes.Fajr,
      sunrise: prayerTimes.Sunrise,
      dhuhr: prayerTimes.Dhuhr,
      asr: prayerTimes.Asr,
      maghrib: prayerTimes.Maghrib,
      isha: prayerTimes.Isha,
      updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
      await client.request(updateItem('daily_prayer_times' as any, existing.id, data))
    } else {
      await client.request(createItem('daily_prayer_times' as any, data))
    }
  } catch (error) {
    console.error('[PrayerTimes] Erreur stockage:', error)
    // On continue même si le stockage échoue
  }
}

export async function GET() {
  try {
    // 1. Essayer de récupérer les horaires stockés (plus rapide)
    const stored = await getStoredPrayerTimes()

    if (stored) {
      console.log('[PrayerTimes] Utilisation des horaires stockés')
      return NextResponse.json({
        Fajr: stored.fajr,
        Sunrise: stored.sunrise,
        Dhuhr: stored.dhuhr,
        Asr: stored.asr,
        Maghrib: stored.maghrib,
        Isha: stored.isha,
        source: 'stored',
      })
    }

    // 2. Sinon, récupérer de Mawaqit et stocker
    console.log('[PrayerTimes] Récupération depuis Mawaqit')
    const prayerTimes = await getMawaqitPrayerTimes()

    // Stocker pour les prochaines requêtes (async, on n'attend pas)
    storePrayerTimes(prayerTimes).catch(() => {})

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
