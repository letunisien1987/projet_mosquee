'use client'

import { useState } from 'react'

export default function ImportRaiseNowPage() {
  const [csvData, setCsvData] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!csvData.trim()) {
      alert('Veuillez coller les données CSV')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Parser le CSV (format simple)
      const lines = csvData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

      const transactions = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const transaction: any = {}

        headers.forEach((header, index) => {
          transaction[header] = values[index]
        })

        transactions.push(transaction)
      }

      console.log('Transactions parsées:', transactions)

      // Importer chaque transaction
      const results = []
      for (const tx of transactions) {
        // Adapter les noms de champs selon le format RaiseNow
        const webhookData = {
          epp_transaction_id: tx.transaction_id || tx.id || `import_${Date.now()}`,
          amount: tx.amount || tx.montant || '0',
          currency: tx.currency || tx.devise || 'CHF',
          stored_customer_firstname: tx.firstname || tx.prenom || '',
          stored_customer_lastname: tx.lastname || tx.nom || '',
          stored_customer_email: tx.email || '',
          stored_customer_phone: tx.phone || tx.telephone || '',
          stored_customer_street: tx.street || tx.rue || '',
          stored_customer_zip_code: tx.zip || tx.code_postal || '',
          stored_customer_city: tx.city || tx.ville || '',
          stored_customer_country: tx.country || tx.pays || 'CH',
          purpose: tx.purpose || tx.projet || '',
          payment_method: tx.payment_method || tx.methode_paiement || 'import',
          language: 'fr',
          test_mode: false,
        }

        const response = await fetch('/api/donations/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData),
        })

        const data = await response.json()
        results.push({
          transaction_id: webhookData.epp_transaction_id,
          success: response.ok,
          data,
        })
      }

      setResult({
        total: transactions.length,
        imported: results.filter(r => r.success).length,
        errors: results.filter(r => !r.success).length,
        details: results,
      })

    } catch (error: any) {
      setResult({
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Importer l'historique RaiseNow</h1>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-3">📋 Instructions :</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Connectez-vous au backoffice RaiseNow : <a href="https://backoffice.raisenow.io" target="_blank" className="text-primary underline">backoffice.raisenow.io</a></li>
                <li>Allez dans <strong>Transactions</strong> ou <strong>Reports</strong></li>
                <li>Exportez en <strong>CSV</strong> (Excel)</li>
                <li>Ouvrez le fichier CSV</li>
                <li>Copiez TOUT le contenu (Ctrl+A puis Ctrl+C)</li>
                <li>Collez ci-dessous</li>
              </ol>
            </div>

            {/* Champs attendus */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Colonnes CSV attendues :</p>
              <code className="text-xs">
                transaction_id, amount, currency, firstname, lastname, email, phone, street, zip, city, country, purpose
              </code>
              <p className="text-xs text-gray-500 mt-2">
                (Les noms exacts peuvent varier, le script s'adapte automatiquement)
              </p>
            </div>

            {/* Zone de texte CSV */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Collez les données CSV ici :
              </label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-700"
                placeholder="transaction_id,amount,currency,firstname,lastname,email&#10;tx_001,100,CHF,Ahmed,Benali,ahmed@example.com&#10;tx_002,50,CHF,Fatima,Said,fatima@example.com"
              />
            </div>

            {/* Bouton d'import */}
            <button
              onClick={handleImport}
              disabled={loading || !csvData.trim()}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Import en cours...' : '📥 Importer les transactions'}
            </button>

            {/* Résultat */}
            {result && (
              <div className={`p-6 rounded-lg ${
                result.error
                  ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
                  : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
              }`}>
                {result.error ? (
                  <>
                    <h3 className="text-xl font-bold mb-2 text-red-700">❌ Erreur</h3>
                    <p className="text-red-600">{result.error}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-4 text-green-700">✅ Import terminé !</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded">
                        <p className="text-2xl font-bold text-primary">{result.total}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded">
                        <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                        <p className="text-sm text-gray-600">Importés</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded">
                        <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                        <p className="text-sm text-gray-600">Erreurs</p>
                      </div>
                    </div>

                    {result.details && result.details.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer font-semibold">Voir les détails</summary>
                        <div className="mt-2 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded">
                          <pre className="text-xs">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Liens utiles */}
            <div className="flex gap-4">
              <a
                href="/admin"
                className="flex-1 text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded transition-all"
              >
                ← Retour admin
              </a>
              <a
                href="http://localhost:5555"
                target="_blank"
                className="flex-1 text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded transition-all"
              >
                Prisma Studio →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
