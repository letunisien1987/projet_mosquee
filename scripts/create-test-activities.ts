/**
 * Script pour créer des activités de test avec différents scénarios
 *
 * Usage: DIRECTUS_ADMIN_EMAIL=admin@mosquee.ch DIRECTUS_ADMIN_PASSWORD=mosquee2024! npx tsx scripts/create-test-activities.ts
 */

import { createDirectus, rest, createItem, authentication } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'

// Client Directus avec authentification
const client = createDirectus(DIRECTUS_URL)
  .with(authentication())
  .with(rest())

// ========================================
// MODÈLES D'ACTIVITÉS DE TEST
// ========================================

const testActivities = [
  // 1. COURS GRATUIT POUR ADULTES
  {
    title: '📚 Cours d\'arabe niveau 1 - Test',
    slug: 'cours-arabe-niveau-1-test',
    description: 'Initiation à la langue arabe pour débutants. Cours gratuit.',
    content: `
**Objectifs du cours:**
- Apprendre l'alphabet arabe
- Maîtriser les voyelles courtes et longues
- Lire des mots simples
- Vocabulaire de base (50 mots)

**Prérequis:** Aucun

**Horaires:** Tous les lundis de 19h à 20h30
    `.trim(),
    category: 'langue',
    instructor: 'Professeur Ahmed',
    instructor_email: 'ahmed@mosquee.ch',
    schedule: 'Lundis 19h-20h30',
    start_date: getFutureDate(7),
    end_date: getFutureDate(90), // 3 mois
    location: 'Salle de classe 1',
    max_participants: 20,
    min_age: 16,
    max_age: null,
    gender: 'ALL',
    requires_approval: false,
    payment_type: 'FREE',
    status: 'OPEN',
    published: true,
  },

  // 2. COURS PAYANT MENSUEL (Abonnement)
  {
    title: '📖 École coranique enfants - Test',
    slug: 'ecole-coranique-enfants-test',
    description: 'Cours de Coran et d\'éducation islamique pour enfants.',
    content: `
**Programme:**
- Mémorisation du Coran (Juz Amma)
- Règles de tajwid simplifiées
- Éducation islamique adaptée
- Histoires des prophètes

**Horaires:**
- Mercredi: 14h-16h
- Samedi: 10h-12h

**Tarif:** 80 CHF/mois
    `.trim(),
    category: 'coran',
    instructor: 'Imam Hassan',
    instructor_email: 'hassan@mosquee.ch',
    schedule: 'Mercredis 14h-16h, Samedis 10h-12h',
    start_date: getFutureDate(14),
    end_date: getFutureDate(180), // 6 mois
    location: 'Salle des enfants',
    max_participants: 25,
    min_age: 6,
    max_age: 14,
    gender: 'ALL',
    requires_approval: false,
    payment_type: 'SUBSCRIPTION',
    price: 80,
    subscription_interval: 'MONTHLY',
    pricing: {
      adult_price: 80, // Même prix pour tous (enfants dans ce cas)
      child_price: 80,
      child_free_until_age: 0,
      group_discount: {
        enabled: true,
        from_persons: 2, // Réduction fratrie
        discount_percent: 15, // -15% pour le 2e enfant
      },
      family_max_price: 140, // Max 140 CHF pour une fratrie
      early_bird: {
        enabled: false,
        until_date: null,
        discount_percent: 0,
      },
    },
    status: 'OPEN',
    published: true,
  },

  // 3. COURS PAYANT UNIQUE (Trimestre)
  {
    title: '🎨 Calligraphie arabe - Test',
    slug: 'calligraphie-arabe-test',
    description: 'Apprenez l\'art de la calligraphie islamique. Cours trimestriel.',
    content: `
**Programme sur 12 semaines:**
- Semaines 1-4: Bases du Naskh
- Semaines 5-8: Style Thuluth
- Semaines 9-12: Projet personnel

**Matériel inclus:**
- Qalam (calame)
- Encre spéciale
- Papier adapté
- Manuel de cours

**Tarif:** 250 CHF pour le trimestre complet
    `.trim(),
    category: 'art',
    instructor: 'Maître Karim',
    instructor_email: 'karim@mosquee.ch',
    schedule: 'Samedis 14h-16h',
    start_date: getFutureDate(21),
    end_date: getFutureDate(105), // 12 semaines
    location: 'Atelier d\'art',
    max_participants: 12,
    min_age: 14,
    max_age: null,
    gender: 'ALL',
    requires_approval: false,
    payment_type: 'ONE_TIME',
    price: 250,
    allow_refund: true,
    cancellation_deadline_days: 14,
    status: 'OPEN',
    published: true,
  },

  // 4. COURS RÉSERVÉ AUX FEMMES
  {
    title: '👩 Tajwid pour femmes - Test',
    slug: 'tajwid-femmes-test',
    description: 'Cours de récitation coranique réservé aux soeurs.',
    content: `
**Programme:**
- Règles de prononciation
- Points d'articulation (makharij)
- Caractéristiques des lettres (sifat)
- Règles de liaison et d'arrêt

**Enseignante:** Soeur Fatima, ijaza en tajwid

**Ambiance:** Cours dans un cadre bienveillant entre soeurs
    `.trim(),
    category: 'coran',
    instructor: 'Soeur Fatima',
    instructor_email: 'fatima@mosquee.ch',
    schedule: 'Mardis et Jeudis 10h-11h30',
    start_date: getFutureDate(10),
    end_date: getFutureDate(100),
    location: 'Salle des femmes',
    max_participants: 15,
    min_age: 18,
    max_age: null,
    gender: 'FEMALE', // Femmes uniquement
    requires_approval: false,
    payment_type: 'SUBSCRIPTION',
    price: 60,
    subscription_interval: 'MONTHLY',
    status: 'OPEN',
    published: true,
  },

  // 5. COURS RÉSERVÉ AUX HOMMES
  {
    title: '👨 Fiqh appliqué hommes - Test',
    slug: 'fiqh-applique-hommes-test',
    description: 'Cours de jurisprudence islamique pour les frères.',
    content: `
**Thèmes abordés:**
- Purification (taharah)
- Prière (salat) en détail
- Jeûne (siyam)
- Zakat et aumônes
- Pèlerinage (hajj)

**Méthodologie:** École Malikite avec références aux autres écoles

**Enseignant:** Cheikh Omar, diplômé d'Al-Azhar
    `.trim(),
    category: 'religion',
    instructor: 'Cheikh Omar',
    instructor_email: 'omar@mosquee.ch',
    schedule: 'Vendredis 20h-21h30',
    start_date: getFutureDate(5),
    end_date: getFutureDate(150),
    location: 'Salle de conférence',
    max_participants: 40,
    min_age: 16,
    max_age: null,
    gender: 'MALE', // Hommes uniquement
    requires_approval: false,
    payment_type: 'FREE',
    status: 'OPEN',
    published: true,
  },

  // 6. ACTIVITÉ SPORTIVE ENFANTS
  {
    title: '⚽ Football enfants - Test',
    slug: 'football-enfants-test',
    description: 'Entraînement de football pour les garçons de 8 à 14 ans.',
    content: `
**Programme:**
- Technique individuelle
- Jeu collectif
- Matchs amicaux
- Valeurs sportives islamiques

**Équipement:** Maillot fourni, apporter chaussures de sport

**Entraîneur:** Coach Youssef, diplômé d'état
    `.trim(),
    category: 'sport',
    instructor: 'Coach Youssef',
    instructor_email: 'youssef@mosquee.ch',
    schedule: 'Dimanches 10h-12h',
    start_date: getFutureDate(7),
    end_date: getFutureDate(180),
    location: 'Terrain de sport municipal',
    max_participants: 20,
    min_age: 8,
    max_age: 14,
    gender: 'MALE', // Garçons
    requires_approval: false,
    payment_type: 'SUBSCRIPTION',
    price: 30,
    subscription_interval: 'MONTHLY',
    status: 'OPEN',
    published: true,
  },

  // 7. ACTIVITÉ POUR FILLES
  {
    title: '🏸 Badminton filles - Test',
    slug: 'badminton-filles-test',
    description: 'Cours de badminton pour les filles de 10 à 16 ans.',
    content: `
**Programme:**
- Apprentissage des règles
- Technique de base
- Entraînements ludiques
- Mini-tournois

**Matériel:** Raquettes fournies

**Encadrement féminin garanti**
    `.trim(),
    category: 'sport',
    instructor: 'Soeur Amina',
    instructor_email: 'amina@mosquee.ch',
    schedule: 'Samedis 16h-18h',
    start_date: getFutureDate(14),
    end_date: getFutureDate(180),
    location: 'Gymnase communal',
    max_participants: 16,
    min_age: 10,
    max_age: 16,
    gender: 'FEMALE', // Filles
    requires_approval: false,
    payment_type: 'SUBSCRIPTION',
    price: 25,
    subscription_interval: 'MONTHLY',
    status: 'OPEN',
    published: true,
  },

  // 8. COURS AVEC APPROBATION REQUISE
  {
    title: '🎓 Formation enseignants Coran - Test',
    slug: 'formation-enseignants-coran-test',
    description: 'Formation pour devenir enseignant de Coran. Sur sélection.',
    content: `
**Prérequis obligatoires:**
- Avoir mémorisé minimum 15 Juz
- Maîtriser les règles de tajwid
- Avoir suivi une formation pédagogique de base
- Lettre de motivation

**Programme (6 mois):**
- Pédagogie adaptée aux enfants
- Gestion de classe
- Méthodes de mémorisation
- Évaluation des élèves
- Stage pratique

**Diplôme délivré en fin de formation**
    `.trim(),
    category: 'formation',
    instructor: 'Dr. Mahmoud',
    instructor_email: 'mahmoud@mosquee.ch',
    schedule: 'Samedis 9h-13h',
    start_date: getFutureDate(30),
    end_date: getFutureDate(210), // 6 mois
    location: 'Salle de formation',
    max_participants: 10,
    min_age: 21,
    max_age: 50,
    gender: 'ALL',
    requires_approval: true, // Sélection sur dossier
    payment_type: 'ONE_TIME',
    price: 500,
    allow_refund: true,
    cancellation_deadline_days: 30,
    status: 'OPEN',
    published: true,
  },

  // 9. ACTIVITÉ FAMILIALE
  {
    title: '🏊 Piscine familiale - Test',
    slug: 'piscine-familiale-test',
    description: 'Créneau piscine réservé aux familles musulmanes.',
    content: `
**Créneau privatisé** pour les familles de notre communauté.

**Horaires:**
- Dimanche: 17h-19h (réservé familles)

**Tarifs:**
- Adulte: 8 CHF
- Enfant (4-16 ans): 5 CHF
- Moins de 4 ans: Gratuit
- Famille (max): 25 CHF

**Règles:**
- Tenue de bain islamique acceptée
- Surveillance parentale obligatoire pour les enfants
    `.trim(),
    category: 'sport',
    instructor: 'Coordination: Famille Benali',
    instructor_email: 'benali@mosquee.ch',
    schedule: 'Dimanches 17h-19h',
    start_date: getFutureDate(7),
    end_date: getFutureDate(365),
    location: 'Piscine municipale',
    max_participants: 50,
    min_age: null,
    max_age: null,
    gender: 'ALL',
    requires_approval: false,
    payment_type: 'ONE_TIME', // Paiement par séance
    price: 8,
    pricing: {
      adult_price: 8,
      child_price: 5,
      child_free_until_age: 3,
      group_discount: {
        enabled: false,
        from_persons: 4,
        discount_percent: 0,
      },
      family_max_price: 25,
      early_bird: {
        enabled: false,
        until_date: null,
        discount_percent: 0,
      },
    },
    status: 'OPEN',
    published: true,
  },

  // 10. COURS COMPLET (plus de places)
  {
    title: '📕 Arabe niveau 2 - Test (COMPLET)',
    slug: 'arabe-niveau-2-test-complet',
    description: 'Cours d\'arabe intermédiaire. COMPLET - Liste d\'attente possible.',
    content: `
**Ce cours est actuellement COMPLET**

Inscrivez-vous sur la liste d'attente pour être contacté en cas de désistement.

**Prérequis:** Avoir suivi le niveau 1 ou équivalent
    `.trim(),
    category: 'langue',
    instructor: 'Professeur Ahmed',
    instructor_email: 'ahmed@mosquee.ch',
    schedule: 'Mercredis 19h-20h30',
    start_date: getFutureDate(7),
    end_date: getFutureDate(90),
    location: 'Salle de classe 2',
    max_participants: 15,
    min_age: 16,
    max_age: null,
    gender: 'ALL',
    requires_approval: false,
    payment_type: 'SUBSCRIPTION',
    price: 40,
    subscription_interval: 'MONTHLY',
    status: 'FULL', // Complet
    published: true,
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

// ========================================
// SCRIPT PRINCIPAL
// ========================================

async function main() {
  console.log('🚀 Création des activités de test...\n')

  // Authentification
  const email = process.env.DIRECTUS_ADMIN_EMAIL
  const password = process.env.DIRECTUS_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('❌ Erreur: Variables DIRECTUS_ADMIN_EMAIL et DIRECTUS_ADMIN_PASSWORD requises')
    console.log('\nUsage:')
    console.log('DIRECTUS_ADMIN_EMAIL=admin@mosquee.ch DIRECTUS_ADMIN_PASSWORD=mosquee2024! npx tsx scripts/create-test-activities.ts')
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

  // Créer les activités
  let created = 0
  let errors = 0

  for (const activityData of testActivities) {
    try {
      console.log(`📚 Création: ${activityData.title}`)

      const activity = await client.request(
        createItem('activities', activityData)
      )

      console.log(`   ✅ Créé avec ID: ${activity.id}`)
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
  console.log(`✅ Activités créées: ${created}`)
  console.log(`❌ Erreurs: ${errors}`)
  console.log(`📝 Total tenté: ${testActivities.length}`)

  console.log('\n🎉 Terminé!')
  console.log('\n📍 Accédez à http://localhost:3000/activites pour voir les activités')
}

main().catch(console.error)
