import { Client } from 'pg'
import * as argon2 from 'argon2'

const connectionString = "postgres://a8847a6f06a5536d2277c7466266140954ca6d3e57e9f0a100c8d32b00c03459:sk_lRDmU-aj8C80iLRGJMpAa@db.prisma.io:5432/postgres?sslmode=require"

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('Connected to database')

    // Check what schemas exist
    const schemasResult = await client.query("SELECT schema_name FROM information_schema.schemata")
    console.log('\n=== Available Schemas ===')
    console.log(schemasResult.rows)

    // Check if directus schema exists
    const directusExists = schemasResult.rows.some((r: any) => r.schema_name === 'directus')
    console.log('\nDirectus schema exists:', directusExists)

    if (!directusExists) {
      console.log('\nERROR: Directus schema does not exist!')
      console.log('Run "npx directus bootstrap" in ~/directus-mosquee to initialize Directus')
      return
    }

    // Check existing users
    const usersResult = await client.query('SELECT id, email, status, role, token FROM directus.directus_users')
    console.log('\n=== Current Directus Users ===')
    console.log(usersResult.rows)

    if (usersResult.rows.length > 0) {
      // Hash new password with argon2
      const newPassword = 'mosquee2024!'
      const hashedPassword = await argon2.hash(newPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4
      })

      console.log('\n=== Resetting admin password ===')

      // Update admin password
      const updateResult = await client.query(
        'UPDATE directus.directus_users SET password = $1 WHERE email = $2 RETURNING id, email',
        [hashedPassword, 'admin@mosquee.ch']
      )

      if (updateResult.rowCount && updateResult.rowCount > 0) {
        console.log('Password reset for:', updateResult.rows[0].email)

        // Also generate a static token
        const staticToken = 'directus_admin_token_' + Date.now()
        await client.query(
          'UPDATE directus.directus_users SET token = $1 WHERE email = $2',
          [staticToken, 'admin@mosquee.ch']
        )
        console.log('\nNew static token:', staticToken)
        console.log('\nUpdate .env.local with:')
        console.log(`DIRECTUS_TOKEN=${staticToken}`)
      } else {
        console.log('No admin user found with email admin@mosquee.ch')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.end()
  }
}

main()
