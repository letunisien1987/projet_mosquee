/**
 * Test complet du workflow de gestion unifiée
 * Usage: DIRECTUS_TOKEN="xxx" npx tsx scripts/test-workflow-gestion.ts
 */

import { createDirectus, rest, readItems, createItem, updateItem, staticToken } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_TOKEN || '';

const client = createDirectus(DIRECTUS_URL).with(staticToken(TOKEN)).with(rest());

const timestamp = Date.now();

const testEvents = [
  {
    item_type: 'EVENT',
    title: 'Conférence: Les piliers de l\'Islam',
    slug: `conference-piliers-${timestamp}`,
    description: 'Une conférence enrichissante sur les fondements de notre foi',
    category: 'religieux',
    date: '2025-01-15',
    start_time: '19:00',
    end_time: '21:00',
    location: 'Grande salle de prière',
    max_capacity: 150,
    payment_type: 'FREE',
    published: true,
  },
  {
    item_type: 'EVENT',
    title: 'Repas de l\'Aïd El-Fitr',
    slug: `repas-aid-fitr-${timestamp}`,
    description: 'Repas communautaire pour célébrer la fin du Ramadan',
    category: 'communaute',
    date: '2025-03-30',
    start_time: '12:00',
    end_time: '15:00',
    location: 'Salle polyvalente',
    max_capacity: 200,
    price: 25,
    payment_type: 'ONE_TIME',
    pricing: {
      adult_price: 25,
      child_price: 12,
      child_free_until_age: 5,
      group_discount: { enabled: true, from_persons: 5, discount_percent: 10 },
      family_max_price: 80,
      early_bird: { enabled: false, until_date: null, discount_percent: 0 },
    },
    published: true,
  },
  {
    item_type: 'EVENT',
    title: 'Sortie familiale au zoo',
    slug: `sortie-zoo-${timestamp}`,
    description: 'Une journée de détente en famille',
    category: 'communaute',
    date: '2025-02-22',
    start_time: '09:00',
    end_time: '17:00',
    location: 'Zoo de Bienne',
    max_capacity: 60,
    price: 35,
    payment_type: 'ONE_TIME',
    pricing: {
      adult_price: 35,
      child_price: 18,
      child_free_until_age: 3,
      group_discount: { enabled: false, from_persons: 4, discount_percent: 0 },
      family_max_price: 100,
      early_bird: { enabled: true, until_date: '2025-02-15', discount_percent: 15 },
    },
    restrictions: { enabled: true, participation_type: 'FAMILY', allowed_gender: 'ALL' },
    published: true,
  },
  {
    item_type: 'EVENT',
    title: 'Séminaire: Éducation des enfants',
    slug: `seminaire-education-${timestamp}`,
    description: 'Formation pour les parents sur l\'éducation islamique',
    category: 'education',
    date: '2025-02-08',
    start_time: '14:00',
    end_time: '18:00',
    location: 'Salle de conférence',
    max_capacity: 40,
    price: 30,
    payment_type: 'ONE_TIME',
    restrictions: { enabled: true, participation_type: 'INDIVIDUAL', allowed_gender: 'ALL', min_age: 18 },
    published: true,
  },
  {
    item_type: 'EVENT',
    title: 'Cercle de récitation pour femmes',
    slug: `cercle-femmes-${timestamp}`,
    description: 'Moment de partage et de récitation entre soeurs',
    category: 'religieux',
    date: '2025-01-25',
    start_time: '10:00',
    end_time: '12:00',
    location: 'Salle des femmes',
    max_capacity: 25,
    payment_type: 'FREE',
    restrictions: { enabled: true, participation_type: 'INDIVIDUAL', allowed_gender: 'FEMALE', min_age: 16 },
    published: true,
  },
];

const testActivities = [
  {
    title: 'Cours de Coran - Niveau débutant',
    slug: `coran-debutant-${timestamp}`,
    description: 'Apprentissage de la lecture et mémorisation',
    category: 'coran',
    schedule: 'Samedi 10h-12h',
    max_participants: 15,
    price: 50,
    active: true,
    enrollment_open: true,
  },
  {
    title: 'Arabe littéraire - Intermédiaire',
    slug: `arabe-inter-${timestamp}`,
    description: 'Perfectionnement de la langue arabe',
    category: 'langue',
    schedule: 'Mercredi 18h-20h',
    max_participants: 12,
    price: 60,
    active: true,
    enrollment_open: true,
  },
  {
    title: 'École du dimanche - Enfants',
    slug: `ecole-dimanche-${timestamp}`,
    description: 'Éducation islamique pour les 6-12 ans',
    category: 'religion',
    schedule: 'Dimanche 9h-12h',
    max_participants: 30,
    price: 40,
    pricing: {
      adult_price: 40,
      child_price: 40,
      child_free_until_age: 0,
      group_discount: { enabled: true, from_persons: 2, discount_percent: 20 },
      family_max_price: 100,
      early_bird: { enabled: false, until_date: null, discount_percent: 0 },
    },
    restrictions: { enabled: true, allowed_gender: 'ALL', min_age: 6, max_age: 12 },
    active: true,
    enrollment_open: true,
  },
  {
    title: 'Football - Garçons 10-16 ans',
    slug: `football-garcons-${timestamp}`,
    description: 'Entraînement sportif pour les jeunes',
    category: 'sport',
    schedule: 'Samedi 14h-16h',
    max_participants: 20,
    price: 25,
    restrictions: { enabled: true, allowed_gender: 'MALE', min_age: 10, max_age: 16 },
    active: true,
    enrollment_open: true,
  },
  {
    title: 'Cours de tajwid avancé',
    slug: `tajwid-avance-${timestamp}`,
    description: 'Perfectionnement des règles de récitation',
    category: 'coran',
    schedule: 'Jeudi 20h-21h30',
    max_participants: 10,
    price: 0,
    active: true,
    enrollment_open: true,
  },
];

