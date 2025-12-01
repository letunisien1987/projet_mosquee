/**
 * Script pour créer automatiquement toutes les collections Directus
 * Exécuter avec: npx tsx scripts/create-directus-collections.ts
 */

import 'dotenv/config'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN

if (!DIRECTUS_TOKEN) {
  console.error('❌ DIRECTUS_TOKEN manquant dans .env')
  process.exit(1)
}

async function createCollection(collectionData: any) {
  const response = await fetch(`${DIRECTUS_URL}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(collectionData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erreur création collection: ${error}`)
  }

  return response.json()
}

async function createField(collection: string, fieldData: any) {
  const response = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
    },
    body: JSON.stringify(fieldData),
  })

  if (!response.ok) {
    const error = await response.text()
    console.warn(`⚠️  Erreur création champ ${fieldData.field}: ${error}`)
    return null
  }

  return response.json()
}

async function main() {
  console.log('🚀 Création des collections Directus...\n')

  try {
    // 1. TEAM MEMBERS (à créer en premier car référencé par activities et articles)
    console.log('📋 Création de la collection: team_members')
    await createCollection({
      collection: 'team_members',
      meta: {
        icon: 'people',
        note: 'Membres de l\'équipe de la mosquée',
      },
      schema: { name: 'team_members' },
    })

    const teamFields = [
      { field: 'name', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'role', type: 'string', meta: { required: true, interface: 'select-dropdown', options: { choices: [
        { text: 'Imam', value: 'imam' },
        { text: 'Président', value: 'president' },
        { text: 'Vice-président', value: 'vice_president' },
        { text: 'Trésorier', value: 'treasurer' },
        { text: 'Secrétaire', value: 'secretary' },
        { text: 'Enseignant', value: 'teacher' },
        { text: 'Membre du conseil', value: 'board_member' },
      ]}}, schema: { is_nullable: false } },
      { field: 'bio', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'photo', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'email', type: 'string', meta: { interface: 'input', options: { iconRight: 'email' } } },
      { field: 'phone', type: 'string', meta: { interface: 'input', options: { iconRight: 'phone' } } },
      { field: 'order', type: 'integer', meta: { interface: 'input', options: { min: 0 } }, schema: { default_value: 0 } },
      { field: 'active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    ]

    for (const field of teamFields) {
      await createField('team_members', field)
    }
    console.log('✅ team_members créé\n')

    // 2. EVENTS
    console.log('📋 Création de la collection: events')
    await createCollection({
      collection: 'events',
      meta: {
        icon: 'event',
        note: 'Événements de la mosquée',
      },
      schema: { name: 'events' },
    })

    const eventFields = [
      { field: 'title', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'slug', type: 'string', meta: { required: true, interface: 'input', options: { slug: true } }, schema: { is_nullable: false, is_unique: true } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html' } },
      { field: 'category', type: 'string', meta: { required: true, interface: 'select-dropdown', options: { choices: [
        { text: 'Religieux', value: 'religieux' },
        { text: 'Communauté', value: 'communaute' },
        { text: 'Éducation', value: 'education' },
        { text: 'Charité', value: 'charite' },
      ]}}, schema: { is_nullable: false } },
      { field: 'date', type: 'date', meta: { required: true, interface: 'datetime' }, schema: { is_nullable: false } },
      { field: 'start_time', type: 'string', meta: { required: true, interface: 'input', options: { placeholder: '14:00' } }, schema: { is_nullable: false } },
      { field: 'end_time', type: 'string', meta: { required: true, interface: 'input', options: { placeholder: '16:00' } }, schema: { is_nullable: false } },
      { field: 'location', type: 'string', meta: { interface: 'input' } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'attendees', type: 'string', meta: { interface: 'input' } },
      { field: 'registration_required', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'max_capacity', type: 'integer', meta: { interface: 'input', options: { min: 0 } } },
      { field: 'requires_approval', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'registration_deadline', type: 'timestamp', meta: { interface: 'datetime' } },
      { field: 'featured', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'published', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    ]

    for (const field of eventFields) {
      await createField('events', field)
    }
    console.log('✅ events créé\n')

    // 3. ACTIVITIES
    console.log('📋 Création de la collection: activities')
    await createCollection({
      collection: 'activities',
      meta: {
        icon: 'school',
        note: 'Activités et cours de la mosquée',
      },
      schema: { name: 'activities' },
    })

    const activityFields = [
      { field: 'title', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'slug', type: 'string', meta: { required: true, interface: 'input', options: { slug: true } }, schema: { is_nullable: false, is_unique: true } },
      { field: 'category', type: 'string', meta: { required: true, interface: 'select-dropdown', options: { choices: [
        { text: 'Coran', value: 'coran' },
        { text: 'Arabe', value: 'arabe' },
        { text: 'École du dimanche', value: 'ecole' },
        { text: 'Tajweed', value: 'tajweed' },
        { text: 'Hifz', value: 'hifz' },
        { text: 'Halaqat', value: 'halaqat' },
        { text: 'Autre', value: 'autre' },
      ]}}, schema: { is_nullable: false } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html' } },
      { field: 'level', type: 'string', meta: { interface: 'input' } },
      { field: 'age_group', type: 'string', meta: { interface: 'input' } },
      { field: 'schedule', type: 'string', meta: { interface: 'input' } },
      { field: 'instructor', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], display: 'related-values', display_options: { template: '{{name}}' } } },
      { field: 'max_participants', type: 'integer', meta: { interface: 'input', options: { min: 0 } } },
      { field: 'requires_approval', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'price', type: 'float', meta: { interface: 'input', options: { min: 0 } } },
      { field: 'active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
      { field: 'enrollment_open', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    ]

    for (const field of activityFields) {
      await createField('activities', field)
    }
    console.log('✅ activities créé\n')

    // 4. ARTICLES
    console.log('📋 Création de la collection: articles')
    await createCollection({
      collection: 'articles',
      meta: {
        icon: 'article',
        note: 'Articles et actualités',
      },
      schema: { name: 'articles' },
    })

    const articleFields = [
      { field: 'title', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'slug', type: 'string', meta: { required: true, interface: 'input', options: { slug: true } }, schema: { is_nullable: false, is_unique: true } },
      { field: 'excerpt', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'content', type: 'text', meta: { required: true, interface: 'input-rich-text-html' }, schema: { is_nullable: false } },
      { field: 'category', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Annonce', value: 'announcement' },
        { text: 'Actualité', value: 'news' },
        { text: 'Religieux', value: 'religious' },
        { text: 'Communauté', value: 'community' },
      ]}} },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'author', type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], display: 'related-values', display_options: { template: '{{name}}' } } },
      { field: 'published_at', type: 'timestamp', meta: { required: true, interface: 'datetime' }, schema: { is_nullable: false } },
      { field: 'featured', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } },
      { field: 'published', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    ]

    for (const field of articleFields) {
      await createField('articles', field)
    }
    console.log('✅ articles créé\n')

    // 5. PROJECTS
    console.log('📋 Création de la collection: projects')
    await createCollection({
      collection: 'projects',
      meta: {
        icon: 'volunteer_activism',
        note: 'Projets de dons',
      },
      schema: { name: 'projects' },
    })

    const projectFields = [
      { field: 'title', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'slug', type: 'string', meta: { required: true, interface: 'input', options: { slug: true } }, schema: { is_nullable: false, is_unique: true } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'content', type: 'text', meta: { interface: 'input-rich-text-html' } },
      { field: 'goal_amount', type: 'float', meta: { required: true, interface: 'input', options: { min: 0 } }, schema: { is_nullable: false } },
      { field: 'current_amount', type: 'float', meta: { required: true, interface: 'input', options: { min: 0 } }, schema: { is_nullable: false, default_value: 0 } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'start_date', type: 'date', meta: { interface: 'datetime' } },
      { field: 'end_date', type: 'date', meta: { interface: 'datetime' } },
      { field: 'priority', type: 'integer', meta: { interface: 'input', options: { min: 0 } }, schema: { default_value: 1 } },
      { field: 'active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    ]

    for (const field of projectFields) {
      await createField('projects', field)
    }
    console.log('✅ projects créé\n')

    // 6. MOSQUE_SETTINGS
    console.log('📋 Création de la collection: mosque_settings (singleton)')
    await createCollection({
      collection: 'mosque_settings',
      meta: {
        singleton: true,
        icon: 'settings',
        note: 'Paramètres généraux de la mosquée',
      },
      schema: { name: 'mosque_settings' },
    })

    const mosqueSettingsFields = [
      { field: 'name', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'address_street', type: 'string', meta: { interface: 'input' } },
      { field: 'address_city', type: 'string', meta: { interface: 'input' } },
      { field: 'address_postal_code', type: 'string', meta: { interface: 'input' } },
      { field: 'address_country', type: 'string', meta: { interface: 'input' } },
      { field: 'contact_email', type: 'string', meta: { interface: 'input', options: { iconRight: 'email' } } },
      { field: 'contact_phone', type: 'string', meta: { interface: 'input', options: { iconRight: 'phone' } } },
      { field: 'contact_phone2', type: 'string', meta: { interface: 'input', options: { iconRight: 'phone' } } },
      { field: 'bank_iban', type: 'string', meta: { interface: 'input' } },
      { field: 'bank_bic', type: 'string', meta: { interface: 'input' } },
      { field: 'bank_account_holder', type: 'string', meta: { interface: 'input' } },
      { field: 'twint', type: 'string', meta: { interface: 'input' } },
      { field: 'social_facebook', type: 'string', meta: { interface: 'input', options: { iconLeft: 'link' } } },
      { field: 'social_instagram', type: 'string', meta: { interface: 'input', options: { iconLeft: 'link' } } },
      { field: 'social_youtube', type: 'string', meta: { interface: 'input', options: { iconLeft: 'link' } } },
      { field: 'social_twitter', type: 'string', meta: { interface: 'input', options: { iconLeft: 'link' } } },
      { field: 'opening_hours', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'capacity', type: 'integer', meta: { interface: 'input', options: { min: 0 } } },
      { field: 'logo', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
    ]

    for (const field of mosqueSettingsFields) {
      await createField('mosque_settings', field)
    }
    console.log('✅ mosque_settings créé\n')

    // 7. GALLERIES
    console.log('📋 Création de la collection: galleries')
    await createCollection({
      collection: 'galleries',
      meta: {
        icon: 'photo_library',
        note: 'Galeries photos',
      },
      schema: { name: 'galleries' },
    })

    const galleryFields = [
      { field: 'title', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'images', type: 'alias', meta: { interface: 'files', special: ['files'] } },
      { field: 'category', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Événements', value: 'events' },
        { text: 'Mosquée', value: 'mosque' },
        { text: 'Activités', value: 'activities' },
        { text: 'Communauté', value: 'community' },
      ]}} },
      { field: 'date', type: 'date', meta: { interface: 'datetime' } },
      { field: 'published', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
    ]

    for (const field of galleryFields) {
      await createField('galleries', field)
    }
    console.log('✅ galleries créé\n')

    // 8. JUMUA_MESSAGES
    console.log('📋 Création de la collection: jumua_messages')
    await createCollection({
      collection: 'jumua_messages',
      meta: {
        icon: 'mosque',
        note: 'Messages pour le carousel Joumou\'a',
      },
      schema: { name: 'jumua_messages' },
    })

    const jumuaFields = [
      { field: 'title', type: 'string', meta: { required: true, interface: 'input' }, schema: { is_nullable: false } },
      { field: 'message', type: 'text', meta: { required: true, interface: 'input-multiline' }, schema: { is_nullable: false } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'times', type: 'json', meta: { interface: 'list', options: { template: '{{value}}' } } },
      { field: 'is_active', type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: true } },
      { field: 'order', type: 'integer', meta: { interface: 'input', options: { min: 0 } }, schema: { default_value: 0 } },
      { field: 'valid_from', type: 'date', meta: { interface: 'datetime' } },
      { field: 'valid_until', type: 'date', meta: { interface: 'datetime' } },
    ]

    for (const field of jumuaFields) {
      await createField('jumua_messages', field)
    }
    console.log('✅ jumua_messages créé\n')

    // Créer les relations
    console.log('🔗 Création des relations...')

    // Relation activities.instructor -> team_members
    await createField('activities', {
      field: 'instructor',
      type: 'uuid',
      schema: {
        foreign_key_table: 'team_members',
        foreign_key_column: 'id',
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        display_options: { template: '{{name}}' },
      },
    })

    // Relation articles.author -> team_members
    await createField('articles', {
      field: 'author',
      type: 'uuid',
      schema: {
        foreign_key_table: 'team_members',
        foreign_key_column: 'id',
      },
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        display: 'related-values',
        display_options: { template: '{{name}}' },
      },
    })

    console.log('✅ Relations créées\n')

    console.log('🎉 Toutes les collections ont été créées avec succès !')
    console.log('\n📍 Accédez à Directus Admin: http://localhost:8055')
    console.log('📧 Email: admin@mosquee.ch')
    console.log('🔑 Mot de passe: mosquee2024!')

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main()
