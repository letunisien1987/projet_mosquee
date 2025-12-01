import { createDirectus, rest, staticToken, createCollection, createField } from '@directus/sdk'

const DIRECTUS_URL = 'http://localhost:8055'
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || ''

if (!ADMIN_TOKEN) {
  console.error('❌ Veuillez fournir un DIRECTUS_ADMIN_TOKEN')
  console.log('Usage: DIRECTUS_ADMIN_TOKEN=your_token npx tsx scripts/create-member-collections.ts')
  process.exit(1)
}

const directus = createDirectus(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest())

async function createMemberCollections() {
  console.log('🔧 Création des collections pour l\'espace membre...\n')

  try {
    // 1. Collection user_profiles
    console.log('📁 Création de la collection user_profiles...')
    try {
      await directus.request(
        createCollection({
          collection: 'user_profiles',
          meta: {
            icon: 'person',
            note: 'Profils étendus des utilisateurs membres',
            display_template: '{{user_id}}',
            hidden: false,
            singleton: false,
            translations: null,
            archive_field: null,
            archive_value: null,
            unarchive_value: null,
            sort_field: null,
          },
          schema: {
            name: 'user_profiles',
          },
        })
      )
      console.log('✅ Collection user_profiles créée')
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        console.log('⚠️  Collection user_profiles existe déjà')
      } else {
        throw error
      }
    }

    // Champs pour user_profiles
    const profileFields = [
      {
        field: 'user_id',
        type: 'uuid',
        meta: {
          interface: 'input',
          required: true,
          note: 'ID de l\'utilisateur (référence à users.id)',
        },
        schema: {
          is_nullable: false,
        },
      },
      {
        field: 'city',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
        },
      },
      {
        field: 'postal_code',
        type: 'string',
        meta: {
          interface: 'input',
          width: 'half',
        },
      },
      {
        field: 'country',
        type: 'string',
        meta: {
          interface: 'input',
          options: {
            placeholder: 'France',
          },
        },
        schema: {
          default_value: 'France',
        },
      },
      {
        field: 'date_of_birth',
        type: 'date',
        meta: {
          interface: 'datetime',
          display: 'datetime',
          width: 'half',
        },
      },
      {
        field: 'profile_picture',
        type: 'uuid',
        meta: {
          interface: 'file-image',
          note: 'Photo de profil',
        },
      },
      {
        field: 'bio',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          note: 'Courte biographie',
        },
      },
      {
        field: 'preferred_language',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Français', value: 'fr' },
              { text: 'العربية', value: 'ar' },
            ],
          },
          width: 'half',
        },
        schema: {
          default_value: 'fr',
        },
      },
      {
        field: 'notification_email',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          note: 'Recevoir les notifications par email',
          width: 'half',
        },
        schema: {
          default_value: true,
        },
      },
      {
        field: 'notification_sms',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          note: 'Recevoir les notifications par SMS',
          width: 'half',
        },
        schema: {
          default_value: false,
        },
      },
      {
        field: 'newsletter',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          note: 'S\'abonner à la newsletter',
          width: 'half',
        },
        schema: {
          default_value: true,
        },
      },
    ]

    console.log('\n📝 Ajout des champs à user_profiles...')
    for (const fieldConfig of profileFields) {
      try {
        await directus.request(createField('user_profiles', fieldConfig as any))
        console.log(`  ✅ Champ ${fieldConfig.field} ajouté`)
      } catch (error: any) {
        if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
          console.log(`  ⚠️  Champ ${fieldConfig.field} existe déjà`)
        } else {
          console.error(`  ❌ Erreur pour ${fieldConfig.field}:`, error.message)
        }
      }
    }

    // 2. Collection notifications
    console.log('\n📁 Création de la collection notifications...')
    try {
      await directus.request(
        createCollection({
          collection: 'notifications',
          meta: {
            icon: 'notifications',
            note: 'Notifications pour les membres',
            display_template: '{{title}}',
            hidden: false,
            singleton: false,
            translations: null,
            archive_field: null,
            archive_value: null,
            unarchive_value: null,
            sort_field: 'date_created',
          },
          schema: {
            name: 'notifications',
          },
        })
      )
      console.log('✅ Collection notifications créée')
    } catch (error: any) {
      if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        console.log('⚠️  Collection notifications existe déjà')
      } else {
        throw error
      }
    }

    // Champs pour notifications
    const notificationFields = [
      {
        field: 'user_id',
        type: 'uuid',
        meta: {
          interface: 'input',
          required: true,
          note: 'ID de l\'utilisateur destinataire',
        },
        schema: {
          is_nullable: false,
        },
      },
      {
        field: 'type',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          required: true,
          options: {
            choices: [
              { text: 'Événement', value: 'EVENT' },
              { text: 'Cours', value: 'COURSE' },
              { text: 'Don', value: 'DONATION' },
              { text: 'Système', value: 'SYSTEM' },
              { text: 'Rappel', value: 'REMINDER' },
            ],
          },
          width: 'half',
        },
        schema: {
          is_nullable: false,
        },
      },
      {
        field: 'title',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          note: 'Titre de la notification',
        },
        schema: {
          is_nullable: false,
        },
      },
      {
        field: 'message',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          required: true,
          note: 'Contenu de la notification',
        },
        schema: {
          is_nullable: false,
        },
      },
      {
        field: 'link',
        type: 'string',
        meta: {
          interface: 'input',
          note: 'Lien optionnel (URL relative)',
        },
      },
      {
        field: 'read',
        type: 'boolean',
        meta: {
          interface: 'boolean',
          note: 'Notification lue',
          width: 'half',
        },
        schema: {
          default_value: false,
        },
      },
    ]

    console.log('\n📝 Ajout des champs à notifications...')
    for (const fieldConfig of notificationFields) {
      try {
        await directus.request(createField('notifications', fieldConfig as any))
        console.log(`  ✅ Champ ${fieldConfig.field} ajouté`)
      } catch (error: any) {
        if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
          console.log(`  ⚠️  Champ ${fieldConfig.field} existe déjà`)
        } else {
          console.error(`  ❌ Erreur pour ${fieldConfig.field}:`, error.message)
        }
      }
    }

    console.log('\n✅ Collections créées avec succès!')
    console.log('\n📊 Résumé:')
    console.log('  - user_profiles: Profils étendus des membres')
    console.log('  - notifications: Système de notifications')
    console.log('\nVous pouvez maintenant gérer ces données via Directus à http://localhost:8055')

  } catch (error: any) {
    console.error('\n❌ Erreur:', error)
    if (error.errors) {
      console.error('Détails:', JSON.stringify(error.errors, null, 2))
    }
    process.exit(1)
  }
}

createMemberCollections()
  .then(() => {
    console.log('\n✅ Script terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error.message)
    process.exit(1)
  })
