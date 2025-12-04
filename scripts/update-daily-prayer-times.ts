/**
 * Script pour mettre à jour les horaires de prière quotidiens
 * À exécuter chaque jour à minuit via un cron job
 *
 * Usage: npx tsx scripts/update-daily-prayer-times.ts
 */

import { createDirectus, rest, readItems, createItem, updateItem } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_ADMIN_TOKEN

const MAWAQIT_API_URL = process.env.MAWAQIT_API_URL || 'https://mawaqit.elghoudi.net/api/v1'
const MASJID_ID = process.env.masjid_id || 'mosque-madretsch-biel-bienne'

interface PrayerTimesData {
  id?: number
  date: string
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  updated_at: string
}

async function fetchMawaqitPrayerTimes(): Promise<{
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}> {
  const url = `${MAWAQIT_API_URL}/${MASJID_ID}`
  console.log(`[Mawaqit] Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mosquee-App/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Mawaqit API error: ${response.status}`)
  }

  const data = await response.json()

  // Les horaires sont dans data.times (tableau de 6 valeurs)
  const times = data.times || []

  return {
    Fajr: times[0] || '06:00',
    Sunrise: times[1] || '07:30',
    Dhuhr: times[2] || '13:00',
    Asr: times[3] || '16:00',
    Maghrib: times[4] || '19:00',
    Isha: times[5] || '21:00',
  }
}

async function main() {
  console.log('=== Mise à jour des horaires de prière quotidiens ===')
  console.log(`Date: ${new Date().toISOString()}`)

  if (!DIRECTUS_TOKEN) {
    console.error('DIRECTUS_TOKEN non défini')
    process.exit(1)
  }

  const client = createDirectus(DIRECTUS_URL).with(rest())

  try {
    // 1. Récupérer les horaires de Mawaqit
    console.log('\n1. Récupération des horaires Mawaqit...')
    const prayerTimes = await fetchMawaqitPrayerTimes()
    console.log('   Horaires récupérés:', prayerTimes)

    // 2. Date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    console.log(`\n2. Date du jour: ${today}`)

    // 3. Vérifier si les horaires du jour existent déjà
    console.log('\n3. Vérification des horaires existants...')

    let existingRecord: PrayerTimesData | null = null
    try {
      const existing = await client.request(
        readItems('daily_prayer_times' as any, {
          filter: { date: { _eq: today } },
          limit: 1,
        })
      ) as PrayerTimesData[]

      if (existing && existing.length > 0) {
        existingRecord = existing[0]
        console.log(`   Enregistrement existant trouvé (ID: ${existingRecord.id})`)
      }
    } catch (error: any) {
      if (error.message?.includes('Collection') || error.message?.includes('not found')) {
        console.log('   Collection daily_prayer_times non trouvée - elle doit être créée dans Directus')
        console.log('\n   Pour créer la collection dans Directus:')
        console.log('   1. Aller sur http://localhost:8055/admin/settings/data-model')
        console.log('   2. Créer une collection "daily_prayer_times" avec les champs:')
        console.log('      - date (date, unique)')
        console.log('      - fajr (string)')
        console.log('      - sunrise (string)')
        console.log('      - dhuhr (string)')
        console.log('      - asr (string)')
        console.log('      - maghrib (string)')
        console.log('      - isha (string)')
        console.log('      - updated_at (datetime)')
        process.exit(1)
      }
      throw error
    }

    // 4. Créer ou mettre à jour l'enregistrement
    const prayerData: Omit<PrayerTimesData, 'id'> = {
      date: today,
      fajr: prayerTimes.Fajr,
      sunrise: prayerTimes.Sunrise,
      dhuhr: prayerTimes.Dhuhr,
      asr: prayerTimes.Asr,
      maghrib: prayerTimes.Maghrib,
      isha: prayerTimes.Isha,
      updated_at: new Date().toISOString(),
    }

    if (existingRecord) {
      console.log('\n4. Mise à jour des horaires...')
      await client.request(
        updateItem('daily_prayer_times' as any, existingRecord.id!, prayerData)
      )
      console.log('   Horaires mis à jour avec succès!')
    } else {
      console.log('\n4. Création des horaires du jour...')
      await client.request(
        createItem('daily_prayer_times' as any, prayerData)
      )
      console.log('   Horaires créés avec succès!')
    }

    console.log('\n=== Terminé ===')
    console.log('Horaires stockés:')
    console.log(`  Fajr:    ${prayerData.fajr}`)
    console.log(`  Sunrise: ${prayerData.sunrise}`)
    console.log(`  Dhuhr:   ${prayerData.dhuhr}`)
    console.log(`  Asr:     ${prayerData.asr}`)
    console.log(`  Maghrib: ${prayerData.maghrib}`)
    console.log(`  Isha:    ${prayerData.isha}`)

  } catch (error) {
    console.error('\nErreur:', error)
    process.exit(1)
  }
}

main()
