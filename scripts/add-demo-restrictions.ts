/**
 * Script pour ajouter des événements et activités de DÉMO
 * avec TOUTES les possibilités de restrictions
 *
 * Usage: DIRECTUS_ADMIN_TOKEN="your_token" npx tsx scripts/add-demo-restrictions.ts
 */

const DIRECTUS_URL = 'http://localhost:8055'
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || ''

if (!DIRECTUS_ADMIN_TOKEN) {
  console.error('❌ DIRECTUS_ADMIN_TOKEN requis!')
  console.log('\nUsage:')
  console.log('DIRECTUS_ADMIN_TOKEN="your_token" npx tsx scripts/add-demo-restrictions.ts')
  process.exit(1)
}

// Helper pour créer un slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper pour générer une date future
function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// ======================= ÉVÉNEMENTS DE DÉMO =======================

const demoEvents = [
  {
    title: '🎉 DÉMO: Sortie Familiale au Parc',
    slug: 'demo-sortie-familiale',
    description: 'EXEMPLE de sortie familiale avec restriction FAMILY',
    content: 'Pique-nique en famille au Parc de la Suze. Apportez votre pique-nique!',
    category: 'communaute',
    date: getFutureDate(14),
    start_time: '10:00',
    end_time: '16:00',
    location: 'Parc de la Suze, Bienne',
    registration_required: true,
    max_capacity: 100,
    requires_approval: false,
    published: true,
    featured: true,
    restrictions: {
      enabled: true,
      participation_type: 'FAMILY',
      allowed_gender: 'ALL',
      min_age: null,
      max_age: null
    }
  },
  {
    title: '👩 DÉMO: Conférence - Femmes Adultes',
    slug: 'demo-conference-femmes',
    description: 'EXEMPLE de conférence réservée aux femmes de 18 ans et plus',
    content: 'Conférence sur la spiritualité et la vie moderne.',
    category: 'religieux',
    date: getFutureDate(10),
    start_time: '19:00',
    end_time: '21:00',
    location: 'Salle de conférence',
    registration_required: true,
    max_capacity: 50,
    requires_approval: false,
    published: true,
    featured: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'FEMALE',
      min_age: 18,
      max_age: null
    }
  },
  {
    title: '👨 DÉMO: Discussion - Hommes 16+',
    slug: 'demo-discussion-hommes',
    description: 'EXEMPLE de discussion réservée aux hommes de 16 ans et plus',
    content: 'Discussion sur les défis de la foi dans la société moderne.',
    category: 'religieux',
    date: getFutureDate(12),
    start_time: '20:00',
    end_time: '22:00',
    location: 'Salle principale',
    registration_required: true,
    max_capacity: 40,
    requires_approval: false,
    published: true,
    featured: false,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'MALE',
      min_age: 16,
      max_age: null
    }
  },
  {
    title: '🧒 DÉMO: Camp d\'Été Enfants 8-14 ans',
    slug: 'demo-camp-ete-enfants',
    description: 'EXEMPLE de camp réservé aux enfants de 8 à 14 ans',
    content: 'Camp d\'été avec activités sportives, jeux et apprentissage du Coran.',
    category: 'education',
    date: getFutureDate(30),
    start_time: '09:00',
    end_time: '17:00',
    location: 'Centre de loisirs',
    registration_required: true,
    max_capacity: 30,
    requires_approval: true,
    published: true,
    featured: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'CHILD',
      min_age: 8,
      max_age: 14
    }
  },
  {
    title: '🕌 DÉMO: Hajj - Adultes 18+',
    slug: 'demo-hajj',
    description: 'EXEMPLE de voyage Hajj - MIXED (individuel ou famille)',
    content: 'Organisation du pèlerinage à La Mecque. Inscriptions individuelles ou en famille acceptées.',
    category: 'religieux',
    date: getFutureDate(90),
    start_time: '06:00',
    end_time: '23:59',
    location: 'La Mecque, Arabie Saoudite',
    registration_required: true,
    max_capacity: 40,
    requires_approval: true,
    published: true,
    featured: true,
    restrictions: {
      enabled: true,
      participation_type: 'MIXED',
      allowed_gender: 'ALL',
      min_age: 18,
      max_age: null
    }
  },
  {
    title: '👴 DÉMO: Sortie Seniors 60+',
    slug: 'demo-sortie-seniors',
    description: 'EXEMPLE de sortie pour les aînés de 60 ans et plus',
    content: 'Sortie culturelle au musée et déjeuner ensemble.',
    category: 'communaute',
    date: getFutureDate(20),
    start_time: '10:00',
    end_time: '15:00',
    location: 'Musée de Berne',
    registration_required: true,
    max_capacity: 25,
    requires_approval: false,
    published: true,
    featured: false,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'ALL',
      min_age: 60,
      max_age: null
    }
  },
  {
    title: '📖 DÉMO: Iftar Communautaire - Ouvert à Tous',
    slug: 'demo-iftar-ouvert',
    description: 'EXEMPLE d\'événement SANS restriction',
    content: 'Iftar communautaire ouvert à tous, familles et individus bienvenus.',
    category: 'communaute',
    date: getFutureDate(7),
    start_time: '18:30',
    end_time: '21:00',
    location: 'Grande salle',
    registration_required: true,
    max_capacity: 150,
    requires_approval: false,
    published: true,
    featured: true,
    restrictions: {
      enabled: false
    }
  },
  {
    title: '💍 DÉMO: Préparation au Mariage - Couples',
    slug: 'demo-preparation-mariage',
    description: 'EXEMPLE de cours pour couples (FAMILY, 18+)',
    content: 'Cours de préparation au mariage selon l\'islam. Inscription en couple (2 adultes).',
    category: 'education',
    date: getFutureDate(25),
    start_time: '14:00',
    end_time: '17:00',
    location: 'Salle de formation',
    registration_required: true,
    max_capacity: 20,
    requires_approval: true,
    published: true,
    featured: false,
    restrictions: {
      enabled: true,
      participation_type: 'FAMILY',
      allowed_gender: 'ALL',
      min_age: 18,
      max_age: null
    }
  }
]

