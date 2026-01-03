/**
 * Script de simulation CRUD complète du site
 * Teste toutes les opérations principales
 */

import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

const BASE_URL = 'http://localhost:3000'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  details: string
}

const results: TestResult[] = []

function log(test: string, status: 'PASS' | 'FAIL' | 'SKIP', details: string) {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${emoji} ${test}: ${details}`)
  results.push({ test, status, details })
}

async function runTests() {
  console.log('\n🚀 Démarrage de la simulation CRUD complète\n')
  console.log('='.repeat(60))

  // =========================================
  // PHASE 1: VÉRIFICATION DES DONNÉES
  // =========================================
  console.log('\n📊 PHASE 1: Vérification des données existantes\n')

  try {
    const userCount = await prisma.user.count()
    log('Comptage utilisateurs', 'PASS', `${userCount} utilisateur(s) en base`)

    const eventRegCount = await prisma.eventRegistration.count()
    log('Comptage inscriptions événements', 'PASS', `${eventRegCount} inscription(s)`)

    const enrollmentCount = await prisma.enrollment.count()
    log('Comptage inscriptions activités', 'PASS', `${enrollmentCount} inscription(s)`)

    const childCount = await prisma.child.count()
    log('Comptage enfants', 'PASS', `${childCount} enfant(s)`)

    const donationCount = await prisma.donation.count()
    log('Comptage dons', 'PASS', `${donationCount} don(s)`)
  } catch (error: any) {
    log('Vérification données', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 2: CRÉATION UTILISATEUR DE TEST
  // =========================================
  console.log('\n👤 PHASE 2: Création utilisateur de test\n')

  const testEmail = 'test-crud@mosquee.ch'
  const testPassword = 'TestPassword123!'
  let testUserId = ''

  try {
    // Supprimer l'utilisateur de test s'il existe
    await prisma.user.deleteMany({ where: { email: testEmail } })

    // Créer l'utilisateur de test (sans emailVerified - pas dans le schéma)
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'CRUD',
        role: 'ADMIN',
      },
    })
    testUserId = testUser.id
    log('CREATE User', 'PASS', `Utilisateur créé: ${testUser.email} (ID: ${testUser.id})`)
  } catch (error: any) {
    log('CREATE User', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 3: CRUD ENFANTS
  // =========================================
  console.log('\n👶 PHASE 3: CRUD Enfants\n')

  let testChildId = ''

  try {
    // CREATE (birthDate au lieu de dateOfBirth)
    const child = await prisma.child.create({
      data: {
        firstName: 'Petit',
        lastName: 'Test',
        birthDate: new Date('2015-05-15'),
        gender: 'MALE',
        parentId: testUserId,
      },
    })
    testChildId = child.id
    log('CREATE Child', 'PASS', `Enfant créé: ${child.firstName} ${child.lastName}`)

    // READ
    const readChild = await prisma.child.findUnique({ where: { id: testChildId } })
    log('READ Child', readChild ? 'PASS' : 'FAIL', readChild ? `Trouvé: ${readChild.firstName}` : 'Non trouvé')

    // UPDATE
    const updatedChild = await prisma.child.update({
      where: { id: testChildId },
      data: { firstName: 'Petit-Modifié' },
    })
    log('UPDATE Child', 'PASS', `Modifié: ${updatedChild.firstName}`)

    // DELETE
    await prisma.child.delete({ where: { id: testChildId } })
    const deletedChild = await prisma.child.findUnique({ where: { id: testChildId } })
    log('DELETE Child', deletedChild ? 'FAIL' : 'PASS', deletedChild ? 'Non supprimé' : 'Supprimé avec succès')
  } catch (error: any) {
    log('CRUD Child', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 4: CRUD INSCRIPTIONS ÉVÉNEMENTS
  // =========================================
  console.log('\n🎫 PHASE 4: CRUD Inscriptions Événements\n')

  let testRegistrationId = ''

  try {
    // CREATE (ajout eventTitle obligatoire)
    const registration = await prisma.eventRegistration.create({
      data: {
        eventTitle: 'Test Événement CRUD',
        userId: testUserId,
        firstName: 'Test',
        lastName: 'Inscription',
        email: testEmail,
        phone: '+41791234567',
        participationType: 'INDIVIDUAL',
        numberOfAdults: 1,
        numberOfChildren: 0,
        status: 'PENDING',
      },
    })
    testRegistrationId = registration.id
    log('CREATE EventRegistration', 'PASS', `Inscription créée (ID: ${registration.id})`)

    // READ
    const readReg = await prisma.eventRegistration.findUnique({ where: { id: testRegistrationId } })
    log('READ EventRegistration', readReg ? 'PASS' : 'FAIL', readReg ? `Status: ${readReg.status}` : 'Non trouvée')

    // UPDATE
    const updatedReg = await prisma.eventRegistration.update({
      where: { id: testRegistrationId },
      data: { status: 'CONFIRMED' },
    })
    log('UPDATE EventRegistration', 'PASS', `Status modifié: ${updatedReg.status}`)

    // DELETE
    await prisma.eventRegistration.delete({ where: { id: testRegistrationId } })
    const deletedReg = await prisma.eventRegistration.findUnique({ where: { id: testRegistrationId } })
    log('DELETE EventRegistration', deletedReg ? 'FAIL' : 'PASS', deletedReg ? 'Non supprimée' : 'Supprimée')
  } catch (error: any) {
    log('CRUD EventRegistration', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 5: CRUD INSCRIPTIONS ACTIVITÉS
  // =========================================
  console.log('\n📚 PHASE 5: CRUD Inscriptions Activités\n')

  let testEnrollmentId = ''

  try {
    // CREATE (ajout activityTitle obligatoire)
    const enrollment = await prisma.enrollment.create({
      data: {
        activityTitle: 'Test Activité CRUD',
        userId: testUserId,
        status: 'PENDING',
      },
    })
    testEnrollmentId = enrollment.id
    log('CREATE Enrollment', 'PASS', `Inscription activité créée (ID: ${enrollment.id})`)

    // READ
    const readEnr = await prisma.enrollment.findUnique({ where: { id: testEnrollmentId } })
    log('READ Enrollment', readEnr ? 'PASS' : 'FAIL', readEnr ? `Status: ${readEnr.status}` : 'Non trouvée')

    // UPDATE
    const updatedEnr = await prisma.enrollment.update({
      where: { id: testEnrollmentId },
      data: { status: 'ACTIVE' },
    })
    log('UPDATE Enrollment', 'PASS', `Status modifié: ${updatedEnr.status}`)

    // DELETE
    await prisma.enrollment.delete({ where: { id: testEnrollmentId } })
    const deletedEnr = await prisma.enrollment.findUnique({ where: { id: testEnrollmentId } })
    log('DELETE Enrollment', deletedEnr ? 'FAIL' : 'PASS', deletedEnr ? 'Non supprimée' : 'Supprimée')
  } catch (error: any) {
    log('CRUD Enrollment', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 6: CRUD DONS
  // =========================================
  console.log('\n💰 PHASE 6: CRUD Dons\n')

  let testDonationId = ''

  try {
    // CREATE (champs requis: firstName, lastName, email, amount, type)
    const donation = await prisma.donation.create({
      data: {
        firstName: 'Test',
        lastName: 'Donateur',
        email: testEmail,
        amount: 50,
        type: 'SADAQA',
        userId: testUserId,
      },
    })
    testDonationId = donation.id
    log('CREATE Donation', 'PASS', `Don créé: ${donation.amount} CHF`)

    // READ
    const readDon = await prisma.donation.findUnique({ where: { id: testDonationId } })
    log('READ Donation', readDon ? 'PASS' : 'FAIL', readDon ? `Montant: ${readDon.amount}` : 'Non trouvé')

    // UPDATE
    const updatedDon = await prisma.donation.update({
      where: { id: testDonationId },
      data: { amount: 100 },
    })
    log('UPDATE Donation', 'PASS', `Montant modifié: ${updatedDon.amount}`)

    // DELETE
    await prisma.donation.delete({ where: { id: testDonationId } })
    const deletedDon = await prisma.donation.findUnique({ where: { id: testDonationId } })
    log('DELETE Donation', deletedDon ? 'FAIL' : 'PASS', deletedDon ? 'Non supprimé' : 'Supprimé')
  } catch (error: any) {
    log('CRUD Donation', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 7: CRUD NOTIFICATIONS
  // =========================================
  console.log('\n🔔 PHASE 7: CRUD Notifications\n')

  let testNotificationId = ''

  try {
    // CREATE
    const notification = await prisma.notification.create({
      data: {
        userId: testUserId,
        type: 'SYSTEM',
        title: 'Test Notification',
        message: 'Ceci est une notification de test',
        read: false,
      },
    })
    testNotificationId = notification.id
    log('CREATE Notification', 'PASS', `Notification créée: ${notification.title}`)

    // READ
    const readNotif = await prisma.notification.findUnique({ where: { id: testNotificationId } })
    log('READ Notification', readNotif ? 'PASS' : 'FAIL', readNotif ? `Titre: ${readNotif.title}` : 'Non trouvée')

    // UPDATE
    const updatedNotif = await prisma.notification.update({
      where: { id: testNotificationId },
      data: { read: true },
    })
    log('UPDATE Notification', 'PASS', `Lu: ${updatedNotif.read}`)

    // DELETE
    await prisma.notification.delete({ where: { id: testNotificationId } })
    const deletedNotif = await prisma.notification.findUnique({ where: { id: testNotificationId } })
    log('DELETE Notification', deletedNotif ? 'FAIL' : 'PASS', deletedNotif ? 'Non supprimée' : 'Supprimée')
  } catch (error: any) {
    log('CRUD Notification', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 8: CRUD ADHÉSIONS
  // =========================================
  console.log('\n📋 PHASE 8: CRUD Adhésions\n')

  let testMembershipId = ''

  try {
    // CREATE (ajout endDate obligatoire, type ACTIF ou PASSIF)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1)

    const membership = await prisma.membership.create({
      data: {
        userId: testUserId,
        type: 'ACTIF',
        status: 'PENDING',
        startDate: startDate,
        endDate: endDate,
        amount: 100,
      },
    })
    testMembershipId = membership.id
    log('CREATE Membership', 'PASS', `Adhésion créée: ${membership.type}`)

    // READ
    const readMem = await prisma.membership.findUnique({ where: { id: testMembershipId } })
    log('READ Membership', readMem ? 'PASS' : 'FAIL', readMem ? `Type: ${readMem.type}` : 'Non trouvée')

    // UPDATE
    const updatedMem = await prisma.membership.update({
      where: { id: testMembershipId },
      data: { status: 'ACTIVE' },
    })
    log('UPDATE Membership', 'PASS', `Status: ${updatedMem.status}`)

    // DELETE
    await prisma.membership.delete({ where: { id: testMembershipId } })
    const deletedMem = await prisma.membership.findUnique({ where: { id: testMembershipId } })
    log('DELETE Membership', deletedMem ? 'FAIL' : 'PASS', deletedMem ? 'Non supprimée' : 'Supprimée')
  } catch (error: any) {
    log('CRUD Membership', 'FAIL', error.message)
  }

  // =========================================
  // PHASE 9: TEST APIS PUBLIQUES
  // =========================================
  console.log('\n🌐 PHASE 9: Test APIs Publiques\n')

  const publicApis = [
    '/api/prayer-times',
    '/api/events',
    '/api/activities',
    '/api/projects',
  ]

  for (const api of publicApis) {
    try {
      const res = await fetch(`${BASE_URL}${api}`)
      log(`GET ${api}`, res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}`)
    } catch (error: any) {
      log(`GET ${api}`, 'FAIL', error.message)
    }
  }

  // =========================================
  // PHASE 10: TEST PAGES PUBLIQUES
  // =========================================
  console.log('\n📄 PHASE 10: Test Pages Publiques\n')

  const publicPages = [
    '/',
    '/horaires',
    '/evenements',
    '/activites',
    '/dons',
    '/contact',
    '/inscription',
    '/connexion',
  ]

  for (const page of publicPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`)
      log(`GET ${page}`, res.ok ? 'PASS' : 'FAIL', `HTTP ${res.status}`)
    } catch (error: any) {
      log(`GET ${page}`, 'FAIL', error.message)
    }
  }

  // =========================================
  // NETTOYAGE
  // =========================================
  console.log('\n🧹 Nettoyage\n')

  try {
    // Supprimer l'utilisateur de test (cascade les données liées)
    await prisma.user.deleteMany({ where: { email: testEmail } })
    log('Nettoyage', 'PASS', 'Utilisateur de test supprimé')
  } catch (error: any) {
    log('Nettoyage', 'FAIL', error.message)
  }

  // =========================================
  // RAPPORT FINAL
  // =========================================
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 RAPPORT FINAL DE SIMULATION CRUD\n')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length
  const total = results.length

  console.log(`\nTotal des tests: ${total}`)
  console.log(`✅ Réussis: ${passed}`)
  console.log(`❌ Échoués: ${failed}`)
  console.log(`⏭️ Ignorés: ${skipped}`)
  console.log(`\nTaux de réussite: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n⚠️ Tests échoués:')
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`   - ${r.test}: ${r.details}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Simulation terminée')
  console.log('='.repeat(60) + '\n')

  await prisma.$disconnect()
}

runTests().catch(console.error)
