import { createDirectus, rest, staticToken, createItems } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

const directusClient = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

async function seedProjects() {
  console.log('🌱 Ajout de 5 projets de démonstration dans Directus...')

  const projects = [
    {
      title: 'Rénovation de la Salle de Prière',
      slug: 'renovation-salle-priere',
      description: 'Agrandissement et rénovation complète de la salle de prière principale pour accueillir plus de fidèles.',
      content: '<p>La mosquée a besoin d\'agrandir sa capacité d\'accueil. Ce projet permettra de rénover entièrement la salle de prière et d\'ajouter 200 places supplémentaires.</p>',
      goal_amount: 50000,
      current_amount: 12500,
      priority: 1,
      active: true,
      status: 'published',
    },
    {
      title: 'Construction de l\'École Coranique',
      slug: 'construction-ecole-coranique',
      description: 'Construction d\'un nouveau bâtiment dédié à l\'enseignement du Coran et de la langue arabe.',
      content: '<p>Un espace dédié pour nos enfants avec 6 salles de classe modernes et équipées.</p>',
      goal_amount: 120000,
      current_amount: 45000,
      priority: 2,
      active: true,
      status: 'published',
    },
    {
      title: 'Aide aux Familles Nécessiteuses',
      slug: 'aide-familles-necessiteuses',
      description: 'Fonds de solidarité pour aider les familles musulmanes en difficulté de notre communauté.',
      content: '<p>Distribution de colis alimentaires, aide au loyer, et soutien scolaire pour les enfants.</p>',
      goal_amount: 25000,
      current_amount: 18750,
      priority: 3,
      active: true,
      status: 'published',
    },
    {
      title: 'Achat de Climatiseurs',
      slug: 'achat-climatiseurs',
      description: 'Installation de système de climatisation pour améliorer le confort des fidèles en été.',
      content: '<p>Installation de 8 climatiseurs réversibles pour la salle de prière et les salles de cours.</p>',
      goal_amount: 15000,
      current_amount: 8200,
      priority: 4,
      active: true,
      status: 'published',
    },
    {
      title: 'Bibliothèque Islamique',
      slug: 'bibliotheque-islamique',
      description: 'Création d\'une bibliothèque avec des ouvrages islamiques en français, arabe et anglais.',
      content: '<p>Achat de 500 livres de référence, construction d\'étagères et aménagement d\'un espace de lecture.</p>',
      goal_amount: 8000,
      current_amount: 2400,
      priority: 5,
      active: true,
      status: 'published',
    },
  ]

  try {
    for (const project of projects) {
      console.log(`📚 Ajout du projet: ${project.title}`)
      await directusClient.request(createItems('projects', project))
    }

    console.log('\n✅ 5 projets ajoutés avec succès !')
    console.log('\n📊 Résumé des projets:')
    projects.forEach((p, i) => {
      const percentage = ((p.current_amount / p.goal_amount) * 100).toFixed(1)
      console.log(`${i + 1}. ${p.title}`)
      console.log(`   Objectif: ${p.goal_amount.toLocaleString('fr-FR')}€`)
      console.log(`   Collecté: ${p.current_amount.toLocaleString('fr-FR')}€ (${percentage}%)`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des projets:', error)
    throw error
  }
}

seedProjects()
  .then(() => {
    console.log('✅ Terminé !')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
