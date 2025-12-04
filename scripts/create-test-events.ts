/**
 * Script pour créer des événements de test avec différents scénarios
 *
 * Usage: DIRECTUS_ADMIN_EMAIL=admin@mosquee.ch DIRECTUS_ADMIN_PASSWORD=mosquee2024! npx tsx scripts/create-test-events.ts
 */

import { createDirectus, rest, createItem, authentication } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'

// Client Directus avec authentification
const client = createDirectus(DIRECTUS_URL)
  .with(authentication())
  .with(rest())

// ========================================
// MODÈLES D'ÉVÉNEMENTS DE TEST
// ========================================

const testEvents = [
  // 1. ÉVÉNEMENT GRATUIT SIMPLE
  {
    title: '🕌 Prière du Vendredi - Test',
    slug: 'priere-vendredi-test',
    description: 'Prière du vendredi avec sermon. Événement gratuit sans inscription.',
    content: 'Rejoignez-nous pour la prière du vendredi. Sermon à 12h30, prière à 13h00.',
    category: 'religieux',
    date: getFutureDate(7), // Dans 7 jours
    start_time: '12:30',
    end_time: '14:00',
    location: 'Salle de prière principale',
    registration_required: false,
    payment_type: 'FREE',
    published: true,
    featured: false,
  },

  // 2. ÉVÉNEMENT GRATUIT AVEC INSCRIPTION
  {
    title: '📚 Cours d\'arabe débutant - Test',
    slug: 'cours-arabe-debutant-test',
    description: 'Cours d\'initiation à la langue arabe. Gratuit mais inscription obligatoire.',
    content: 'Apprenez les bases de l\'alphabet arabe et les premières expressions. Matériel fourni.',
    category: 'education',
    date: getFutureDate(14),
    start_time: '18:00',
    end_time: '19:30',
    location: 'Salle de classe 1',
    registration_required: true,
    max_capacity: 20,
    registration_deadline: getFutureDate(12),
    requires_approval: false,
    payment_type: 'FREE',
    published: true,
    featured: false,
  },

  // 3. ÉVÉNEMENT PAYANT SIMPLE (prix unique)
  {
    title: '🍽️ Iftar communautaire - Test',
    slug: 'iftar-communautaire-test',
    description: 'Repas de rupture du jeûne. Prix unique par personne.',
    content: 'Venez partager un repas convivial pour rompre le jeûne ensemble. Menu traditionnel.',
    category: 'communaute',
    date: getFutureDate(10),
    start_time: '19:30',
    end_time: '21:30',
    location: 'Salle polyvalente',
    registration_required: true,
    max_capacity: 100,
    registration_deadline: getFutureDate(8),
    requires_approval: false,
    payment_type: 'ONE_TIME',
    price: 15, // 15 CHF par personne
    allow_refund: true,
    cancellation_deadline_days: 3,
    published: true,
    featured: true,
  },

  // 4. ÉVÉNEMENT FAMILLE AVEC TARIFICATION AVANCÉE
  {
    title: '🎢 Sortie familiale au parc - Test',
    slug: 'sortie-familiale-parc-test',
    description: 'Journée en famille au parc d\'attractions. Tarifs famille avantageux!',
    content: `
Journée exceptionnelle pour toute la famille!

**Tarifs:**
- Adulte: 45 CHF
- Enfant (6-17 ans): 25 CHF
- Enfants de moins de 6 ans: GRATUIT
- Plafond famille: 120 CHF maximum (peu importe le nombre)

**Inclus:**
- Transport en bus
- Entrée au parc
- Pique-nique

Réservez vite, places limitées!
    `.trim(),
    category: 'communaute',
    date: getFutureDate(21),
    start_time: '08:00',
    end_time: '18:00',
    location: 'Départ: Parking mosquée',
    registration_required: true,
    max_capacity: 50,
    registration_deadline: getFutureDate(14),
    requires_approval: false,
    payment_type: 'ONE_TIME',
    price: 45, // Prix de base (fallback)
    pricing: {
      adult_price: 45,
      child_price: 25,
      child_free_until_age: 5, // Gratuit jusqu'à 5 ans inclus
      group_discount: {
        enabled: true,
        from_persons: 5,
        discount_percent: 10,
      },
      family_max_price: 120, // Plafond famille
      early_bird: {
        enabled: true,
        until_date: getFutureDate(7), // -15% si inscription dans 7 jours
        discount_percent: 15,
      },
    },
    restrictions: {
      enabled: true,
      participation_type: 'FAMILY', // Famille uniquement
      allowed_gender: 'ALL',
      min_age: null,
      max_age: null,
    },
    allow_refund: true,
    cancellation_deadline_days: 7,
    published: true,
    featured: true,
  },

  // 5. ÉVÉNEMENT AVEC APPROBATION REQUISE
  {
    title: '🎓 Formation imam - Test',
    slug: 'formation-imam-test',
    description: 'Formation intensive pour futurs imams. Sur sélection uniquement.',
    content: `
Formation de 3 jours pour les candidats à l'imamat.

**Prérequis:**
- Avoir mémorisé au moins 10 juz du Coran
- Maîtrise de l'arabe littéraire
- Lettre de motivation obligatoire

**Programme:**
- Sciences islamiques
- Techniques de prêche
- Gestion de communauté

Chaque candidature sera examinée individuellement.
    `.trim(),
    category: 'education',
    date: getFutureDate(30),
    start_time: '09:00',
    end_time: '17:00',
    location: 'Salle de conférence',
    registration_required: true,
    max_capacity: 15,
    registration_deadline: getFutureDate(20),
    requires_approval: true, // Approbation manuelle requise
    payment_type: 'ONE_TIME',
    price: 150,
    allow_refund: true,
    cancellation_deadline_days: 14,
    published: true,
    featured: false,
  },

  // 6. ÉVÉNEMENT RÉSERVÉ AUX FEMMES
  {
    title: '👩 Cercle d\'étude femmes - Test',
    slug: 'cercle-etude-femmes-test',
    description: 'Cercle d\'étude et de partage réservé aux femmes.',
    content: 'Un moment privilégié entre soeurs pour étudier le Coran et échanger.',
    category: 'religieux',
    date: getFutureDate(5),
    start_time: '14:00',
    end_time: '16:00',
    location: 'Salle des femmes',
    registration_required: true,
    max_capacity: 30,
    requires_approval: false,
    payment_type: 'FREE',
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'FEMALE', // Femmes uniquement
      min_age: 16,
      max_age: null,
    },
    published: true,
    featured: false,
  },

  // 7. ÉVÉNEMENT RÉSERVÉ AUX HOMMES
  {
    title: '👨 Retraite spirituelle hommes - Test',
    slug: 'retraite-spirituelle-hommes-test',
    description: 'Week-end de retraite spirituelle pour les frères.',
    content: `
Week-end de recueillement et de méditation.

**Programme:**
- Prières en commun
- Méditation
- Cours de spiritualité
- Repas partagés

Hébergement sur place inclus.
    `.trim(),
    category: 'religieux',
    date: getFutureDate(28),
    start_time: '18:00',
    end_time: '18:00', // Jour suivant
    location: 'Centre de retraite',
    registration_required: true,
    max_capacity: 25,
    registration_deadline: getFutureDate(21),
    requires_approval: false,
    payment_type: 'ONE_TIME',
    price: 80,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'MALE', // Hommes uniquement
      min_age: 18,
      max_age: null,
    },
    allow_refund: true,
    cancellation_deadline_days: 7,
    published: true,
    featured: false,
  },

  // 8. ÉVÉNEMENT POUR ENFANTS
  {
    title: '🧒 Atelier créatif enfants - Test',
    slug: 'atelier-creatif-enfants-test',
    description: 'Atelier d\'arts plastiques pour les enfants de 6 à 12 ans.',
    content: 'Vos enfants apprendront à créer des décorations islamiques. Matériel fourni.',
    category: 'education',
    date: getFutureDate(12),
    start_time: '14:00',
    end_time: '16:00',
    location: 'Salle d\'activités',
    registration_required: true,
    max_capacity: 15,
    requires_approval: false,
    payment_type: 'ONE_TIME',
    price: 10,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'CHILD',
      min_age: 6,
      max_age: 12,
    },
    allow_refund: true,
    cancellation_deadline_days: 2,
    published: true,
    featured: false,
  },

  // 9. ABONNEMENT MENSUEL
  {
    title: '📖 Cours de Coran hebdomadaire - Test',
    slug: 'cours-coran-hebdomadaire-test',
    description: 'Cours de mémorisation du Coran chaque semaine. Abonnement mensuel.',
    content: `
Cours hebdomadaire de mémorisation et récitation du Coran.

**Horaires:** Tous les samedis de 10h à 12h
**Niveaux:** Tous niveaux acceptés
**Tarif:** 50 CHF/mois

L'abonnement est renouvelé automatiquement chaque mois.
    `.trim(),
    category: 'education',
    date: getFutureDate(3),
    start_time: '10:00',
    end_time: '12:00',
    location: 'Salle de classe 2',
    registration_required: true,
    max_capacity: 20,
    requires_approval: false,
    payment_type: 'SUBSCRIPTION',
    price: 50,
    subscription_interval: 'MONTHLY',
    allow_refund: false,
    published: true,
    featured: false,
  },

  // 10. ÉVÉNEMENT MIXTE (Individuel ou Famille)
  {
    title: '🌙 Soirée de l\'Aïd - Test',
    slug: 'soiree-aid-test',
    description: 'Grande soirée festive pour célébrer l\'Aïd. Venez seul ou en famille!',
    content: `
Célébrons ensemble cette fête bénie!

**Programme:**
- 18h00: Accueil et jeux pour enfants
- 19h00: Animation et spectacles
- 20h00: Dîner festif
- 21h30: Distribution de cadeaux aux enfants

**Tarifs:**
- Adulte: 20 CHF
- Enfant (4-14 ans): 10 CHF
- Moins de 4 ans: Gratuit
- Maximum famille: 60 CHF
    `.trim(),
    category: 'communaute',
    date: getFutureDate(45),
    start_time: '18:00',
    end_time: '22:00',
    location: 'Salle des fêtes',
    registration_required: true,
    max_capacity: 200,
    registration_deadline: getFutureDate(40),
    requires_approval: false,
    payment_type: 'ONE_TIME',
    price: 20,
    pricing: {
      adult_price: 20,
      child_price: 10,
      child_free_until_age: 3,
      group_discount: {
        enabled: false,
        from_persons: 4,
        discount_percent: 0,
      },
      family_max_price: 60,
      early_bird: {
        enabled: false,
        until_date: null,
        discount_percent: 0,
      },
    },
    restrictions: {
      enabled: true,
      participation_type: 'MIXED', // Individuel ou famille
      allowed_gender: 'ALL',
      min_age: null,
      max_age: null,
    },
    allow_refund: true,
    cancellation_deadline_days: 5,
    published: true,
    featured: true,
  },
]

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .trim()
}

