import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Ajout des nouveaux états et champs pour les inscriptions...')

    // Ajouter les nouveaux champs à la table enrollments
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "enrollments"
      ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
      ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
      ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
    `)

    console.log('✅ Colonnes ajoutées avec succès')

    // Les nouveaux enum values doivent être ajoutés différemment
    // PostgreSQL ne permet pas ADD VALUE IF NOT EXISTS avant la version 9.1
    // On essaie et on ignore l'erreur si la valeur existe déjà

    const enumValues = ['WAITING_LIST', 'INTERVIEW_REQUIRED', 'ACTIVE']

    for (const value of enumValues) {
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TYPE "EnrollmentStatus" ADD VALUE '${value}';
        `)
        console.log(`✅ Ajout de l'état: ${value}`)
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️  L'état ${value} existe déjà`)
        } else {
          throw error
        }
      }
    }

    const count = await prisma.enrollment.count()
    console.log(`\n✅ Migration terminée ! ${count} inscriptions dans la base`)

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
