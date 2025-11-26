import { createClient } from '@sanity/client'
import 'dotenv/config'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
  apiVersion: '2024-01-01',
})

const events = [
  {
    _type: 'event',
    title: 'Préparation au Ramadan',
    slug: { _type: 'slug', current: 'preparation-ramadan' },
    description: 'Conférence sur la préparation spirituelle et pratique pour le mois béni de Ramadan. Discussion sur les mérites du jeûne et comment tirer le meilleur parti de ce mois.',
    category: 'religieux',
    date: '2024-12-15',
    startTime: '20h00',
    endTime: '22h00',
    location: 'Grande salle de prière',
    attendees: '100-150 personnes',
    published: true,
    featured: true,
  },
  {
    _type: 'event',
    title: 'Journée Portes Ouvertes',
    slug: { _type: 'slug', current: 'journee-portes-ouvertes' },
    description: 'Découvrez notre mosquée et rencontrez la communauté. Visite guidée, présentation de nos activités, et rafraîchissements offerts.',
    category: 'communaute',
    date: '2024-12-22',
    startTime: '14h00',
    endTime: '18h00',
    location: 'Mosquée Al-Nour',
    attendees: '200+ visiteurs attendus',
    published: true,
    featured: true,
  },
  {
    _type: 'event',
    title: 'Cours de Tafsir - Sourate Al-Kahf',
    slug: { _type: 'slug', current: 'cours-tafsir-al-kahf' },
    description: 'Étude approfondie de Sourate Al-Kahf avec Cheikh Mohammed. Analyse des enseignements et leçons à tirer.',
    category: 'education',
    date: '2024-12-28',
    startTime: '19h30',
    endTime: '21h00',
    location: 'Salle de cours',
    attendees: '30-40 étudiants',
    published: true,
  },
  {
    _type: 'event',
    title: 'Collecte Alimentaire',
    slug: { _type: 'slug', current: 'collecte-alimentaire' },
    description: 'Grande collecte alimentaire pour les familles dans le besoin. Denrées non périssables acceptées.',
    category: 'charite',
    date: '2025-01-05',
    startTime: '10h00',
    endTime: '16h00',
    location: 'Parvis de la mosquée',
    attendees: 'Ouvert à tous',
    published: true,
  },
  {
    _type: 'event',
    title: 'Célébration du Mawlid',
    slug: { _type: 'slug', current: 'celebration-mawlid' },
    description: 'Célébration de la naissance du Prophète Muhammad (PSL) avec chants religieux, conférence et repas communautaire.',
    category: 'religieux',
    date: '2025-01-12',
    startTime: '15h00',
    endTime: '18h00',
    location: 'Grande salle',
    attendees: 'Toute la communauté',
    published: true,
  },
  {
    _type: 'event',
    title: 'Atelier Éducation des Enfants',
    slug: { _type: 'slug', current: 'atelier-education-enfants' },
    description: 'Atelier pour parents sur l\'éducation islamique des enfants à l\'ère numérique. Animé par Dr. Fatima Zahri.',
    category: 'education',
    date: '2025-01-19',
    startTime: '18h00',
    endTime: '20h00',
    location: 'Salle de conférence',
    attendees: 'Parents et éducateurs',
    published: true,
  },
  {
    _type: 'event',
    title: 'Iftar Communautaire',
    slug: { _type: 'slug', current: 'iftar-communautaire' },
    description: 'Grande collecte alimentaire pour les familles dans le besoin. Denrées non périssables acceptées.',
    category: 'communaute',
    date: '2025-03-15',
    startTime: '19h30',
    endTime: '21h30',
    location: 'Grande salle',
    attendees: '150-200 personnes',
    published: true,
  },
  {
    _type: 'event',
    title: 'Distribution Zakat Al-Fitr',
    slug: { _type: 'slug', current: 'distribution-zakat-fitr' },
    description: 'Collecte et distribution de la Zakat Al-Fitr pour les nécessiteux.',
    category: 'charite',
    date: '2025-04-10',
    startTime: '09h00',
    endTime: '18h00',
    location: 'Bureau de la mosquée',
    attendees: 'Toute la communauté',
    published: true,
  },
  {
    _type: 'event',
    title: 'Prière de l\'Aïd Al-Fitr',
    slug: { _type: 'slug', current: 'priere-aid-fitr' },
    description: 'Célébration de l\'Aïd Al-Fitr avec deux sessions de prière. Venez en famille !',
    category: 'religieux',
    date: '2025-04-11',
    startTime: '08h00',
    endTime: '09h30',
    location: 'Parc Municipal (si beau temps)',
    attendees: '500+ fidèles',
    published: true,
    featured: true,
  },
]

async function seedEvents() {
  console.log('🌱 Ajout des événements d\'exemple dans Sanity...')

  for (const event of events) {
    try {
      const result = await client.create(event)
      console.log(`✅ Événement créé: ${event.title} (ID: ${result._id})`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création de "${event.title}":`, error)
    }
  }

  console.log('✨ Terminé ! Les événements sont maintenant visibles dans Sanity Studio.')
  console.log('📍 Accédez à Sanity Studio: http://localhost:3000/admin/studio')
}

seedEvents()