// ========================================
// SCRIPT PRINCIPAL
// ========================================

async function main() {
  console.log('🚀 Création des événements de test...\n')

  // Authentification
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('❌ Erreur: Variables DIRECTUS_ADMIN_EMAIL et DIRECTUS_ADMIN_PASSWORD requises')
    console.log('\nUsage:')
    console.log('DIRECTUS_ADMIN_EMAIL=admin@mosquee.ch DIRECTUS_ADMIN_PASSWORD=mosquee2024! npx tsx scripts/create-test-events.ts')
    process.exit(1)
  }

  try {
    console.log('🔐 Authentification Directus...')
    await client.login(email, password)
    console.log('✅ Connecté à Directus\n')
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error)
    process.exit(1)
  }

  // Créer les événements
  let created = 0
  let errors = 0

  for (const eventData of testEvents) {
    try {
      console.log(`📅 Création: ${eventData.title}`)

      const event = await client.request(
        createItem('events', eventData)
      )

      console.log(`   ✅ Créé avec ID: ${event.id}`)
      created++
    } catch (error: any) {
      console.log(`   ❌ Erreur: ${error.message || error}`)
      errors++
    }
  }

  // Résumé
  console.log('\n' + '='.repeat(50))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(50))
  console.log(`✅ Événements créés: ${created}`)
  console.log(`❌ Erreurs: ${errors}`)
  console.log(`📝 Total tenté: ${testEvents.length}`)

  console.log('\n🎉 Terminé!')
  console.log('\n📍 Accédez à http://localhost:3000/admin/evenements-gestion pour voir les événements')
}

main().catch(console.error)