// ======================= ACTIVITÉS DE DÉMO =======================

const demoActivities = [
  {
    title: '📚 DÉMO: Cours d\'Arabe - Enfants Débutants 6-10 ans',
    slug: 'demo-arabe-enfants-debutants',
    category: 'arabe',
    description: 'EXEMPLE de cours réservé aux enfants de 6 à 10 ans',
    content: 'Apprentissage de l\'alphabet arabe et vocabulaire de base.',
    level: 'Débutant',
    age_group: '6-10 ans',
    schedule: 'Samedi 10h-11h',
    instructor: 'Ustadh Ahmed',
    max_participants: 15,
    requires_approval: true,
    price: 50,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'ALL',
      min_age: 6,
      max_age: 10
    }
  },
  {
    title: '📖 DÉMO: Cours de Coran - Enfants 7-12 ans',
    slug: 'demo-coran-enfants',
    category: 'coran',
    description: 'EXEMPLE de cours Coran pour enfants de 7 à 12 ans',
    content: 'Mémorisation et récitation du Coran avec tajwid.',
    level: 'Tous niveaux',
    age_group: '7-12 ans',
    schedule: 'Dimanche 9h-10h30',
    instructor: 'Cheikh Mohammed',
    max_participants: 20,
    requires_approval: false,
    price: 40,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'CHILD',
      min_age: 7,
      max_age: 12
    }
  },
  {
    title: '🕌 DÉMO: Cours de Fiqh - Femmes Adultes',
    slug: 'demo-fiqh-femmes',
    category: 'autre',
    description: 'EXEMPLE de cours réservé aux femmes de 18 ans et plus',
    content: 'Étude de la jurisprudence islamique (Fiqh) selon l\'école Malikite.',
    level: 'Intermédiaire',
    age_group: 'Adultes',
    schedule: 'Mercredi 19h-20h30',
    instructor: 'Oumm Khadija',
    max_participants: 25,
    requires_approval: false,
    price: 0,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'FEMALE',
      min_age: 18,
      max_age: null
    }
  },
  {
    title: '🎵 DÉMO: Tajwid - Hommes 15+',
    slug: 'demo-tajwid-hommes',
    category: 'tajweed',
    description: 'EXEMPLE de cours Tajwid pour hommes de 15 ans et plus',
    content: 'Perfectionnement de la récitation coranique avec les règles de tajwid.',
    level: 'Avancé',
    age_group: 'Adolescents et Adultes',
    schedule: 'Jeudi 20h-21h30',
    instructor: 'Qari Youssef',
    max_participants: 12,
    requires_approval: true,
    price: 60,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'MALE',
      min_age: 15,
      max_age: null
    }
  },
  {
    title: '🌟 DÉMO: École du Dimanche - Petits 5-8 ans',
    slug: 'demo-ecole-dimanche',
    category: 'ecole',
    description: 'EXEMPLE d\'éveil religieux pour enfants de 5 à 8 ans',
    content: 'Histoires des prophètes, bases de la foi, et activités ludiques.',
    level: 'Débutant',
    age_group: '5-8 ans',
    schedule: 'Dimanche 14h-15h30',
    instructor: 'Oumm Aisha',
    max_participants: 18,
    requires_approval: false,
    price: 0,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'CHILD',
      min_age: 5,
      max_age: 8
    }
  },
  {
    title: '📝 DÉMO: Arabe Adultes - Tous Niveaux',
    slug: 'demo-arabe-adultes',
    category: 'arabe',
    description: 'EXEMPLE de cours pour adultes de 18 ans et plus',
    content: 'Cours de langue arabe pour adultes, tous niveaux acceptés.',
    level: 'Tous niveaux',
    age_group: 'Adultes',
    schedule: 'Mardi 19h-20h30',
    instructor: 'Ustadh Omar',
    max_participants: 20,
    requires_approval: false,
    price: 80,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'ALL',
      min_age: 18,
      max_age: null
    }
  },
  {
    title: '⚽ DÉMO: Sport - Jeunes Hommes 12-25 ans',
    slug: 'demo-sport-jeunes',
    category: 'autre',
    description: 'EXEMPLE d\'activité sportive pour jeunes frères',
    content: 'Football et basketball entre frères. Créer des liens et rester en forme.',
    level: 'Tous niveaux',
    age_group: '12-25 ans',
    schedule: 'Samedi 16h-18h',
    instructor: 'Frère Bilal',
    max_participants: 30,
    requires_approval: false,
    price: 0,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'INDIVIDUAL',
      allowed_gender: 'MALE',
      min_age: 12,
      max_age: 25
    }
  },
  {
    title: '🍲 DÉMO: Atelier Cuisine - Familles',
    slug: 'demo-cuisine-familles',
    category: 'autre',
    description: 'EXEMPLE d\'atelier en famille',
    content: 'Atelier cuisine en famille. Préparez des plats traditionnels ensemble!',
    level: 'Débutant',
    age_group: 'Tous âges',
    schedule: 'Samedi une fois par mois 14h-17h',
    instructor: 'Oumm Fatima',
    max_participants: 40,
    requires_approval: true,
    price: 20,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'FAMILY',
      allowed_gender: 'ALL',
      min_age: null,
      max_age: null
    }
  },
  {
    title: '🌙 DÉMO: Cours Intensif Ramadan - MIXED',
    slug: 'demo-ramadan-intensif',
    category: 'coran',
    description: 'EXEMPLE de cours MIXED (individuel ou famille)',
    content: 'Cours intensif durant Ramadan. Inscriptions individuelles ou familiales.',
    level: 'Tous niveaux',
    age_group: '10 ans et plus',
    schedule: 'Quotidien durant Ramadan 17h-18h',
    instructor: 'Équipe pédagogique',
    max_participants: 50,
    requires_approval: false,
    price: 0,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: true,
      participation_type: 'MIXED',
      allowed_gender: 'ALL',
      min_age: 10,
      max_age: null
    }
  },
  {
    title: '📚 DÉMO: Halaqat - Ouvert à Tous',
    slug: 'demo-halaqat-ouvert',
    category: 'halaqat',
    description: 'EXEMPLE d\'activité SANS restriction',
    content: 'Cercle d\'étude du Coran et Hadith, ouvert à tous.',
    level: 'Tous niveaux',
    age_group: 'Tous âges',
    schedule: 'Vendredi après Asr',
    instructor: 'Imam de la mosquée',
    max_participants: 100,
    requires_approval: false,
    price: 0,
    active: true,
    enrollment_open: true,
    restrictions: {
      enabled: false
    }
  }
]

