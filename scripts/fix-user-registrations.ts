import { prisma } from '../lib/prisma'

/**
 * Script pour lier les inscriptions existantes à un utilisateur
 *
 * Usage: npx tsx scripts/fix-user-registrations.ts
 */

async function fixUserRegistrations() {
  console.log('🔧 Correction des inscriptions utilisateur\n')
  console.log('='.repeat(80))

  try {
    // Trouver l'utilisateur
    const userEmail = 'ahmed.elghoudi@gmail.com'
    const user = await prisma.user.findFirst({
      where: { email: userEmail }
    })

    if (!user) {
      console.log(`❌ Utilisateur ${userEmail} non trouvé`)
      await prisma.$disconnect()
      return
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Nom: ${user.firstName} ${user.lastName}\n`)

    // Trouver toutes les inscriptions avec cet email mais sans userId
    const orphanRegistrations = await prisma.$queryRaw<any[]>`
      SELECT id, "eventTitle", email, status, "createdAt"
      FROM event_registrations
      WHERE email = ${userEmail}
        AND "userId" IS NULL
      ORDER BY "createdAt" DESC
    `

    console.log(`📊 Trouvé ${orphanRegistrations.length} inscription(s) à lier\n`)

    if (orphanRegistrations.length === 0) {
      console.log('✅ Aucune inscription à corriger')
      await prisma.$disconnect()
      return
    }

    // Afficher les inscriptions
    console.log('Inscriptions à lier:')
    orphanRegistrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.eventTitle} - ${reg.status} (${new Date(reg.createdAt).toLocaleDateString('fr-FR')})`)
    })

    console.log('\n🔄 Liaison des inscriptions à l\'utilisateur...\n')

    // Lier les inscriptions à l'utilisateur
    for (const reg of orphanRegistrations) {
      await prisma.$executeRaw`
        UPDATE event_registrations
        SET "userId" = ${user.id}::uuid
        WHERE id = ${reg.id}::uuid
      `
      console.log(`✅ ${reg.eventTitle}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Toutes les inscriptions ont été liées à votre compte !')
    console.log('\n💡 Maintenant, vérifiez /membre/evenements')

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserRegistrations()
