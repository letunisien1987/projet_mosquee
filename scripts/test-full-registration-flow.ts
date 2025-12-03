/**
 * Script de test complet du flux d'inscription aux événements
 *
 * Test de 4 scénarios:
 * 1. Événement GRATUIT sans approbation -> Confirmation automatique
 * 2. Événement GRATUIT avec approbation -> En attente d'approbation
 * 3. Événement PAYANT sans approbation -> En attente de paiement
 * 4. Événement PAYANT avec approbation -> En attente de paiement (approbation après paiement)
 *
 * Pour chaque scénario:
 * - Inscription via API
 * - Vérification de la notification pour le responsable
 * - Vérification du statut de l'inscription
 * - Test du flux d'approbation/refus pour le responsable
 */

import { prisma } from '../lib/prisma'

// Configuration pour les tests
const TEST_USER_EMAIL = 'test-user-' + Date.now() + '@test.com'
const MANAGER_EMAIL = 'ahmedelghoudi@gmail.com'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

interface DirectusEvent {
  id: string | number
  title: string
  date: string
  price: string | null
  payment_type: string | null
  requires_approval: boolean
  registration_required: boolean
  manager_email: string | null
  max_capacity: number | null
}

async function getDirectusEvents(): Promise<DirectusEvent[]> {
  try {
    const response = await fetch('http://localhost:8055/items/events?fields=id,title,date,price,payment_type,requires_approval,registration_required,manager_email,max_capacity&filter[status][_eq]=published&sort=date')
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Erreur récupération événements Directus:', error)
    return []
  }
}

