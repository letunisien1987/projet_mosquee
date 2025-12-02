/**
 * Script pour ajouter le champ manager_id à la collection activities dans Directus
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'YaA-wIGXsFhMSUI5J_s5_JCEMScU9K0a'

async function addManagerField() {
  console.log('🔧 Ajout du champ manager_id à la collection activities...')

  try {
    // Vérifier si le champ existe déjà
    const checkResponse = await fetch(`${DIRECTUS_URL}/fields/activities/manager_id`, {
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      },
    })

    if (checkResponse.ok) {
      console.log('✅ Le champ manager_id existe déjà')
      return
    }

    // Créer le champ
    const response = await fetch(`${DIRECTUS_URL}/fields/activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'manager_id',
        type: 'uuid',
        meta: {
          interface: 'input',
          special: null,
          note: 'ID du responsable (référence User PostgreSQL)',
          display: 'raw',
          readonly: false,
          hidden: false,
          width: 'half',
        },
        schema: {
          is_nullable: true,
        },
      }),
    })

    if (response.ok) {
      console.log('✅ Champ manager_id ajouté avec succès')
    } else {
      const error = await response.json()
      console.error('❌ Erreur:', error)
    }

    // Ajouter aussi un champ pour l'email du manager (pour affichage)
    const emailResponse = await fetch(`${DIRECTUS_URL}/fields/activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        field: 'manager_email',
        type: 'string',
        meta: {
          interface: 'input',
          special: null,
          note: 'Email du responsable (pour affichage)',
          display: 'raw',
          readonly: false,
          hidden: false,
          width: 'half',
        },
        schema: {
          is_nullable: true,
        },
      }),
    })

    if (emailResponse.ok) {
      console.log('✅ Champ manager_email ajouté avec succès')
    } else {
      const error = await emailResponse.json()
      if (error.errors?.[0]?.extensions?.code !== 'FIELD_ALREADY_EXISTS') {
        console.error('❌ Erreur manager_email:', error)
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

addManagerField()
