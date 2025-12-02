/**
 * Script de migration : Convertir les anciens types de membership
 * FAMILY, INDIVIDUAL, STUDENT, SENIOR → ACTIF
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migration des anciens types de membership...\n')

  // Récupérer tous les memberships avec anciens types
  const oldMemberships = await prisma.membership.findMany({
    where: {
      type: {
        in: ['FAMILY', 'INDIVIDUAL', 'STUDENT', 'SENIOR'],
      },
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  console.log(`📊 ${oldMemberships.length} cotisation(s) à migrer\n`)

  if (oldMemberships.length === 0) {
    console.log('✅ Aucune migration nécessaire')
    return
  }

  // Afficher les cotisations qui seront migrées
  for (const membership of oldMemberships) {
    console.log(
      `   ${membership.user.email} - ${membership.type} → ACTIF`
    )
  }

  console.log('\n🔄 Migration en cours...\n')

  // Migrer vers ACTIF
  const result = await prisma.membership.updateMany({
    where: {
      type: {
        in: ['FAMILY', 'INDIVIDUAL', 'STUDENT', 'SENIOR'],
      },
    },
    data: {
      type: 'ACTIF',
    },
  })

  console.log(`✅ ${result.count} cotisation(s) migrée(s) vers ACTIF\n`)

  // Faire de même pour les demandes d'adhésion
  const oldRequests = await prisma.membershipRequest.findMany({
    where: {
      membershipType: {
        in: ['FAMILY', 'INDIVIDUAL', 'STUDENT', 'SENIOR'],
      },
    },
  })

  if (oldRequests.length > 0) {
    console.log(`📊 ${oldRequests.length} demande(s) d'adhésion à migrer`)

    const requestResult = await prisma.membershipRequest.updateMany({
      where: {
        membershipType: {
          in: ['FAMILY', 'INDIVIDUAL', 'STUDENT', 'SENIOR'],
        },
      },
      data: {
        membershipType: 'ACTIF',
      },
    })

    console.log(`✅ ${requestResult.count} demande(s) migrée(s) vers ACTIF\n`)
  }

  console.log('🎉 Migration terminée avec succès !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
