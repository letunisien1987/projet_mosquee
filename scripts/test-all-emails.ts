import { config } from 'dotenv'
import {
  sendWelcomeEmail,
  sendEnrollmentConfirmationEmail,
  sendEventRegistrationEmail,
  sendDonationConfirmationEmail,
  sendNotificationEmail,
} from '../lib/email'

// Charger les variables d'environnement
config()

/**
 * Script de test complet pour tous les types d'emails
 *
 * Usage: npx tsx scripts/test-all-emails.ts
 */

async function testAllEmails() {
  console.log('🧪 TEST COMPLET DES NOTIFICATIONS PAR EMAIL\n')
  console.log('='.repeat(60))

  // Email de test - doit correspondre au compte Resend
  const testEmail = 'ahmedelghoudi@gmail.com'
  const firstName = 'Ahmed'

  let successCount = 0
  let failCount = 0

  // ========================================
  // TEST 1: Email de bienvenue
  // ========================================
  console.log('\n📧 TEST 1: Email de bienvenue')
  console.log('-'.repeat(60))
  try {
    const result = await sendWelcomeEmail(testEmail, firstName)
    if (result.success && result.data?.id) {
      console.log('✅ SUCCÈS - Email de bienvenue envoyé')
      console.log(`   ID: ${result.data.id}`)
      successCount++
    } else {
      console.log('❌ ÉCHEC - Email de bienvenue')
      console.log('   Erreur:', result.error)
      failCount++
    }
  } catch (error) {
    console.log('❌ ERREUR:', error)
    failCount++
  }

  // Pause de 2 secondes entre chaque email
  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================
  // TEST 2: Confirmation d'inscription (PENDING)
  // ========================================
  console.log('\n📧 TEST 2: Confirmation d\'inscription - PENDING')
  console.log('-'.repeat(60))
  try {
    const result = await sendEnrollmentConfirmationEmail(
      testEmail,
      firstName,
      'Cours d\'Arabe - Niveau Débutant',
      'PENDING'
    )
    if (result.success && result.data?.id) {
      console.log('✅ SUCCÈS - Confirmation d\'inscription (en attente)')
      console.log(`   ID: ${result.data.id}`)
      successCount++
    } else {
      console.log('❌ ÉCHEC - Confirmation d\'inscription (en attente)')
      console.log('   Erreur:', result.error)
      failCount++
    }
  } catch (error) {
    console.log('❌ ERREUR:', error)
    failCount++
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================
  // TEST 3: Confirmation d'inscription (ACTIVE)
  // ========================================
  console.log('\n📧 TEST 3: Confirmation d\'inscription - ACTIVE')
  console.log('-'.repeat(60))
  try {
    const result = await sendEnrollmentConfirmationEmail(
      testEmail,
      firstName,
      'Tajweed - Perfectionnement',
      'ACTIVE'
    )
    if (result.success && result.data?.id) {
      console.log('✅ SUCCÈS - Confirmation d\'inscription (active)')
      console.log(`   ID: ${result.data.id}`)
      successCount++
    } else {
      console.log('❌ ÉCHEC - Confirmation d\'inscription (active)')
      console.log('   Erreur:', result.error)
      failCount++
    }
  } catch (error) {
    console.log('❌ ERREUR:', error)
    failCount++
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================
  // TEST 4: Confirmation d'événement
  // ========================================
  console.log('\n📧 TEST 4: Confirmation d\'événement')
  console.log('-'.repeat(60))
  try {
    const eventDate = 'vendredi 15 décembre 2025 à 20:00'
    const result = await sendEventRegistrationEmail(
      testEmail,
      firstName,
      'Conférence - Les Piliers de l\'Islam',
      eventDate
    )
    if (result.success && result.data?.id) {
      console.log('✅ SUCCÈS - Confirmation d\'événement')
      console.log(`   ID: ${result.data.id}`)
      successCount++
    } else {
      console.log('❌ ÉCHEC - Confirmation d\'événement')
      console.log('   Erreur:', result.error)
      failCount++
    }
  } catch (error) {
    console.log('❌ ERREUR:', error)
    failCount++
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================
  // TEST 5: Confirmation de don
  // ========================================
  console.log('\n📧 TEST 5: Confirmation de don')
  console.log('-'.repeat(60))
  try {
    const result = await sendDonationConfirmationEmail(
      testEmail,
      firstName,
      50.00,
      'Rénovation de la mosquée'
    )
    if (result.success && result.data?.id) {
      console.log('✅ SUCCÈS - Confirmation de don')
      console.log(`   ID: ${result.data.id}`)
      successCount++
    } else {
      console.log('❌ ÉCHEC - Confirmation de don')
      console.log('   Erreur:', result.error)
      failCount++
    }
  } catch (error) {
    console.log('❌ ERREUR:', error)
    failCount++
  }

  await new Promise(resolve => setTimeout(resolve, 2000))

  // ========================================
  // TEST 6: Notification générique
  // ========================================
  console.log('\n📧 TEST 6: Notification générique')
  console.log('-'.repeat(60))
  try {
    const result = await sendNotificationEmail(
      testEmail,
      firstName,
      'Horaire de prière modifié',
      'L\'horaire de la prière du Maghrib a été modifié pour aujourd\'hui en raison des conditions météorologiques. Nouvelle heure : 18:45.',
      'Voir les horaires',
      'https://mosquee-madretsch.ch/horaires'
    )
    if (result.success && result.data?.id) {
      console.log('✅ SUCCÈS - Notification générique')
      console.log(`   ID: ${result.data.id}`)
      successCount++
    } else {
      console.log('❌ ÉCHEC - Notification générique')
      console.log('   Erreur:', result.error)
      failCount++
    }
  } catch (error) {
    console.log('❌ ERREUR:', error)
    failCount++
  }

  // ========================================
  // RÉSUMÉ
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS')
  console.log('='.repeat(60))
  console.log(`✅ Réussis: ${successCount}/6`)
  console.log(`❌ Échoués: ${failCount}/6`)

  if (failCount === 0) {
    console.log('\n🎉 PARFAIT ! Tous les emails ont été envoyés avec succès !')
  } else {
    console.log(`\n⚠️  ${failCount} email(s) ont échoué. Vérifiez les erreurs ci-dessus.`)
  }

  console.log('\n💡 Vérifiez votre boîte de réception : ' + testEmail)
  console.log('📧 Vous devriez avoir reçu 6 emails différents')
  console.log('🔗 Dashboard Resend : https://resend.com/emails')
  console.log('\n' + '='.repeat(60))
}

testAllEmails()
