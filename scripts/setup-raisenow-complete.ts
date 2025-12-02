/**
 * Script complet pour configurer RaiseNow dans Directus
 * 1. Ajoute le champ raisenow_code à la collection projects
 * 2. Crée 2 projets de démonstration avec codes RaiseNow
 */

const DIRECTUS_URL = 'http://localhost:8055'
const TOKEN = 'PRXwXJfnuM7Tr0pCGMswE8zrpoDorqV5'

console.log('🚀 Configuration complète RaiseNow + Directus\n')
console.log('═══════════════════════════════════════════════════════════════\n')

async function setupComplete() {
  try {
    // Étape 1 : Créer le champ raisenow_code
    console.log('1️⃣ Ajout du champ "raisenow_code" à la collection projects...')

    const fieldResponse = await fetch(`${DIRECTUS_URL}/fields/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'raisenow_code',
        type: 'string',
        meta: {
          interface: 'input',
          options: {
            placeholder: 'ex: zsmgy',
            iconRight: 'credit_card',
          },
          display: 'raw',
          display_options: null,
          readonly: false,
          hidden: false,
          sort: 100,
          width: 'full',
          translations: null,
          note: 'Code unique RaiseNow pour ce projet (ex: zsmgy, ftwhv)',
        },
        schema: {
          name: 'raisenow_code',
          table: 'projects',
          data_type: 'varchar',
          default_value: null,
          max_length: 255,
          numeric_precision: null,
          numeric_scale: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
        },
      }),
    })

    if (fieldResponse.ok) {
      console.log('   ✅ Champ "raisenow_code" créé avec succès\n')
    } else if (fieldResponse.status === 400) {
      const error = await fieldResponse.json()
      if (error.errors?.[0]?.message?.includes('already exists')) {
        console.log('   ⚠️  Champ "raisenow_code" existe déjà\n')
      } else {
        throw new Error(`Erreur création champ: ${JSON.stringify(error)}`)
      }
    } else {
      throw new Error(`Erreur HTTP ${fieldResponse.status}: ${await fieldResponse.text()}`)
    }

    // Étape 2 : Créer les 2 projets avec codes RaiseNow
    console.log('2️⃣ Création de 2 projets avec codes RaiseNow...\n')

    const projects = [
      {
        title: 'Rénovation Mosquée - Don en Ligne',
        slug: 'renovation-mosquee-raisenow',
        description: 'Soutenez la rénovation de notre mosquée avec un don en ligne sécurisé via RaiseNow',
        content: `
          <h2>Projet de Rénovation</h2>
          <p>Notre mosquée a besoin d'une rénovation complète pour mieux accueillir la communauté.</p>
          <ul>
            <li>Rénovation de la salle de prière principale</li>
            <li>Amélioration des sanitaires</li>
            <li>Installation de climatisation</li>
            <li>Mise aux normes d'accessibilité</li>
          </ul>
        `,
        goal_amount: 50000,
        current_amount: 15000,
        raisenow_code: 'zsmgy',
        priority: 1,
        active: true,
      },
      {
        title: 'Aide Humanitaire - Urgence',
        slug: 'aide-humanitaire-raisenow',
        description: 'Participez à notre collecte d\'aide humanitaire d\'urgence avec un don en ligne',
        content: `
          <h2>Aide Humanitaire d'Urgence</h2>
          <p>Nous collectons des fonds pour apporter une aide d'urgence aux populations dans le besoin.</p>
          <ul>
            <li>Distribution de colis alimentaires</li>
            <li>Fourniture de kits médicaux</li>
            <li>Aide au logement</li>
            <li>Soutien scolaire pour les enfants</li>
          </ul>
        `,
        goal_amount: 30000,
        current_amount: 8500,
        raisenow_code: 'ftwhv',
        priority: 2,
        active: true,
      },
    ]

    let successCount = 0

    for (const project of projects) {
      try {
        const response = await fetch(`${DIRECTUS_URL}/items/projects`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(project),
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`   ✅ ${project.title}`)
          console.log(`      💰 Objectif: ${project.goal_amount.toLocaleString('fr-FR')} CHF`)
          console.log(`      📊 Collecté: ${project.current_amount.toLocaleString('fr-FR')} CHF`)
          console.log(`      🔗 Code RaiseNow: ${project.raisenow_code}`)
          console.log(`      🆔 ID: ${data.data.id}`)
          console.log('')
          successCount++
        } else {
          const error = await response.json()
          if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
            console.log(`   ⚠️  ${project.title} (slug déjà existant)`)
          } else {
            console.error(`   ❌ Erreur: ${JSON.stringify(error)}`)
          }
        }
      } catch (error: any) {
        console.error(`   ❌ Erreur réseau: ${error.message}`)
      }
    }

    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`✅ Configuration terminée !`)
    console.log(`   - Champ raisenow_code créé`)
    console.log(`   - ${successCount}/2 projet(s) créé(s)`)
    console.log('═══════════════════════════════════════════════════════════════\n')

    console.log('🌐 TESTEZ MAINTENANT:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log('→ http://localhost:3000/dons')
    console.log('')
    console.log('Vous verrez les cartes des projets avec:')
    console.log('  ✅ Image ou icône par défaut')
    console.log('  ✅ Description du projet')
    console.log('  ✅ Barre de progression')
    console.log('  ✅ Bouton "Faire un don"')
    console.log('')
    console.log('Cliquez sur "Faire un don":')
    console.log('  → Popup s\'ouvre avec widget RaiseNow')
    console.log('  → Formulaire de don avec code unique\n')

    console.log('⚙️  DIRECTUS ADMIN:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log('→ http://localhost:8055')
    console.log('→ Content → Projects')
    console.log('→ Vous pouvez maintenant ajouter d\'autres projets avec leur code RaiseNow\n')

    console.log('📋 CODES RAISENOW CONFIGURÉS:')
    console.log('───────────────────────────────────────────────────────────────')
    console.log('1. zsmgy - Rénovation Mosquée')
    console.log('2. ftwhv - Aide Humanitaire\n')

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message)
    process.exit(1)
  }
}

setupComplete()
  .then(() => {
    console.log('✅ Script terminé avec succès\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Échec:', error.message)
    process.exit(1)
  })
