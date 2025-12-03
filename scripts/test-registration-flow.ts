/**
 * Script de test du flux d'inscription complet
 * Test avec/sans paiement, avec/sans approbation, notifications, emails
 */

import { prisma } from '../lib/prisma'

async function testFlow() {
  console.log('=== TEST DU FLUX D\'INSCRIPTION ===\n')

  // 1. Vérifier l'utilisateur organisateur
  console.log('1. Vérification de l\'utilisateur organisateur (ahmedelghoudi@gmail.com):')
  const organizer = await prisma.user.findUnique({
    where: { email: 'ahmedelghoudi@gmail.com' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  })
  console.log(organizer || 'Non trouvé')
  console.log('')

  // 2. Lister les inscriptions récentes
  console.log('2. Inscriptions récentes:')
  const registrations = await prisma.eventRegistration.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
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
  registrations.forEach(r => {
    console.log(`- ${r.eventTitle}: ${r.firstName} ${r.lastName} (${r.email}) - Status: ${r.status}${r.requiresPayment ? ` - ${r.paymentAmount} CHF` : ''}`)
  })
  console.log('')

  // 3. Notifications pour l'organisateur
  console.log('3. Notifications pour l\'organisateur:')
  if (organizer) {
    const notifications = await prisma.notification.findMany({
      where: { userId: organizer.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
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
    notifications.forEach(n => {
      console.log(`- [${n.type}] ${n.title}: ${n.message.substring(0, 50)}...`)
      console.log(`  Link: ${n.link} | Read: ${n.read} | Email sent: ${n.emailSent}`)
    })
  }
  console.log('')

  // 4. Toutes les notifications récentes
  console.log('4. Toutes les notifications récentes:')
  const allNotifs = await prisma.notification.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } }
    }
  })
  allNotifs.forEach(n => {
    console.log(`- [${n.type}] Pour ${n.user?.email || 'N/A'}: ${n.title}`)
    console.log(`  Message: ${n.message.substring(0, 60)}...`)
    console.log(`  Link: ${n.link} | Read: ${n.read} | Email: ${n.emailSent}`)
  })

  // 5. Résumé des stats
  console.log('\n5. Résumé des statistiques:')
  const totalRegistrations = await prisma.eventRegistration.count()
  const pendingRegistrations = await prisma.eventRegistration.count({ where: { status: 'PENDING' } })
  const confirmedRegistrations = await prisma.eventRegistration.count({ where: { status: 'CONFIRMED' } })
  const totalNotifications = await prisma.notification.count()
  const unreadNotifications = await prisma.notification.count({ where: { read: false } })

  console.log(`Total inscriptions: ${totalRegistrations}`)
  console.log(`En attente: ${pendingRegistrations}`)
  console.log(`Confirmées: ${confirmedRegistrations}`)
  console.log(`Total notifications: ${totalNotifications}`)
  console.log(`Non lues: ${unreadNotifications}`)

  await prisma.$disconnect()
}

testFlow().catch(console.error)