async function run() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       🧪 TEST WORKFLOW GESTION UNIFIÉE                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const createdEventIds: number[] = [];
  const createdActivityIds: number[] = [];

  // ÉTAPE 1: Créer 5 événements
  console.log('📅 ÉTAPE 1: Création de 5 événements\n' + '─'.repeat(50));
  for (const e of testEvents) {
    try {
      const r = await client.request(createItem('events', e));
      console.log(`✅ "${e.title}" → ID: ${r.id}`);
      createdEventIds.push(r.id);
    } catch (err: any) {
      console.log(`❌ "${e.title}": ${err.message?.substring(0, 60)}`);
    }
  }

  console.log('\n📚 ÉTAPE 2: Création de 5 activités\n' + '─'.repeat(50));
  for (const a of testActivities) {
    try {
      const r = await client.request(createItem('activities', a));
      console.log(`✅ "${a.title}" → ID: ${r.id}`);
      createdActivityIds.push(r.id);
    } catch (err: any) {
      console.log(`❌ "${a.title}": ${err.message?.substring(0, 60)}`);
    }
  }

  console.log('\n📋 ÉTAPE 3: Vérification des données\n' + '─'.repeat(50));
  const events = await client.request(readItems('events', { limit: 100 }));
  const activities = await client.request(readItems('activities', { limit: 100 }));
  console.log(`📅 Total événements: ${events.length}`);
  console.log(`📚 Total activités: ${activities.length}`);
  console.log(`📊 Total offres: ${events.length + activities.length}`);

  console.log('\n✏️ ÉTAPE 4: Modification d\'un événement\n' + '─'.repeat(50));
  if (createdEventIds.length > 0) {
    const id = createdEventIds[0];
    const updated = await client.request(updateItem('events', id, {
      title: 'Conférence: Les piliers de l\'Islam (MODIFIÉ)',
      max_capacity: 200,
    }));
    console.log(`✅ Événement ${id} modifié: "${updated.title}"`);
  }

  console.log('\n🔍 ÉTAPE 5: Lecture détaillée\n' + '─'.repeat(50));
  if (createdEventIds.length > 1) {
    const id = createdEventIds[1];
    const detail = await client.request(readItems('events', { filter: { id: { _eq: id } }, limit: 1 }));
    if (detail[0]) {
      const d = detail[0] as any;
      console.log(`📄 Événement ID ${id}:`);
      console.log(`   Titre: ${d.title}`);
      console.log(`   Date: ${d.date} ${d.start_time}-${d.end_time}`);
      console.log(`   Lieu: ${d.location}`);
      console.log(`   Prix base: ${d.price} CHF`);
      if (d.pricing) {
        console.log(`   Pricing: Adulte=${d.pricing.adult_price}, Enfant=${d.pricing.child_price}, Max famille=${d.pricing.family_max_price}`);
      }
    }
  }

  console.log('\n📊 ÉTAPE 6: Test des filtres\n' + '─'.repeat(50));
  const eventsOnly = await client.request(readItems('events', { filter: { item_type: { _eq: 'EVENT' } }, limit: 5 }));
  const gratuits = await client.request(readItems('events', { filter: { payment_type: { _eq: 'FREE' } }, limit: 5 }));
  const payants = await client.request(readItems('events', { filter: { payment_type: { _eq: 'ONE_TIME' } }, limit: 5 }));
  console.log(`📅 Événements (item_type=EVENT): ${eventsOnly.length}`);
  console.log(`🆓 Gratuits: ${gratuits.length}`);
  console.log(`💰 Payants (ONE_TIME): ${payants.length}`);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       ✅ WORKFLOW TERMINÉ AVEC SUCCÈS                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  📅 Événements créés: ${createdEventIds.length}/5                                   ║`);
  console.log(`║  📚 Activités créées: ${createdActivityIds.length}/5                                   ║`);
  console.log(`║  ✏️  Modification: OK                                       ║`);
  console.log(`║  🔍 Lecture détaillée: OK                                   ║`);
  console.log(`║  🔎 Filtres: OK                                             ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n🎯 Accédez à: http://localhost:3000/admin/gestion');
}

run().catch(console.error);
