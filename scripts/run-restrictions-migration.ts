/**
 * Script pour exécuter la migration SQL des restrictions
 * via Prisma (compatible avec Prisma Accelerate)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runMigration() {
  console.log('🔧 Exécution de la migration SQL pour les restrictions...\n')

  try {
    // Ajouter les colonnes si elles n'existent pas
    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS participation_type VARCHAR(255) DEFAULT 'INDIVIDUAL'
    `)
    console.log('✅ Colonne participation_type ajoutée')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS number_of_adults INTEGER DEFAULT 1
    `)
    console.log('✅ Colonne number_of_adults ajoutée')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0
    `)
    console.log('✅ Colonne number_of_children ajoutée')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS participants JSONB
    `)
    console.log('✅ Colonne participants ajoutée')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS participant_age INTEGER
    `)
    console.log('✅ Colonne participant_age ajoutée')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_registrations
      ADD COLUMN IF NOT EXISTS participant_gender VARCHAR(50)
    `)
    console.log('✅ Colonne participant_gender ajoutée')

    console.log('\n🎉 Migration terminée avec succès!')

    // Vérification
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'event_registrations'
      AND column_name IN ('participation_type', 'number_of_adults', 'number_of_children', 'participants', 'participant_age', 'participant_gender')
      ORDER BY column_name
    `)

    console.log('\n📋 Colonnes créées:')
    console.table(result)

  } catch (error: any) {
    // Si la colonne existe déjà, c'est OK
    if (error.message?.includes('already exists')) {
      console.log('\n⚠️ Certaines colonnes existent déjà (c\'est normal si la migration a déjà été exécutée)')
    } else {
      console.error('\n❌ Erreur:', error.message)
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