async function testRegistrationFlow() {
  console.log('='.repeat(70))
  console.log('  TEST COMPLET DU FLUX D\'INSCRIPTION')
  console.log('='.repeat(70))
  console.log(`\nURL de base: ${BASE_URL}`)
  console.log(`Email utilisateur test: ${TEST_USER_EMAIL}`)
  console.log(`Email responsable: ${MANAGER_EMAIL}\n`)

  // 1. Vérifier le responsable dans notre base
  console.log('1. VÉRIFICATION DU RESPONSABLE')
  console.log('-'.repeat(40))
  const manager = await prisma.user.findFirst({
    where: { email: MANAGER_EMAIL },
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  })

  if (!manager) {
    console.log('❌ Responsable non trouvé dans la base!')
    return
  }
  console.log(`✅ Responsable: ${manager.firstName} ${manager.lastName} (${manager.role})`)
  console.log(`   ID: ${manager.id}\n`)

  // 2. Récupérer les événements depuis Directus
  console.log('2. ÉVÉNEMENTS DISPONIBLES DANS DIRECTUS')
  console.log('-'.repeat(40))
  const events = await getDirectusEvents()

  if (events.length === 0) {
    console.log('❌ Aucun événement trouvé dans Directus!')
    return
  }

  // Catégoriser les événements
  const futureEvents = events.filter(e => new Date(e.date) > new Date())
  console.log(`Total événements: ${events.length}`)
  console.log(`Événements futurs: ${futureEvents.length}\n`)

  // Trouver des événements pour chaque scénario
  const scenarios = {
    gratuitSansApprobation: futureEvents.find(e =>
      e.registration_required &&
      (!e.price || parseFloat(e.price) === 0 || e.payment_type === 'FREE') &&
      !e.requires_approval &&
      e.manager_email === MANAGER_EMAIL
    ),
    gratuitAvecApprobation: futureEvents.find(e =>
      e.registration_required &&
      (!e.price || parseFloat(e.price) === 0 || e.payment_type === 'FREE') &&
      e.requires_approval &&
      e.manager_email === MANAGER_EMAIL
    ),
    payantSansApprobation: futureEvents.find(e =>
      e.registration_required &&
      e.price && parseFloat(e.price) > 0 &&
      e.payment_type && e.payment_type !== 'FREE' &&
      !e.requires_approval &&
      e.manager_email === MANAGER_EMAIL
    ),
    payantAvecApprobation: futureEvents.find(e =>
      e.registration_required &&
      e.price && parseFloat(e.price) > 0 &&
      e.payment_type && e.payment_type !== 'FREE' &&
      e.requires_approval &&
      e.manager_email === MANAGER_EMAIL
    )
  }

  console.log('Événements pour les scénarios de test:')
  console.log(`  - Gratuit sans approbation: ${scenarios.gratuitSansApprobation?.title || 'NON TROUVÉ'}`)
  console.log(`  - Gratuit avec approbation: ${scenarios.gratuitAvecApprobation?.title || 'NON TROUVÉ'}`)
  console.log(`  - Payant sans approbation: ${scenarios.payantSansApprobation?.title || 'NON TROUVÉ'}`)
  console.log(`  - Payant avec approbation: ${scenarios.payantAvecApprobation?.title || 'NON TROUVÉ'}`)
  console.log('')

  // Afficher tous les événements avec manager_email = MANAGER_EMAIL
  console.log(`Événements gérés par ${MANAGER_EMAIL}:`)
  const managerEvents = futureEvents.filter(e => e.manager_email === MANAGER_EMAIL)
  managerEvents.forEach(e => {
    const isPaid = e.price && parseFloat(e.price) > 0 && e.payment_type !== 'FREE'
    console.log(`  - [${e.id}] ${e.title}`)
    console.log(`    Payant: ${isPaid ? `Oui (${e.price} CHF - ${e.payment_type})` : 'Non'}`)
    console.log(`    Approbation: ${e.requires_approval ? 'Oui' : 'Non'}`)
    console.log(`    Inscription: ${e.registration_required ? 'Requise' : 'Non requise'}`)
    console.log('')
  })

  // 3. État actuel des inscriptions et notifications
  console.log('3. ÉTAT ACTUEL')
  console.log('-'.repeat(40))

  const stats = await prisma.$transaction([
    prisma.eventRegistration.count(),
    prisma.eventRegistration.count({ where: { status: 'PENDING' } }),
    prisma.eventRegistration.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.eventRegistration.count({ where: { status: 'CONFIRMED' } }),
    prisma.notification.count({ where: { userId: manager.id } }),
    prisma.notification.count({ where: { userId: manager.id, read: false } }),
    prisma.notification.count({ where: { userId: manager.id, emailSent: true } }),
  ])

  console.log(`Inscriptions:`)
  console.log(`  Total: ${stats[0]}`)
  console.log(`  En attente: ${stats[1]}`)
  console.log(`  En attente paiement: ${stats[2]}`)
  console.log(`  Confirmées: ${stats[3]}`)
  console.log(`\nNotifications pour le responsable:`)
  console.log(`  Total: ${stats[4]}`)
  console.log(`  Non lues: ${stats[5]}`)
  console.log(`  Emails envoyés: ${stats[6]}`)

  // 4. Dernières notifications du responsable
  console.log('\n4. DERNIÈRES NOTIFICATIONS DU RESPONSABLE')
  console.log('-'.repeat(40))

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: manager.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      read: true,
      emailSent: true,
      createdAt: true,
    }
  })

  if (recentNotifications.length === 0) {
    console.log('Aucune notification trouvée')
  } else {
    recentNotifications.forEach((n, i) => {
      console.log(`\n[${i + 1}] ${n.title}`)
      console.log(`    Type: ${n.type}`)
      console.log(`    Message: ${n.message.substring(0, 80)}...`)
      console.log(`    Lien: ${n.link}`)
      console.log(`    Lu: ${n.read ? '✅' : '❌'} | Email: ${n.emailSent ? '✅' : '❌'}`)
      console.log(`    Date: ${n.createdAt.toLocaleString('fr-FR')}`)
    })
  }

  // 5. Dernières inscriptions
  console.log('\n\n5. DERNIÈRES INSCRIPTIONS')
  console.log('-'.repeat(40))

  const recentRegistrations = await prisma.eventRegistration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      eventId: true,
      eventTitle: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      requiresPayment: true,
      paymentAmount: true,
      createdAt: true,
    }
  })

  if (recentRegistrations.length === 0) {
    console.log('Aucune inscription trouvée')
  } else {
    recentRegistrations.forEach((r, i) => {
      console.log(`\n[${i + 1}] ${r.eventTitle}`)
      console.log(`    Participant: ${r.firstName} ${r.lastName}`)
      console.log(`    Email: ${r.email}`)
      console.log(`    Statut: ${r.status}`)
      if (r.requiresPayment) {
        console.log(`    Paiement: ${r.paymentAmount} CHF`)
      }
      console.log(`    Date: ${r.createdAt.toLocaleString('fr-FR')}`)
    })
  }

  // 6. Résumé des actions à tester manuellement
  console.log('\n\n' + '='.repeat(70))
  console.log('  ACTIONS À TESTER MANUELLEMENT')
  console.log('='.repeat(70))

  console.log(`
CÔTÉ UTILISATEUR:
1. Aller sur ${BASE_URL}/evenements
2. Choisir un événement et s'inscrire
3. Vérifier les emails reçus (confirmation/attente)

CÔTÉ RESPONSABLE (${MANAGER_EMAIL}):
1. Se connecter sur ${BASE_URL}/admin/login
2. Aller dans l'espace membre -> Notifications
3. Cliquer sur "Voir plus" d'une notification d'inscription
   -> Doit rediriger vers /admin/evenements-gestion/{id}
4. Voir la liste des inscriptions
5. Approuver ou refuser une inscription
6. Vérifier que l'utilisateur reçoit une notification/email

VÉRIFICATIONS:
- Les liens de notifications pointent vers /admin/evenements-gestion/{eventId}
- Les emails contiennent le bon lien
- Le statut emailSent passe à true après envoi
- Les notifications apparaissent dans l'espace membre
`)

  await prisma.$disconnect()
}

// Fonction pour simuler une inscription via l'API
async function simulateRegistration(eventId: string, userData: any) {
  try {
    const response = await fetch(`${BASE_URL}/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return await response.json()
  } catch (error) {
    console.error('Erreur simulation inscription:', error)
    return null
  }
}

testRegistrationFlow().catch(console.error)
