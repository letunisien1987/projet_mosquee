import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function runManualMigration() {
  console.log('📦 Running manual migration for children & payment system...')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/manual_add_children_payment_system.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT')

    console.log(`Found ${statements.length} SQL statements to execute\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`[${i + 1}/${statements.length}] Executing...`)

      try {
        await prisma.$executeRawUnsafe(statement)
        console.log(`✅ Success\n`)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`⚠️  Skipped (already exists)\n`)
        } else {
          console.error(`❌ Error:`, error.message)
          console.error(`Statement: ${statement.substring(0, 100)}...\n`)
        }
      }
    }

    console.log('✅ Manual migration completed!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runManualMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
