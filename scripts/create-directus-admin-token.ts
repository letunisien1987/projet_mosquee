import crypto from 'crypto'

/**
 * Script pour générer un token static admin pour Directus
 *
 * Ce script génère un token aléatoire sécurisé que vous pouvez configurer dans Directus.
 *
 * Pour l'utiliser dans Directus:
 * 1. Connectez-vous à l'interface admin de Directus (http://localhost:8055)
 * 2. Allez dans Settings > Access Tokens
 * 3. Créez un nouveau token avec les permissions ADMIN
 * 4. Ou ajoutez le token généré manuellement dans la base de données
 */

async function generateAdminToken() {
  // Générer un token sécurisé
  const token = crypto.randomBytes(32).toString('hex')

  console.log('\n' + '='.repeat(80))
  console.log('🔑 NOUVEAU TOKEN ADMIN DIRECTUS GÉNÉRÉ')
  console.log('='.repeat(80))
  console.log('\nToken:', token)
  console.log('\n📝 Instructions:')
  console.log('1. Copiez le token ci-dessus')
  console.log('2. Connectez-vous à Directus Admin: http://localhost:8055')
  console.log('   Email: admin@mosquee.ch')
  console.log('   Mot de passe: mosquee2024!')
  console.log('3. Allez dans Settings > Access Tokens')
  console.log('4. Créez un nouveau Static Token avec ce token et donnez-lui les permissions Admin')
  console.log('5. Ou utilisez cette requête SQL pour l\'ajouter directement:\n')

  const userId = '7d5297fb-0af1-4c3a-a697-cf7745f028e0' // L'UUID de l'admin que nous avons vu dans les logs

  console.log(`-- Requête SQL à exécuter dans PostgreSQL:`)
  console.log(`INSERT INTO directus.directus_access (id, user, role, policy)`)
  console.log(`VALUES (`)
  console.log(`  gen_random_uuid(),`)
  console.log(`  '${userId}',`)
  console.log(`  NULL,`)
  console.log(`  (SELECT id FROM directus.directus_policies WHERE admin_access = true LIMIT 1)`)
  console.log(`);`)
  console.log('')
  console.log('6. Ajoutez ensuite ce token dans /Users/elghoudi/mosquee/.env:')
  console.log(`   DIRECTUS_TOKEN="${token}"`)
  console.log('\n' + '='.repeat(80) + '\n')

  // Alternative: afficher comment créer le token via API une fois connecté
  console.log('\n💡 Alternative: Créer le token via l\'API Directus')
  console.log('Vous pouvez également utiliser curl une fois connecté pour créer un token static.\n')
}

generateAdminToken()
