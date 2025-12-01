/**
 * Script de test pour la fonctionnalité de réponse par email
 *
 * Ce script va:
 * 1. Créer un message de contact depuis ahmedelghoudi@gmail.com
 * 2. Vérifier que le message apparaît dans la base de données
 * 3. Simuler une réponse de l'admin
 *
 * Usage: npx tsx scripts/test-reply-email.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Test de la fonctionnalité "Répondre par Email"\n')

  // Étape 1: Créer un message de contact
  console.log('📝 Étape 1: Création d\'un message de contact...')

  const testMessage = await prisma.contactMessage.create({
    data: {
      firstName: 'Ahmed',
      lastName: 'El Ghoudi',
      email: 'ahmedelghoudi@gmail.com',
      phone: '+41 76 123 45 67',
      subject: 'Test de la fonctionnalité de réponse',
      message: 'Bonjour,\n\nJe teste la nouvelle fonctionnalité qui permet de répondre directement depuis l\'admin.\n\nEst-ce que cela fonctionne bien?\n\nMerci!',
      read: false
    }
  })

  console.log('✅ Message créé avec succès!')
  console.log(`   ID: ${testMessage.id}`)
  console.log(`   De: ${testMessage.firstName} ${testMessage.lastName}`)
  console.log(`   Email: ${testMessage.email}`)
  console.log(`   Sujet: ${testMessage.subject}`)
  console.log(`   Statut: ${testMessage.read ? 'Lu' : 'Non lu'}`)
  console.log()

  // Étape 2: Vérifier dans la base de données
  console.log('🔍 Étape 2: Vérification dans la base de données...')

  const messages = await prisma.contactMessage.findMany({
    where: {
      email: 'ahmedelghoudi@gmail.com'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  console.log(`✅ Trouvé ${messages.length} message(s) pour ahmedelghoudi@gmail.com`)
  messages.forEach((msg, index) => {
    console.log(`   ${index + 1}. ${msg.subject} - ${msg.read ? '✅ Lu' : '⏳ Non lu'} - ${msg.createdAt.toLocaleDateString('fr-FR')}`)
  })
  console.log()

  // Étape 3: Instructions pour le test manuel
  console.log('📋 Étape 3: Test manuel dans l\'interface admin\n')
  console.log('Maintenant, suivez ces étapes dans votre navigateur:')
  console.log('1. Ouvrez http://localhost:3000/admin/login')
  console.log('2. Connectez-vous avec:')
  console.log('   Email: admin@mosquee.com')
  console.log('   Password: Admin123!')
  console.log('3. Allez sur http://localhost:3000/admin/messages')
  console.log('4. Trouvez le message "Test de la fonctionnalité de réponse"')
  console.log('5. Cliquez sur le bouton "Répondre" (icône Reply)')
  console.log('6. Vérifiez que:')
  console.log('   ✅ La modal s\'ouvre (pas de nouvelle page)')
  console.log('   ✅ Le destinataire est: Ahmed El Ghoudi (ahmedelghoudi@gmail.com)')
  console.log('   ✅ Le sujet est: "Re: Test de la fonctionnalité de réponse"')
  console.log('   ✅ Le message original est cité en bas')
  console.log('7. Écrivez un message de réponse')
  console.log('8. Cliquez sur "Envoyer la réponse"')
  console.log('9. Vérifiez que:')
  console.log('   ✅ Message de succès affiché')
  console.log('   ✅ La modal se ferme')
  console.log('   ✅ Le message est marqué comme lu')
  console.log('10. Vérifiez votre email ahmedelghoudi@gmail.com')
  console.log('    ✅ Email reçu avec template professionnel Mosquée Madretsch')
  console.log()

  console.log('🎯 Test de la colonne sticky:')
  console.log('1. Sur la page /admin/messages, réduisez la largeur de la fenêtre')
  console.log('2. Scrollez horizontalement dans le tableau')
  console.log('3. Vérifiez que la colonne "Actions" reste toujours visible à droite')
  console.log()

  console.log('✅ Script de préparation terminé!')
  console.log('📧 Un nouveau message de test a été créé pour vos tests manuels.')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
