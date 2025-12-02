import { createDirectus, rest, staticToken, createItems } from '@directus/sdk'

const DIRECTUS_URL = 'http://localhost:8055'

// Ce script nécessite un token ADMIN avec permissions de création
// Remplacez par votre token admin Directus
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || ''

if (!ADMIN_TOKEN) {
  console.error('❌ Veuillez fournir un DIRECTUS_ADMIN_TOKEN')
  console.log('Usage: DIRECTUS_ADMIN_TOKEN=your_admin_token npx tsx scripts/add-demo-projects.ts')
  process.exit(1)
}

const directusClient = createDirectus(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest())

const demoProjects = [
  {
    title: 'Rénovation de la Salle de Prière',
    slug: 'renovation-salle-priere',
    description: 'Agrandissement et rénovation complète de la salle de prière principale pour accueillir plus de fidèles.',
    content: '<p>La mosquée a besoin d\'agrandir sa capacité d\'accueil. Ce projet permettra de rénover entièrement la salle de prière et d\'ajouter 200 places supplémentaires.</p>',
    goal_amount: 50000,
    current_amount: 12500,
    raisenow_code: 'zsmgy', // Code RaiseNow (remplacez par le vôtre)
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
    raisenow_code: 'ecole24', // Code RaiseNow (remplacez par le vôtre)
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
    raisenow_code: 'aide24', // Code RaiseNow (remplacez par le vôtre)
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
    raisenow_code: 'clim24', // Code RaiseNow (remplacez par le vôtre)
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
    raisenow_code: 'bib24', // Code RaiseNow (remplacez par le vôtre)
    priority: 5,
    active: true,
  },
]

async function addDemoProjects() {
  console.log('🌱 Ajout de 5 projets de démonstration dans Directus...\n')

  try {
    for (const project of demoProjects) {
      console.log(`📚 Ajout du projet: ${project.title}`)

      try {
        await directusClient.request(createItems('projects', project))
        console.log(`   ✅ Ajouté avec succès`)
      } catch (error: any) {
        if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
          console.log(`   ⚠️  Projet déjà existant (slug: ${project.slug})`)
        } else {
          throw error
        }
      }
    }

    console.log('\n✅ Terminé !')
    console.log('\n📊 Résumé des projets:')
    demoProjects.forEach((p, i) => {
      const percentage = ((p.current_amount / p.goal_amount) * 100).toFixed(1)
      console.log(`${i + 1}. ${p.title}`)
      console.log(`   Objectif: ${p.goal_amount.toLocaleString('fr-FR')}€`)
      console.log(`   Collecté: ${p.current_amount.toLocaleString('fr-FR')}€ (${percentage}%)`)
      console.log('')
    })
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'ajout des projets:', error)
    if (error.errors) {
      console.error('Détails:', JSON.stringify(error.errors, null, 2))
    }
    throw error
  }
}

addDemoProjects()
  .then(() => {
    console.log('✅ Script terminé avec succès !')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  })
