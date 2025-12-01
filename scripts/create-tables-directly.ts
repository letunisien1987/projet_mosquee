import { prisma } from '@/lib/prisma'

async function createTables() {
  console.log('🔄 Création des tables user_profiles et notifications...\n')
  
  try {
    // Table user_profiles
    console.log('1. Création de la table user_profiles...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "city" TEXT,
        "postalCode" TEXT,
        "country" TEXT DEFAULT 'France',
        "dateOfBirth" TIMESTAMP(3),
        "profilePicture" TEXT,
        "bio" TEXT,
        "preferredLanguage" TEXT NOT NULL DEFAULT 'fr',
        "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
        "notificationSms" BOOLEAN NOT NULL DEFAULT false,
        "newsletter" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
      )
    `
    console.log('✅ Table user_profiles créée\n')

    // Index unique sur userId
    console.log('2. Création de l\'index unique sur userId...')
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_userId_key" ON "user_profiles"("userId")`
    console.log('✅ Index créé\n')

    // Foreign key
    console.log('3. Ajout de la contrainte de clé étrangère...')
    await prisma.$executeRaw`
      ALTER TABLE "user_profiles" 
      DROP CONSTRAINT IF EXISTS "user_profiles_userId_fkey"
    `
    await prisma.$executeRaw`
      ALTER TABLE "user_profiles" 
      ADD CONSTRAINT "user_profiles_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log('✅ Contrainte ajoutée\n')

    // Table notifications
    console.log('4. Création de la table notifications...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "link" TEXT,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      )
    `
    console.log('✅ Table notifications créée\n')

    // Index sur userId et read
    console.log('5. Création de l\'index sur userId et read...')
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "notifications_userId_read_idx" ON "notifications"("userId", "read")`
    console.log('✅ Index créé\n')

    // Foreign key
    console.log('6. Ajout de la contrainte de clé étrangère...')
    await prisma.$executeRaw`
      ALTER TABLE "notifications" 
      DROP CONSTRAINT IF EXISTS "notifications_userId_fkey"
    `
    await prisma.$executeRaw`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "notifications_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log('✅ Contrainte ajoutée\n')

    console.log('✅ Toutes les tables ont été créées avec succès!')
    
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Les tables existent déjà')
    } else {
      console.error('❌ Erreur:', error.message)
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTables()
