/**
 * Script : Réinitialiser les cotisations
 * Tous les utilisateurs redeviennent des membres normaux (sans cotisation active)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Réinitialisation des cotisations...\n')

  // Option 1 : Mettre toutes les cotisations en statut EXPIRED
  const result = await prisma.membership.updateMany({
    where: {
      status: 'ACTIVE',
    },
    data: {
      status: 'EXPIRED',
    },
  })

  console.log(`✅ ${result.count} cotisation(s) expirée(s)`)
  console.log('\n📊 Tous les utilisateurs sont maintenant des membres normaux')
  console.log('   Ils devront payer une nouvelle cotisation pour devenir ACTIF ou PASSIF\n')

  // Vérification
  const activeMemberships = await prisma.membership.count({
    where: { status: 'ACTIVE' },
  })

  console.log(`✓ Cotisations actives restantes: ${activeMemberships}`)
  console.log('🎉 Réinitialisation terminée !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
