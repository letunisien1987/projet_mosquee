/**
 * Script pour importer les transactions depuis RaiseNow via leur API
 *
 * Usage:
 * RAISENOW_API_KEY="votre_cle_api" npx tsx scripts/import-raisenow-transactions.ts
 */

const RAISENOW_API_URL = process.env.RAISENOW_API_URL || 'https://api.raisenow.io/v1'
const RAISENOW_API_KEY = process.env.RAISENOW_API_KEY || ''

console.log('🔄 Import des transactions RaiseNow\n')
console.log('═══════════════════════════════════════════════════════════════\n')

async function importTransactions() {
  if (!RAISENOW_API_KEY) {
    console.error('❌ RAISENOW_API_KEY non configuré')
    console.log('\nPour obtenir votre clé API :')
    console.log('1. Connectez-vous à https://backoffice.raisenow.io')
    console.log('2. Settings → API Keys')
    console.log('3. Créez une nouvelle clé API')
    console.log('4. Copiez la clé\n')
    console.log('Puis lancez :')
    console.log('RAISENOW_API_KEY="votre_cle" npx tsx scripts/import-raisenow-transactions.ts\n')
    process.exit(1)
  }

  try {
    console.log('📡 Connexion à l\'API RaiseNow...\n')

    // Récupérer les transactions
    const response = await fetch(`${RAISENOW_API_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${RAISENOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const transactions = data.data || data.transactions || []

    console.log(`✅ ${transactions.length} transaction(s) trouvée(s)\n`)

    if (transactions.length === 0) {
      console.log('ℹ️  Aucune transaction à importer')
      return
    }

    // Afficher les transactions
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║              TRANSACTIONS RÉCUPÉRÉES                     ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')

    transactions.forEach((tx: any, index: number) => {
      console.log(`${index + 1}. Transaction #${tx.id || tx.transaction_id}`)
      console.log(`   💰 Montant: ${tx.amount} ${tx.currency}`)
      console.log(`   👤 Donateur: ${tx.firstname} ${tx.lastname}`)
      console.log(`   📧 Email: ${tx.email}`)
      console.log(`   📅 Date: ${tx.created_at || tx.date}`)
      console.log(`   📊 Statut: ${tx.status}`)
      console.log('')
    })

    // TODO: Importer dans la base de données
    console.log('💾 Pour importer dans la base de données, utilisez :')
    console.log('   POST /api/donations/webhook pour chaque transaction\n')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)

    if (error.message.includes('401')) {
      console.log('\n💡 Votre clé API est invalide ou expirée')
      console.log('   Vérifiez votre clé dans le backoffice RaiseNow\n')
    }
  }
}

importTransactions()
  .then(() => {
    console.log('✅ Script terminé\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur:', error.message)
    process.exit(1)
  })
