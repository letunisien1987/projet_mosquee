/**
 * Script principal pour créer TOUTES les données de test
 * Crée 10 événements + 10 activités de test
 *
 * Usage: DIRECTUS_ADMIN_EMAIL=admin@mosquee.ch DIRECTUS_ADMIN_PASSWORD=mosquee2024! npx tsx scripts/create-all-test-data.ts
 */

import { createDirectus, rest, createItem, staticToken } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

// Client avec token statique
const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

function getFutureDatetime(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

// ========================================
// ÉVÉNEMENTS DE TEST
// ========================================

const testEvents = [
  // 1. Gratuit simple
  {
    title: '🕌 Prière du Vendredi',
    slug: `priere-vendredi-${Date.now()}`,
    description: 'Prière du vendredi avec sermon.',
    category: 'religieux',
    item_type: 'event',
    date: getFutureDate(7),
    start_time: '12:30',
    end_time: '14:00',
    location: 'Salle de prière principale',
    registration_required: false,
    payment_type: 'FREE',
    published: true,
  },

  // 2. Gratuit avec inscription
  {
    title: '📚 Cours arabe débutant',
    slug: `cours-arabe-${Date.now()}`,
    description: 'Cours gratuit avec inscription obligatoire.',
    category: 'education',
    item_type: 'event',
    date: getFutureDate(14),
    start_time: '18:00',
    end_time: '19:30',
    location: 'Salle 1',
    registration_required: true,
    max_capacity: 20,
    registration_deadline: getFutureDatetime(12),
    payment_type: 'FREE',
    published: true,
  },

  // 3. Payant simple
  {
    title: '🍽️ Iftar communautaire',
    slug: `iftar-${Date.now()}`,
    description: 'Repas de rupture du jeûne. 15 CHF/personne.',
    category: 'communaute',
    item_type: 'event',
    date: getFutureDate(10),
    start_time: '19:30',
    end_time: '21:30',
    location: 'Salle polyvalente',
    registration_required: true,
    max_capacity: 100,
    payment_type: 'ONE_TIME',
    price: 15,
    published: true,
    featured: true,
  },

  // 4. FAMILLE avec tarification avancée ⭐
  {
    title: '🎢 Sortie familiale au parc',
    slug: `sortie-famille-${Date.now()}`,
    description: 'Journée en famille! Adulte: 45 CHF, Enfant: 25 CHF, -6 ans: Gratuit, Max famille: 120 CHF',
    content: 'Tarifs avantageux pour les familles. Early bird -15% si inscription dans 7 jours!',
    category: 'communaute',
    item_type: 'event',
    date: getFutureDate(21),
    start_time: '08:00',
    end_time: '18:00',
    location: 'Départ: Parking mosquée',
    registration_required: true,
    max_capacity: 50,
    registration_deadline: getFutureDatetime(14),
    payment_type: 'ONE_TIME',
    price: 45,
    pricing: {
      adult_price: 45,
      child_price: 25,
      child_free_until_age: 5,
      group_discount: { enabled: true, from_persons: 5, discount_percent: 10 },
      family_max_price: 120,
      early_bird: { enabled: true, until_date: getFutureDate(7), discount_percent: 15 },
    },
    restrictions: { enabled: true, participation_type: 'FAMILY', allowed_gender: 'ALL' },
    published: true,
    featured: true,
  },

  // 5. Avec approbation
  {
    title: '🎓 Formation imam',
    slug: `formation-imam-${Date.now()}`,
    description: 'Formation sur sélection. 150 CHF.',
    category: 'education',
    item_type: 'event',
    date: getFutureDate(30),
    start_time: '09:00',
    end_time: '17:00',
    location: 'Salle conférence',
    registration_required: true,
    max_capacity: 15,
    requires_approval: true,
    payment_type: 'ONE_TIME',
    price: 150,
    published: true,
  },

  // 6. Femmes uniquement
  {
    title: '👩 Cercle étude femmes',
    slug: `cercle-femmes-${Date.now()}`,
    description: 'Réservé aux soeurs. Gratuit.',
    category: 'religieux',
    item_type: 'event',
    date: getFutureDate(5),
    start_time: '14:00',
    end_time: '16:00',
    location: 'Salle des femmes',
    registration_required: true,
    max_capacity: 30,
    payment_type: 'FREE',
    restrictions: { enabled: true, participation_type: 'INDIVIDUAL', allowed_gender: 'FEMALE', min_age: 16 },
    published: true,
  },

  // 7. Hommes uniquement
  {
    title: '👨 Retraite spirituelle hommes',
    slug: `retraite-hommes-${Date.now()}`,
    description: 'Week-end pour les frères. 80 CHF.',
    category: 'religieux',
    item_type: 'event',
    date: getFutureDate(28),
    start_time: '18:00',
    end_time: '18:00',
    location: 'Centre de retraite',
    registration_required: true,
    max_capacity: 25,
    payment_type: 'ONE_TIME',
    price: 80,
    restrictions: { enabled: true, participation_type: 'INDIVIDUAL', allowed_gender: 'MALE', min_age: 18 },
    published: true,
  },

  // 8. Enfants uniquement
  {
    title: '🧒 Atelier créatif enfants',
    slug: `atelier-enfants-${Date.now()}`,
    description: 'Pour enfants 6-12 ans. 10 CHF.',
    category: 'education',
    item_type: 'event',
    date: getFutureDate(12),
    start_time: '14:00',
    end_time: '16:00',
    location: 'Salle activités',
    registration_required: true,
    max_capacity: 15,
    payment_type: 'ONE_TIME',
    price: 10,
    restrictions: { enabled: true, participation_type: 'INDIVIDUAL', allowed_gender: 'CHILD', min_age: 6, max_age: 12 },
    published: true,
  },

  // 9. Abonnement
  {
    title: '📖 Cours Coran hebdo',
    slug: `cours-coran-${Date.now()}`,
    description: 'Tous les samedis. 50 CHF/mois.',
    category: 'education',
    item_type: 'event',
    date: getFutureDate(3),
    start_time: '10:00',
    end_time: '12:00',
    location: 'Salle 2',
    registration_required: true,
    max_capacity: 20,
    payment_type: 'SUBSCRIPTION',
    price: 50,
    subscription_interval: 'MONTHLY',
    published: true,
  },

  // 10. Mixte famille + plafond
  {
    title: '🌙 Soirée de l\'Aïd',
    slug: `soiree-aid-${Date.now()}`,
    description: 'Grande fête! Adulte: 20 CHF, Enfant: 10 CHF, -4 ans: Gratuit, Max: 60 CHF.',
    category: 'communaute',
    item_type: 'event',
    date: getFutureDate(45),
    start_time: '18:00',
    end_time: '22:00',
    location: 'Salle des fêtes',
    registration_required: true,
    max_capacity: 200,
    payment_type: 'ONE_TIME',
    price: 20,
    pricing: {
      adult_price: 20,
      child_price: 10,
      child_free_until_age: 3,
      group_discount: { enabled: false, from_persons: 4, discount_percent: 0 },
      family_max_price: 60,
      early_bird: { enabled: false, until_date: null, discount_percent: 0 },
    },
    restrictions: { enabled: true, participation_type: 'MIXED', allowed_gender: 'ALL' },
    published: true,
    featured: true,
  },
]

// ========================================
// ACTIVITÉS DE TEST
// ========================================

const testActivities = [
  // 1. Gratuit adultes
  {
    title: '📚 Arabe niveau 1',
    slug: `arabe-n1-${Date.now()}`,
    description: 'Initiation gratuite pour débutants.',
    category: 'langue',
    schedule: 'Lundis 19h-20h30',
    level: 'debutant',
    age_group: 'adultes',
    max_participants: 20,
    price: 0,
    active: true,
    enrollment_open: true,
  },

  // 2. Enfants avec réduction fratrie
  {
    title: '📖 École coranique enfants',
    slug: `ecole-coran-${Date.now()}`,
    description: 'Pour enfants 6-14 ans. 80 CHF/mois. -15% 2e enfant, max 140 CHF/famille.',
    category: 'coran',
    schedule: 'Mer 14h-16h, Sam 10h-12h',
    level: 'tous',
    age_group: 'enfants',
    max_participants: 25,
    price: 80,
    pricing: {
      adult_price: 80,
      child_price: 80,
      child_free_until_age: 0,
      group_discount: { enabled: true, from_persons: 2, discount_percent: 15 },
      family_max_price: 140,
      early_bird: { enabled: false, until_date: null, discount_percent: 0 },
    },
    active: true,
    enrollment_open: true,
  },

  // 3. Payant trimestre
  {
    title: '🎨 Calligraphie arabe',
    slug: `calligraphie-${Date.now()}`,
    description: 'Cours trimestriel. 250 CHF.',
    category: 'art',
    schedule: 'Samedis 14h-16h',
    level: 'intermediaire',
    age_group: 'adultes',
    max_participants: 12,
    price: 250,
    active: true,
    enrollment_open: true,
  },

  // 4. Femmes uniquement
  {
    title: '👩 Tajwid femmes',
    slug: `tajwid-femmes-${Date.now()}`,
    description: 'Réservé aux soeurs. 60 CHF/mois.',
    category: 'coran',
    schedule: 'Mar & Jeu 10h-11h30',
    level: 'tous',
    age_group: 'femmes',
    max_participants: 15,
    price: 60,
    restrictions: { enabled: true, allowed_gender: 'FEMALE' },
    active: true,
    enrollment_open: true,
  },

  // 5. Hommes uniquement
  {
    title: '👨 Fiqh hommes',
    slug: `fiqh-hommes-${Date.now()}`,
    description: 'Cours gratuit pour les frères.',
    category: 'religion',
    schedule: 'Vendredis 20h-21h30',
    level: 'tous',
    age_group: 'hommes',
    max_participants: 40,
    price: 0,
    restrictions: { enabled: true, allowed_gender: 'MALE' },
    active: true,
    enrollment_open: true,
  },

  // 6. Sport garçons
  {
    title: '⚽ Football garçons',
    slug: `football-${Date.now()}`,
    description: 'Pour garçons 8-14 ans. 30 CHF/mois.',
    category: 'sport',
    schedule: 'Dimanches 10h-12h',
    level: 'tous',
    age_group: 'enfants',
    max_participants: 20,
    price: 30,
    restrictions: { enabled: true, allowed_gender: 'MALE', min_age: 8, max_age: 14 },
    active: true,
    enrollment_open: true,
  },

  // 7. Sport filles
  {
    title: '🏸 Badminton filles',
    slug: `badminton-${Date.now()}`,
    description: 'Pour filles 10-16 ans. 25 CHF/mois.',
    category: 'sport',
    schedule: 'Samedis 16h-18h',
    level: 'tous',
    age_group: 'enfants',
    max_participants: 16,
    price: 25,
    restrictions: { enabled: true, allowed_gender: 'FEMALE', min_age: 10, max_age: 16 },
    active: true,
    enrollment_open: true,
  },

  // 8. Avec approbation
  {
    title: '🎓 Formation enseignants',
    slug: `formation-ens-${Date.now()}`,
    description: 'Sur sélection. 500 CHF.',
    category: 'formation',
    schedule: 'Samedis 9h-13h',
    level: 'avance',
    age_group: 'adultes',
    max_participants: 10,
    price: 500,
    requires_approval: true,
    active: true,
    enrollment_open: true,
  },

  // 9. Familiale avec plafond
  {
    title: '🏊 Piscine familiale',
    slug: `piscine-${Date.now()}`,
    description: 'Adulte: 8 CHF, Enfant: 5 CHF, -4 ans: Gratuit, Max: 25 CHF.',
    category: 'sport',
    schedule: 'Dimanches 17h-19h',
    level: 'tous',
    age_group: 'famille',
    max_participants: 50,
    price: 8,
    pricing: {
      adult_price: 8,
      child_price: 5,
      child_free_until_age: 3,
      group_discount: { enabled: false, from_persons: 4, discount_percent: 0 },
      family_max_price: 25,
      early_bird: { enabled: false, until_date: null, discount_percent: 0 },
    },
    active: true,
    enrollment_open: true,
  },

  // 10. Complet
  {
    title: '📕 Arabe niveau 2 (COMPLET)',
    slug: `arabe-n2-${Date.now()}`,
    description: 'COMPLET - Liste d\'attente.',
    category: 'langue',
    schedule: 'Mercredis 19h-20h30',
    level: 'intermediaire',
    age_group: 'adultes',
    max_participants: 15,
    price: 40,
    active: true,
    enrollment_open: false, // Complet
  },
]

// ========================================
// SCRIPT PRINCIPAL
// ========================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     🚀 CRÉATION DES DONNÉES DE TEST                        ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  if (!DIRECTUS_TOKEN) {
    console.error('❌ Variable DIRECTUS_TOKEN requise\n')
    console.log('Usage:')
    console.log('DIRECTUS_TOKEN="votre-token" npx tsx scripts/create-all-test-data.ts\n')
    console.log('Pour obtenir un token, connectez-vous à Directus et allez dans Settings > Access Tokens')
    process.exit(1)
  }

  console.log('🔐 Connexion à Directus avec token...')
  console.log(`📍 URL: ${DIRECTUS_URL}\n`)

  let eventsCreated = 0, eventsErrors = 0
  let activitiesCreated = 0, activitiesErrors = 0

  // Créer les événements
  console.log('📅 ÉVÉNEMENTS')
  console.log('─'.repeat(50))
  for (const event of testEvents) {
    try {
      const result = await client.request(createItem('events', event))
      console.log(`✅ ${event.title}`)
      eventsCreated++
    } catch (e: any) {
      console.log(`❌ ${event.title}: ${e.message?.substring(0, 50) || 'Erreur'}`)
      eventsErrors++
    }
  }

  console.log('')

  // Créer les activités
  console.log('📚 ACTIVITÉS')
  console.log('─'.repeat(50))
  for (const activity of testActivities) {
    try {
      const result = await client.request(createItem('activities', activity))
      console.log(`✅ ${activity.title}`)
      activitiesCreated++
    } catch (e: any) {
      console.log(`❌ ${activity.title}: ${e.message?.substring(0, 50) || 'Erreur'}`)
      activitiesErrors++
    }
  }

  // Résumé
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║     📊 RÉSUMÉ                                              ║')
  console.log('╠════════════════════════════════════════════════════════════╣')
  console.log(`║  📅 Événements créés: ${eventsCreated}/${testEvents.length}                              ║`)
  console.log(`║  📚 Activités créées: ${activitiesCreated}/${testActivities.length}                              ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')

  console.log('\n🎉 Terminé!\n')
  console.log('📍 Voir les événements: http://localhost:3000/admin/evenements-gestion')
  console.log('📍 Voir les activités:  http://localhost:3000/activites')
}

main().catch(console.error)
