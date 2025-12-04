import { createDirectus, rest, staticToken, readItems } from '@directus/sdk'

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

const directusClient = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

async function main() {
  console.log('Token:', DIRECTUS_TOKEN ? 'configuré' : 'manquant')
  console.log('URL:', DIRECTUS_URL)

  try {
    const today = new Date().toISOString().split('T')[0]
    console.log('\nDate du jour:', today)

    const messages = await directusClient.request(
      readItems('jumua_messages', {
        filter: {
          is_active: { _eq: true },
        },
        sort: ['order'],
        limit: -1,
      })
    )

    console.log('\n=== Messages Joumou\'a actifs ===')
    console.log('Nombre de messages:', messages.length)

    if (messages.length > 0) {
      messages.forEach((msg: any, i: number) => {
        console.log(`\n--- Message ${i + 1} ---`)
        console.log('ID:', msg.id)
        console.log('Titre:', msg.title)
        console.log('Message:', msg.message?.substring(0, 100) + '...')
        console.log('Actif:', msg.is_active)
        console.log('valid_from:', msg.valid_from)
        console.log('valid_until:', msg.valid_until)
        console.log('times:', msg.times)
        console.log('image:', msg.image)
      })
    } else {
      console.log('⚠️  Aucun message Joumou\'a actif trouvé!')
    }

    // Aussi récupérer tous les messages (actifs ou non)
    const allMessages = await directusClient.request(
      readItems('jumua_messages', {
        limit: -1,
      })
    )

    console.log('\n=== Tous les messages (actifs + inactifs) ===')
    console.log('Total:', allMessages.length)

  } catch (error) {
    console.error('Erreur:', error)
  }
}

main()
