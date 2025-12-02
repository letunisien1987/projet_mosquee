import { createDirectus, rest, staticToken, createItems, readItems } from '@directus/sdk'

const DIRECTUS_URL = 'http://localhost:8055'
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'PRXwXJfnuM7Tr0pCGMswE8zrpoDorqV5'

const directusClient = createDirectus(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest())

console.log('🚀 Configuration de Directus pour les projets de dons avec RaiseNow\n')
console.log('═══════════════════════════════════════════════════════════════\n')

async function setupDirectus() {
  try {
    // Étape 1 : Vérifier la connexion
    console.log('1️⃣ Vérification de la connexion à Directus...')

    try {
      const existingProjects = await directusClient.request(
        readItems('projects', { limit: 1 })
      )
      console.log('   ✅ Connexion réussie à Directus\n')
    } catch (error: any) {
      if (error.message?.includes('ECONNREFUSED')) {
        console.error('   ❌ Directus n\'est pas démarré sur http://localhost:8055')
        console.log('   💡 Lancez Directus avec: cd directus-mosquee && npx directus start\n')
        process.exit(1)
      }
      throw error
    }

    // Étape 2 : Ajouter le champ raisenow_code (si ce n'est pas déjà fait)
    console.log('2️⃣ Configuration du champ raisenow_code...')
    console.log('   ℹ️  Le champ doit être ajouté manuellement dans Directus UI')
    console.log('   📝 Instructions:')
    console.log('      1. Allez sur: http://localhost:8055')
    console.log('      2. Settings → Data Model → projects')
    console.log('      3. Cliquez sur "+ Create Field"')
    console.log('      4. Type: String')
    console.log('      5. Field Key: raisenow_code')
    console.log('      6. Interface: Input')
    console.log('      7. Placeholder: "ex: zsmgy"')
    console.log('      8. Sauvegardez\n')
    console.log('   ⏭️  Si le champ existe déjà, on continue...\n')

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

    for (const project of demoProjects) {
      try {
        await directusClient.request(createItems('projects', project))
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
        } else if (error.errors?.[0]?.extensions?.code === 'FAILED_VALIDATION') {
          console.log(`   ⚠️  ${project.title}`)
          console.log(`      ❌ Erreur: Le champ raisenow_code n'existe pas encore`)
          console.log(`      💡 Ajoutez-le manuellement dans Directus (voir instructions ci-dessus)`)
          console.log('')
        } else {
          console.error(`   ❌ Erreur pour "${project.title}":`, error.errors || error.message)
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`✅ Configuration terminée !`)
    console.log(`   - ${successCount} projet(s) ajouté(s)`)
    console.log(`   - ${skipCount} projet(s) déjà existant(s)`)
    console.log('═══════════════════════════════════════════════════════════════\n')

    console.log('🌐 TESTEZ MAINTENANT:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log('1. Allez sur: http://localhost:3000/dons')
    console.log('2. Vous verrez les cartes de projets avec:')
    console.log('   - Image du projet')
    console.log('   - Description')
    console.log('   - Barre de progression')
    console.log('   - Bouton "Faire un don"')
    console.log('3. Cliquez sur "Faire un don":')
    console.log('   → Popup s\'ouvre avec widget RaiseNow')
    console.log('   → Formulaire de don intégré\n')

    console.log('⚙️  DIRECTUS ADMIN:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log('→ http://localhost:8055')
    console.log('→ Content → Projects')
    console.log('→ Vous pouvez modifier les projets, changer les codes RaiseNow, etc.\n')

    console.log('📖 GUIDE COMPLET: RAISENOW_PROJECTS_GUIDE.md\n')

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    if (error.errors) {
      console.error('Détails:', JSON.stringify(error.errors, null, 2))
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
