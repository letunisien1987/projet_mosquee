/**
 * Script pour unifier les événements et activités dans Directus
 * Ajoute le champ item_type à la collection events et les champs spécifiques aux activités
 *
 * Usage: DIRECTUS_TOKEN="votre_token" npx tsx scripts/unify-events-activities.ts
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

interface DirectusFieldPayload {
  field: string
  type: string
  schema?: {
    default_value?: any
    is_nullable?: boolean
  }
  meta?: {
    interface?: string
    options?: any
    display?: string
    display_options?: any
    readonly?: boolean
    hidden?: boolean
    width?: string
    sort?: number
    group?: string
    note?: string
    required?: boolean
    conditions?: any[]
  }
}

async function addField(collection: string, fieldData: DirectusFieldPayload) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldData),
    })

    if (response.ok) {
      console.log(`✅ Champ "${fieldData.field}" ajouté à "${collection}"`)
      return true
    } else {
      const error = await response.json()
      if (error.errors?.[0]?.extensions?.code === 'FIELD_ALREADY_EXISTS') {
        console.log(`⏭️  Champ "${fieldData.field}" existe déjà dans "${collection}"`)
        return true
      }
      console.error(`❌ Erreur pour "${fieldData.field}":`, error)
      return false
    }
  } catch (error) {
    console.error(`❌ Erreur réseau pour "${fieldData.field}":`, error)
    return false
  }
}

async function migrateActivitiesToEvents() {
  console.log('\n📦 Migration des activités existantes vers events...')

  try {
    // Récupérer toutes les activités
    const activitiesRes = await fetch(`${DIRECTUS_URL}/items/activities?limit=-1`, {
      headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` },
    })

    if (!activitiesRes.ok) {
      console.log('⚠️  Pas de collection activities ou erreur de lecture')
      return
    }

    const { data: activities } = await activitiesRes.json()
    console.log(`📊 ${activities?.length || 0} activités trouvées`)

    if (!activities || activities.length === 0) {
      console.log('ℹ️  Aucune activité à migrer')
      return
    }

    // Migrer chaque activité vers events
    for (const activity of activities) {
      const eventData = {
        item_type: 'ACTIVITY',
        title: activity.title,
        slug: activity.slug,
        description: activity.description,
        content: activity.content,
        // Mapper les catégories d'activités vers les catégories d'événements
        category: mapActivityCategory(activity.category),
        activity_category: activity.category, // Garder la catégorie originale
        // Champs spécifiques aux activités
        level: activity.level,
        age_group: activity.age_group,
        schedule: activity.schedule,
        instructor: activity.instructor,
        max_capacity: activity.max_participants,
        requires_approval: activity.requires_approval || false,
        price: activity.price,
        published: activity.active,
        enrollment_open: activity.enrollment_open,
        manager_id: activity.manager_id,
        manager_email: activity.manager_email,
        restrictions: activity.restrictions,
        // Champs par défaut pour les événements (non applicables aux activités)
        registration_required: true,
        featured: false,
      }

      const createRes = await fetch(`${DIRECTUS_URL}/items/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (createRes.ok) {
        console.log(`✅ Activité "${activity.title}" migrée`)
      } else {
        const error = await createRes.json()
        console.error(`❌ Erreur migration "${activity.title}":`, error)
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
  }
}

function mapActivityCategory(activityCategory: string): string {
  // Mapper les catégories d'activités vers les catégories d'événements
  const mapping: Record<string, string> = {
    'coran': 'education',
    'arabe': 'education',
    'ecole': 'education',
    'tajweed': 'education',
    'hifz': 'education',
    'halaqat': 'religieux',
    'autre': 'communaute',
  }
  return mapping[activityCategory] || 'education'
}

async function updateExistingEvents() {
  console.log('\n📦 Mise à jour des événements existants avec item_type=EVENT...')

  try {
    // Récupérer tous les événements sans item_type
    const eventsRes = await fetch(`${DIRECTUS_URL}/items/events?filter[item_type][_null]=true&limit=-1`, {
      headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` },
    })

    if (!eventsRes.ok) {
      console.log('⚠️  Erreur de lecture des événements')
      return
    }

    const { data: events } = await eventsRes.json()
    console.log(`📊 ${events?.length || 0} événements à mettre à jour`)

    if (!events || events.length === 0) {
      console.log('ℹ️  Tous les événements ont déjà un item_type')
      return
    }

    // Mettre à jour chaque événement
    for (const event of events) {
      const updateRes = await fetch(`${DIRECTUS_URL}/items/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_type: 'EVENT' }),
      })

      if (updateRes.ok) {
        console.log(`✅ Événement "${event.title}" mis à jour`)
      } else {
        const error = await updateRes.json()
        console.error(`❌ Erreur mise à jour "${event.title}":`, error)
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
  }
}

async function main() {
  console.log('🚀 Unification des événements et activités dans Directus')
  console.log(`📍 URL: ${DIRECTUS_URL}`)

  if (!DIRECTUS_TOKEN) {
    console.error('❌ DIRECTUS_TOKEN requis')
    console.log('Usage: DIRECTUS_TOKEN="votre_token" npx tsx scripts/unify-events-activities.ts')
    process.exit(1)
  }

  // Vérifier la connexion
  try {
    const pingRes = await fetch(`${DIRECTUS_URL}/server/ping`)
    if (!pingRes.ok) throw new Error('Directus non accessible')
    console.log('✅ Directus accessible')
  } catch {
    console.error('❌ Impossible de se connecter à Directus')
    process.exit(1)
  }

  // 1. Ajouter le champ item_type (discriminateur principal)
  console.log('\n📝 Ajout des nouveaux champs à la collection events...')

  await addField('events', {
    field: 'item_type',
    type: 'string',
    schema: {
      default_value: 'EVENT',
      is_nullable: false,
    },
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Événement', value: 'EVENT' },
          { text: 'Activité', value: 'ACTIVITY' },
        ],
      },
      display: 'labels',
      display_options: {
        choices: [
          { text: 'Événement', value: 'EVENT', background: '#6366f1', foreground: '#ffffff' },
          { text: 'Activité', value: 'ACTIVITY', background: '#10b981', foreground: '#ffffff' },
        ],
      },
      width: 'half',
      sort: 1,
      required: true,
      note: 'Type principal: Événement (ponctuel) ou Activité (récurrente)',
    },
  })

  // 2. Ajouter les champs spécifiques aux activités
  await addField('events', {
    field: 'activity_category',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Coran', value: 'coran' },
          { text: 'Arabe', value: 'arabe' },
          { text: 'École', value: 'ecole' },
          { text: 'Tajweed', value: 'tajweed' },
          { text: 'Hifz', value: 'hifz' },
          { text: 'Halaqat', value: 'halaqat' },
          { text: 'Autre', value: 'autre' },
        ],
      },
      display: 'labels',
      width: 'half',
      note: 'Catégorie spécifique pour les activités',
      conditions: [
        {
          rule: { item_type: { _neq: 'ACTIVITY' } },
          hidden: true,
        },
      ],
    },
  })

  await addField('events', {
    field: 'level',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'input',
      width: 'half',
      note: 'Niveau requis (ex: Débutant, Intermédiaire, Avancé)',
      conditions: [
        {
          rule: { item_type: { _neq: 'ACTIVITY' } },
          hidden: true,
        },
      ],
    },
  })

  await addField('events', {
    field: 'age_group',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'input',
      width: 'half',
      note: 'Groupe d\'âge (ex: 6-10 ans, Adultes)',
      conditions: [
        {
          rule: { item_type: { _neq: 'ACTIVITY' } },
          hidden: true,
        },
      ],
    },
  })

  await addField('events', {
    field: 'schedule',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'input',
      width: 'full',
      note: 'Horaire récurrent (ex: Samedi 10h-12h)',
      conditions: [
        {
          rule: { item_type: { _neq: 'ACTIVITY' } },
          hidden: true,
        },
      ],
    },
  })

  await addField('events', {
    field: 'instructor',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'input',
      width: 'half',
      note: 'Nom de l\'instructeur/enseignant',
      conditions: [
        {
          rule: { item_type: { _neq: 'ACTIVITY' } },
          hidden: true,
        },
      ],
    },
  })

  await addField('events', {
    field: 'enrollment_open',
    type: 'boolean',
    schema: {
      default_value: true,
      is_nullable: true,
    },
    meta: {
      interface: 'boolean',
      width: 'half',
      note: 'Inscriptions ouvertes pour cette activité',
      conditions: [
        {
          rule: { item_type: { _neq: 'ACTIVITY' } },
          hidden: true,
        },
      ],
    },
  })

  // 3. Mettre à jour les événements existants
  await updateExistingEvents()

  // 4. Demander si on veut migrer les activités
  console.log('\n' + '='.repeat(60))
  console.log('📋 La structure a été mise à jour.')
  console.log('')
  console.log('Pour migrer les activités existantes vers events, exécutez:')
  console.log('DIRECTUS_TOKEN="token" MIGRATE_ACTIVITIES=true npx tsx scripts/unify-events-activities.ts')

  if (process.env.MIGRATE_ACTIVITIES === 'true') {
    await migrateActivitiesToEvents()
  }

  console.log('\n✅ Terminé!')
}

main().catch(console.error)
