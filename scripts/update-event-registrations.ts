import { prisma } from '../lib/prisma'
import { getEventById } from '../lib/directus'

/**
 * Script pour mettre à jour les inscriptions existantes avec les données d'événements manquantes
 *
 * Ce script remplit les champs eventDate, eventLocation et numberOfParticipants
 * pour les inscriptions qui n'ont pas ces informations.
 *
 * Usage: npx tsx scripts/update-event-registrations.ts
 */

async function updateExistingRegistrations() {
  console.log('🔄 Mise à jour des inscriptions existantes aux événements\n')
  console.log('='.repeat(80))

  try {
    // Récupérer toutes les inscriptions
    const registrations = await prisma.eventRegistration.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\n📊 Trouvé ${registrations.length} inscription(s) au total\n`)

    let updated = 0
    let failed = 0
    let skipped = 0

    for (const registration of registrations) {
      // Vérifier si les données sont déjà présentes
      if (registration.eventDate && registration.eventLocation) {
        console.log(`⏭️  ${registration.eventTitle} - Déjà à jour`)
        skipped++
        continue
      }

      try {
        console.log(`\n📝 Traitement: ${registration.eventTitle} (ID: ${registration.eventId})`)

        // Récupérer les infos de l'événement depuis Directus
        const event = await getEventById(registration.eventId)

        if (!event) {
          console.log(`   ⚠️  Événement non trouvé dans Directus`)
          failed++
          continue
        }

        // Mettre à jour l'inscription
        await prisma.eventRegistration.update({
          where: { id: registration.id },
          data: {
            eventDate: event.date ? new Date(event.date) : null,
            eventLocation: event.location || null,
            numberOfParticipants: registration.attendees || 1
          }
        })

        console.log(`   ✅ Mise à jour réussie`)
        console.log(`      Date: ${event.date || 'N/A'}`)
        console.log(`      Lieu: ${event.location || 'N/A'}`)
        console.log(`      Participants: ${registration.attendees || 1}`)

        updated++

        // Pause pour ne pas surcharger Directus
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error: any) {
        console.error(`   ❌ Erreur:`, error.message)
        failed++
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(80))
    console.log(`✅ Mises à jour réussies : ${updated}`)
    console.log(`⏭️  Déjà à jour          : ${skipped}`)
    console.log(`❌ Échecs               : ${failed}`)
    console.log(`📊 Total                : ${registrations.length}`)

    if (updated > 0) {
      console.log('\n🎉 Mise à jour terminée avec succès !')
      console.log('💡 Vous pouvez maintenant vérifier /membre/evenements')
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateExistingRegistrations()
