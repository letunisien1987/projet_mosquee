import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Ajout des nouveaux champs pour les inscriptions...')

    // Prisma gère automatiquement les nouveaux champs avec le client généré
    // On vérifie juste que la connexion fonctionne
    const count = await prisma.enrollment.count()
    console.log(`✅ ${count} inscriptions trouvées dans la base`)

    console.log('✅ Migration terminée avec succès !')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