// ======================= FONCTION PRINCIPALE =======================

async function createDemoData() {
  console.log('🚀 Création des données de DÉMO avec restrictions\n')
  console.log('📍 URL Directus:', DIRECTUS_URL)
  console.log('🔑 Token:', DIRECTUS_ADMIN_TOKEN.substring(0, 20) + '...\n')

  let successCount = 0
  let errorCount = 0

  // ============ CRÉER LES ÉVÉNEMENTS ============
  console.log('📅 CRÉATION DES ÉVÉNEMENTS DE DÉMO\n')

  for (const event of demoEvents) {
    try {
      const response = await fetch(`${DIRECTUS_URL}/items/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`
        },
        body: JSON.stringify(event)
      })

      if (response.ok) {
        console.log(`✅ ${event.title}`)
        successCount++
      } else {
        const error = await response.text()
        console.log(`❌ ${event.title}`)
        console.log(`   Erreur: ${error}\n`)
        errorCount++
      }
    } catch (error) {
      console.log(`❌ ${event.title}`)
      console.log(`   Erreur: ${error}\n`)
      errorCount++
    }
  }

  console.log('\n🎓 CRÉATION DES ACTIVITÉS DE DÉMO\n')

  // ============ CRÉER LES ACTIVITÉS ============
  for (const activity of demoActivities) {
    try {
      const response = await fetch(`${DIRECTUS_URL}/items/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`
        },
        body: JSON.stringify(activity)
      })

      if (response.ok) {
        console.log(`✅ ${activity.title}`)
        successCount++
      } else {
        const error = await response.text()
        console.log(`❌ ${activity.title}`)
        console.log(`   Erreur: ${error}\n`)
        errorCount++
      }
    } catch (error) {
      console.log(`❌ ${activity.title}`)
      console.log(`   Erreur: ${error}\n`)
      errorCount++
    }
  }

  // ============ RÉSUMÉ ============
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ')
  console.log('='.repeat(60))
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`📝 Total: ${demoEvents.length + demoActivities.length}`)
  console.log('='.repeat(60) + '\n')

  if (successCount > 0) {
    console.log('🎉 Données de démo créées avec succès!')
    console.log('\n📋 PROCHAINES ÉTAPES:')
    console.log('1. Visitez http://localhost:8055')
    console.log('2. Allez dans Content → events (voir les 8 événements)')
    console.log('3. Allez dans Content → activities (voir les 10 activités)')
    console.log('4. Chaque item a un champ "restrictions" avec différentes configurations\n')
  }
}

// Exécuter
createDemoData()
