/**
 * Script pour créer un nouvel utilisateur admin Directus
 * Usage: npx tsx scripts/create-directus-admin.ts
 */

const DIRECTUS_URL = 'http://localhost:8055'
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdkNTI5N2ZiLTBhZjEtNGMzYS1hNjk3LWNmNzc0NWYwMjhlMCIsInJvbGUiOiI4NGQwZWExMS0yN2Y1LTQ5ZmMtYmUyMC0xNDNmMjBmNmM3N2EiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc2NDU1MzE4MSwiZXhwIjoxNzY0NTU0MDgxLCJpc3MiOiJkaXJlY3R1cyJ9.jund5DaFERZ0LpT1Ej7RKluef7fAeDfxxAnbeXYZbyM'

async function createAdmin() {
  console.log('🔐 Création d\'un nouvel utilisateur admin Directus...\n')

  const newAdmin = {
    email: 'admin@mosquee.local',
    password: 'Mosquee2025!',
    first_name: 'Admin',
    last_name: 'Mosquée',
    role: '84d0ea11-27f5-49fc-be20-143f20f6c77a', // UUID du rôle Administrator
    status: 'active'
  }

  try {
    const response = await fetch(`${DIRECTUS_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`
      },
      body: JSON.stringify(newAdmin)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Utilisateur admin créé avec succès!\n')
      console.log('📧 Email: admin@mosquee.local')
      console.log('🔑 Mot de passe: Mosquee2025!\n')
      console.log('🌐 Connexion: http://localhost:8055\n')
      return data
    } else {
      const error = await response.text()
      console.error('❌ Erreur:', error)

      // Si le token a expiré, essayer sans authentification
      console.log('\n⚠️ Le token a peut-être expiré. Essayez Option 2 ou 3 ci-dessous.\n')
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    console.log('\n📝 Vérifiez que Directus tourne sur http://localhost:8055\n')
  }
}

createAdmin()
