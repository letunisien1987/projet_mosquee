import { createDirectus, rest, authentication, login, createItems, readItems } from '@directus/sdk'

const DIRECTUS_URL = 'http://localhost:8055'

// Identifiants admin
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'PRXwXJfnuM7Tr0pCGMswE8zrpoDorqV5'

console.log('🚀 Configuration de Directus pour les projets de dons avec RaiseNow\n')
console.log('═══════════════════════════════════════════════════════════════\n')

async function setupDirectus() {
  const client = createDirectus(DIRECTUS_URL).with(authentication()).with(rest())

  try {
    // Étape 1 : Se connecter à Directus
    console.log('1️⃣ Connexion à Directus...')
    console.log(`   📧 Email: ${ADMIN_EMAIL}`)

    await client.request(
      login(ADMIN_EMAIL, ADMIN_PASSWORD)
    )

    console.log('   ✅ Connexion réussie !\n')

    // Étape 2 : Vérifier la collection projects
    console.log('2️⃣ Vérification de la collection projects...')

    try {
      const existingProjects = await client.request(
        readItems('projects', { limit: 1 })
      )
      console.log('   ✅ Collection projects existe\n')
    } catch (error: any) {
      console.error('   ❌ Erreur lors de la vérification:', error.message)
      throw error
    }

    // Étape 3 : Ajouter les projets de démonstration
    console.log('3️⃣ Ajout des projets de démonstration avec codes RaiseNow...\n')

    const demoProjects = [
      {
        title: 'Rénovation de la Salle de Prière',
        slug: 'renovation-salle-priere',
        description: 'Agrandissement et rénovation complète de la salle de prière principale pour accueillir plus de fidèles.',
        content: '<p>La mosquée a besoin d\'agrandir sa capacité d\'accueil. Ce projet permettra de rénover entièrement la salle de prière et d\'ajouter 200 places supplémentaires.</p>',
        goal_amount: 50000,
        current_amount: 12500,
        raisenow_code: 'zsmgy', // Code RaiseNow de test
        priority: 1,
        active: true,
      },
      {
        title: 'Construction de l\'École Coranique',
        slug: 'construction-ecole-coranique',
        description: 'Construction d\'un nouveau bâtiment dédié à l\'enseignement du Coran et de la langue arabe.',
        content: '<p>Un espace dédié pour nos enfants avec 6 salles de classe modernes et équipées.</p>',
        goal_amount: 120000,
        current_amount: 45000,
        raisenow_code: 'ecole24',
        priority: 2,
        active: true,
      },
      {
        title: 'Aide aux Familles Nécessiteuses',
        slug: 'aide-familles-necessiteuses',
        description: 'Fonds de solidarité pour aider les familles musulmanes en difficulté de notre communauté.',
        content: '<p>Distribution de colis alimentaires, aide au loyer, et soutien scolaire pour les enfants.</p>',
        goal_amount: 25000,
        current_amount: 18750,
        raisenow_code: 'aide24',
        priority: 3,
        active: true,
      },
      {
        title: 'Achat de Climatiseurs',
        slug: 'achat-climatiseurs',
        description: 'Installation de système de climatisation pour améliorer le confort des fidèles en été.',
        content: '<p>Installation de 8 climatiseurs réversibles pour la salle de prière et les salles de cours.</p>',
        goal_amount: 15000,
        current_amount: 8200,
        raisenow_code: 'clim24',
        priority: 4,
        active: true,
      },
      {
        title: 'Bibliothèque Islamique',
        slug: 'bibliotheque-islamique',
        description: 'Création d\'une bibliothèque avec des ouvrages islamiques en français, arabe et anglais.',
        content: '<p>Achat de 500 livres de référence, construction d\'étagères et aménagement d\'un espace de lecture.</p>',
        goal_amount: 8000,
        current_amount: 2400,
        raisenow_code: 'bib24',
        priority: 5,
        active: true,
      },
    ]

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const project of demoProjects) {
      try {
        await client.request(createItems('projects', project))
        console.log(`   ✅ ${project.title}`)
        console.log(`      💰 Objectif: ${project.goal_amount.toLocaleString('fr-FR')} CHF`)
        console.log(`      📊 Collecté: ${project.current_amount.toLocaleString('fr-FR')} CHF (${((project.current_amount / project.goal_amount) * 100).toFixed(0)}%)`)
        console.log(`      🔗 Code RaiseNow: ${project.raisenow_code}`)
        console.log('')
        successCount++
      } catch (error: any) {
        if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
          console.log(`   ⚠️  ${project.title} (déjà existant)`)
          skipCount++
        } else if (error.errors?.[0]?.extensions?.field === 'raisenow_code') {
          console.log(`   ⚠️  ${project.title}`)
          console.log(`      ❌ Le champ 'raisenow_code' n'existe pas dans Directus`)
          console.log(`      💡 Ajoutez-le manuellement:`)
          console.log(`         1. http://localhost:8055`)
          console.log(`         2. Settings → Data Model → projects`)
          console.log(`         3. + Create Field → String → raisenow_code`)
          console.log('')
          errorCount++
        } else {
          console.error(`   ❌ Erreur pour "${project.title}":`)
          console.error(`      ${error.errors?.[0]?.message || error.message}`)
          console.log('')
          errorCount++
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════')
    if (errorCount === 0) {
      console.log(`✅ Configuration terminée avec succès !`)
    } else {
      console.log(`⚠️  Configuration terminée avec des erreurs`)
    }
    console.log(`   - ${successCount} projet(s) ajouté(s)`)
    console.log(`   - ${skipCount} projet(s) déjà existant(s)`)
    console.log(`   - ${errorCount} erreur(s)`)
    console.log('═══════════════════════════════════════════════════════════════\n')

    if (successCount > 0) {
      console.log('🌐 TESTEZ MAINTENANT:')
      console.log('───────────────────────────────────────────────────────────────')
      console.log('→ http://localhost:3000/dons')
      console.log('   Vous verrez les cartes de projets avec bouton "Faire un don"\n')
    }

    console.log('⚙️  DIRECTUS ADMIN:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log('→ http://localhost:8055')
    console.log('→ Content → Projects\n')

    if (errorCount > 0) {
      console.log('📝 ACTION REQUISE:')
      console.log('───────────────────────────────────────────────────────────────')
      console.log('Ajoutez le champ "raisenow_code" dans Directus:')
      console.log('1. http://localhost:8055')
      console.log('2. Settings → Data Model → projects')
      console.log('3. + Create Field')
      console.log('4. Type: String')
      console.log('5. Key: raisenow_code')
      console.log('6. Interface: Input')
      console.log('7. Placeholder: "ex: zsmgy"')
      console.log('8. Save')
      console.log('\nPuis relancez ce script.\n')
    }

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)

    if (error.errors?.[0]?.extensions?.code === 'INVALID_CREDENTIALS') {
      console.log('\n💡 SOLUTIONS:')
      console.log('───────────────────────────────────────────────────────────────')
      console.log('1. Vérifiez les identifiants Directus')
      console.log('2. Utilisez les variables d\'environnement:')
      console.log('   DIRECTUS_ADMIN_EMAIL=your@email.com \\')
      console.log('   DIRECTUS_ADMIN_PASSWORD=yourpassword \\')
      console.log('   npx tsx scripts/directus-login-and-setup.ts')
      console.log('')
      console.log('3. Ou modifiez directement le script avec vos identifiants\n')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Directus n\'est pas démarré')
      console.log('───────────────────────────────────────────────────────────────')
      console.log('Lancez Directus:')
      console.log('   cd directus-mosquee')
      console.log('   npx directus start\n')
    }

    process.exit(1)
  }
}

setupDirectus()
  .then(() => {
    console.log('✅ Script terminé\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Échec:', error.message)
    process.exit(1)
  })
