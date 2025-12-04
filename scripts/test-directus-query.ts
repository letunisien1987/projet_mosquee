/**
 * Test direct Directus query using staticToken
 * Usage: npx tsx scripts/test-directus-query.ts
 */

import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_TOKEN || 'directus_mosque_token_1764770847840';

async function run() {
  console.log('🔍 Test de la requête Directus\n');
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log(`Token: ${TOKEN.substring(0, 20)}...`);

  // Créer le client avec staticToken (comme dans lib/directus.ts)
  const client = createDirectus(DIRECTUS_URL)
    .with(staticToken(TOKEN))
    .with(rest());

  try {
    // Query events
    console.log('\n1. Récupération des événements...');
    const events = await client.request(
      readItems('events', {
        sort: ['-date'], // Utiliser date au lieu de date_created
        limit: -1,
        fields: ['*']
      })
    );
    console.log(`📅 ${events.length} événements trouvés`);
    if (events.length > 0) {
      const first = events[0] as any;
      console.log(`   Premier: "${first.title}" (ID: ${first.id})`);
    }

    // Query activities
    console.log('\n2. Récupération des activités...');
    const activities = await client.request(
      readItems('activities', {
        sort: ['-id'], // Utiliser id au lieu de date_created
        limit: -1,
        fields: ['*']
      })
    );
    console.log(`📚 ${activities.length} activités trouvées`);
    if (activities.length > 0) {
      const first = activities[0] as any;
      console.log(`   Première: "${first.title}" (ID: ${first.id})`);
    }

    console.log('\n✅ Total offres:', events.length + activities.length);

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    if (error.errors) {
      console.error('Détails:', JSON.stringify(error.errors, null, 2));
    }
  }
}

run();
