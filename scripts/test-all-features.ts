import { prisma } from '../lib/prisma'
import { sendWelcomeEmail, sendEventRegistrationEmail, sendEventCancellationEmail, sendEnrollmentConfirmationEmail, sendDonationThankYouEmail, sendServiceRequestConfirmationEmail, sendContactMessageConfirmationEmail } from '../lib/email'

/**
 * Script de test complet de TOUTES les fonctionnalités
 *
 * Usage: npx tsx scripts/test-all-features.ts
 */

const TEST_EMAIL = 'ahmedelghoudi@gmail.com'
const TEST_NAME = 'Ahmed El Ghoudi'

async function testAllFeatures() {
  console.log('🧪 TEST COMPLET DE TOUTES LES FONCTIONNALITÉS\n')
  console.log('='.repeat(80))
  console.log(`📧 Email de test: ${TEST_EMAIL}\n`)

  const results = {
    success: [] as string[],
    errors: [] as string[]
  }

  try {
    // 1. TEST EMAIL DE BIENVENUE
    console.log('\n📝 TEST 1: Email de bienvenue')
    console.log('-'.repeat(80))
    try {
      await sendWelcomeEmail(TEST_EMAIL, 'Ahmed')
      console.log('✅ Email de bienvenue envoyé')
      results.success.push('Email de bienvenue')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Email de bienvenue')
    }

    // 2. TEST INSCRIPTION ÉVÉNEMENT + EMAIL
    console.log('\n📅 TEST 2: Inscription à un événement')
    console.log('-'.repeat(80))
    try {
      const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } })
      if (!user) {
        throw new Error('Utilisateur non trouvé')
      }

      const eventReg = await prisma.eventRegistration.create({
        data: {
          userId: user.id,
          eventId: 'test-event-' + Date.now(),
          eventTitle: 'TEST: Conférence du ' + new Date().toLocaleDateString('fr-FR'),
          firstName: 'Ahmed',
          lastName: 'El Ghoudi',
          email: TEST_EMAIL,
          phone: '+41 79 123 45 67',
          attendees: 2,
          status: 'CONFIRMED',
          notes: 'Test automatique'
        }
      })
      console.log('✅ Inscription événement créée (ID:', eventReg.id + ')')

      await sendEventRegistrationEmail(
        TEST_EMAIL,
        'Ahmed',
        eventReg.eventTitle,
        new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      )
      console.log('✅ Email de confirmation événement envoyé')
      results.success.push('Inscription événement + email')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Inscription événement')
    }

    // 3. TEST ANNULATION ÉVÉNEMENT + EMAIL
    console.log('\n🚫 TEST 3: Annulation d\'inscription événement')
    console.log('-'.repeat(80))
    try {
      const eventReg = await prisma.eventRegistration.findFirst({
        where: {
          email: TEST_EMAIL,
          status: 'CONFIRMED'
        }
      })

      if (eventReg) {
        await prisma.eventRegistration.update({
          where: { id: eventReg.id },
          data: { status: 'CANCELLED' }
        })
        console.log('✅ Inscription annulée (ID:', eventReg.id + ')')

        await sendEventCancellationEmail(
          TEST_EMAIL,
          'Ahmed',
          eventReg.eventTitle
        )
        console.log('✅ Email d\'annulation envoyé')
        results.success.push('Annulation événement + email')
      } else {
        console.log('⚠️  Pas d\'inscription à annuler')
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Annulation événement')
    }

    // 4. TEST INSCRIPTION ACTIVITÉ + EMAIL
    console.log('\n📚 TEST 4: Inscription à une activité')
    console.log('-'.repeat(80))
    try {
      const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } })
      if (!user) throw new Error('Utilisateur non trouvé')

      // Créer un enfant si nécessaire
      let child = await prisma.child.findFirst({ where: { parentId: user.id } })
      if (!child) {
        child = await prisma.child.create({
          data: {
            parentId: user.id,
            firstName: 'Youssef',
            lastName: 'El Ghoudi',
            birthDate: new Date('2015-03-15')
          }
        })
        console.log('   Enfant créé:', child.firstName)
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: user.id,
          childId: child.id,
          activityIdOld: 'test-activity-' + Date.now(),
          activityTitle: 'TEST: Cours d\'Arabe - ' + new Date().toLocaleDateString('fr-FR'),
          status: 'APPROVED',
          notes: 'Test automatique'
        }
      })
      console.log('✅ Inscription activité créée (ID:', enrollment.id + ')')

      await sendEnrollmentConfirmationEmail(
        TEST_EMAIL,
        'Ahmed',
        enrollment.activityTitle,
        'APPROVED'
      )
      console.log('✅ Email de confirmation activité envoyé')
      results.success.push('Inscription activité + email')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Inscription activité')
    }

    // 5. TEST DON + EMAIL
    console.log('\n💰 TEST 5: Don')
    console.log('-'.repeat(80))
    try {
      const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } })
      if (!user) throw new Error('Utilisateur non trouvé')

      const donation = await prisma.donation.create({
        data: {
          userId: user.id,
          firstName: 'Ahmed',
          lastName: 'El Ghoudi',
          email: TEST_EMAIL,
          phone: '+41 79 123 45 67',
          amount: 50.00,
          type: 'SADAQA',
          message: 'Test automatique - Don de ' + new Date().toLocaleDateString('fr-FR'),
          anonymous: false
        }
      })
      console.log('✅ Don créé (ID:', donation.id, '- Montant:', donation.amount, 'CHF)')

      await sendDonationThankYouEmail(
        TEST_EMAIL,
        'Ahmed',
        donation.amount,
        donation.type
      )
      console.log('✅ Email de remerciement don envoyé')
      results.success.push('Don + email')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Don')
    }

    // 6. TEST DEMANDE DE SERVICE + EMAIL
    console.log('\n🕌 TEST 6: Demande de service')
    console.log('-'.repeat(80))
    try {
      const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } })
      if (!user) throw new Error('Utilisateur non trouvé')

      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          userId: user.id,
          serviceType: 'SHAHADA',
          firstName: 'Ahmed',
          lastName: 'El Ghoudi',
          email: TEST_EMAIL,
          phone: '+41 79 123 45 67',
          details: 'Test automatique - Demande du ' + new Date().toLocaleDateString('fr-FR'),
          status: 'PENDING'
        }
      })
      console.log('✅ Demande de service créée (ID:', serviceRequest.id + ')')

      await sendServiceRequestConfirmationEmail(
        TEST_EMAIL,
        'Ahmed',
        serviceRequest.serviceType
      )
      console.log('✅ Email de confirmation service envoyé')
      results.success.push('Demande de service + email')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Demande de service')
    }

    // 7. TEST MESSAGE DE CONTACT + EMAIL
    console.log('\n📧 TEST 7: Message de contact')
    console.log('-'.repeat(80))
    try {
      const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } })
      if (!user) throw new Error('Utilisateur non trouvé')

      const contactMessage = await prisma.contactMessage.create({
        data: {
          userId: user.id,
          firstName: 'Ahmed',
          lastName: 'El Ghoudi',
          email: TEST_EMAIL,
          phone: '+41 79 123 45 67',
          subject: 'TEST: Message du ' + new Date().toLocaleDateString('fr-FR'),
          message: 'Ceci est un message de test automatique pour vérifier le système.',
          read: false
        }
      })
      console.log('✅ Message de contact créé (ID:', contactMessage.id + ')')

      await sendContactMessageConfirmationEmail(
        TEST_EMAIL,
        'Ahmed'
      )
      console.log('✅ Email de confirmation contact envoyé')
      results.success.push('Message de contact + email')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Message de contact')
    }

    // 8. VÉRIFICATION DES DONNÉES DANS L'ESPACE MEMBRE
    console.log('\n📊 TEST 8: Vérification des données dans l\'espace membre')
    console.log('-'.repeat(80))
    try {
      const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } })
      if (!user) throw new Error('Utilisateur non trouvé')

      const stats = {
        donations: await prisma.donation.count({ where: { userId: user.id } }),
        events: await prisma.eventRegistration.count({ where: { userId: user.id } }),
        enrollments: await prisma.enrollment.count({ where: { userId: user.id } }),
        memberships: await prisma.membership.count({ where: { userId: user.id } }),
        children: await prisma.child.count({ where: { parentId: user.id } }),
        serviceRequests: await prisma.serviceRequest.count({ where: { userId: user.id } }),
        contactMessages: await prisma.contactMessage.count({ where: { userId: user.id } })
      }

      console.log('✅ Statistiques de l\'utilisateur:')
      console.log(`   - Dons: ${stats.donations}`)
      console.log(`   - Événements: ${stats.events}`)
      console.log(`   - Activités: ${stats.enrollments}`)
      console.log(`   - Cotisations: ${stats.memberships}`)
      console.log(`   - Enfants: ${stats.children}`)
      console.log(`   - Demandes de service: ${stats.serviceRequests}`)
      console.log(`   - Messages de contact: ${stats.contactMessages}`)

      results.success.push('Vérification données espace membre')
    } catch (error: any) {
      console.error('❌ Erreur:', error.message)
      results.errors.push('Vérification données')
    }

    // RÉSUMÉ FINAL
    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ DES TESTS')
    console.log('='.repeat(80))
    console.log(`\n✅ RÉUSSIS (${results.success.length}):`)
    results.success.forEach(test => console.log(`   ✓ ${test}`))

    if (results.errors.length > 0) {
      console.log(`\n❌ ÉCHOUÉS (${results.errors.length}):`)
      results.errors.forEach(test => console.log(`   ✗ ${test}`))
    }

    console.log('\n' + '='.repeat(80))
    console.log('🎉 TESTS TERMINÉS')
    console.log('='.repeat(80))
    console.log(`\n📧 Vérifiez votre boîte mail: ${TEST_EMAIL}`)
    console.log(`   Vous devriez avoir reçu ${results.success.filter(s => s.includes('email')).length} emails`)
    console.log('\n🔗 Connectez-vous sur: http://localhost:3000/connexion')
    console.log(`   Email: ${TEST_EMAIL}`)
    console.log(`   Password: password123`)

  } catch (error: any) {
    console.error('\n❌ ERREUR GÉNÉRALE:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAllFeatures()
