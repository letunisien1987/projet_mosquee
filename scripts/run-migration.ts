import { prisma } from '@/lib/prisma'
import * as fs from 'fs'

async function runMigration() {
  const sql = fs.readFileSync('prisma/migrations/20241201_add_user_profile_notifications.sql', 'utf8')

  // Split par les commentaires -- et filtrer les lignes vides
  const statements = sql
    .split(/;[\s]*(?=--|\n|$)/g)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== ';')

  console.log(`🔄 Exécution de ${statements.length} commandes SQL...\n`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue

    try {
      console.log(`[${i+1}/${statements.length}] Exécution...`)
      await prisma.$executeRawUnsafe(statement + ';')
      console.log(`✅ OK\n`)
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Déjà existant\n`)
      } else {
        console.error(`❌ Erreur: ${error.message}\n`)
        console.error(`SQL: ${statement}\n`)
      }
    }
  }

  console.log('✅ Migration terminée!')
  await prisma.$disconnect()
}

runMigration()
