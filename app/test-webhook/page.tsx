'use client'

import { useState } from 'react'

export default function TestWebhookPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testData, setTestData] = useState({
    epp_transaction_id: 'test_123456789',
    amount: '150.00',
    currency: 'CHF',
    stored_customer_firstname: 'Ahmed',
    stored_customer_lastname: 'Benali',
    stored_customer_email: 'ahmed.benali@example.com',
    stored_customer_phone: '+41 79 123 45 67',
    stored_customer_street: 'Rue de la Paix 10',
    stored_customer_zip_code: '2500',
    stored_customer_city: 'Bienne',
    stored_customer_country: 'CH',
    purpose: 'zsmgy', // Code du projet
    payment_method: 'card',
    language: 'fr',
    test_mode: true,
  })

  const sendTestWebhook = async () => {
    setLoading(true)
    setResult(null)

    // Générer un nouvel ID de transaction unique
    const dataToSend = {
      ...testData,
      epp_transaction_id: 'test_' + Date.now(),
    }

    try {
      const response = await fetch('/api/donations/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        status: response.status,
        data: data,
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Test Webhook RaiseNow</h1>

          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Cette page permet de tester la réception des données de don depuis RaiseNow.
          </p>

          {/* Données de test */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Données de test envoyées :</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>

          {/* Bouton de test */}
          <button
            onClick={sendTestWebhook}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi en cours...' : '📤 Envoyer le webhook de test'}
          </button>

          {/* Résultat */}
          {result && (
            <div className={`mt-6 p-6 rounded-lg ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
            }`}>
              <h3 className="text-xl font-bold mb-4">
                {result.success ? '✅ Succès !' : '❌ Erreur'}
              </h3>

              {result.success && (
                <div className="space-y-3 text-sm">
                  <p><strong>Statut HTTP:</strong> {result.status}</p>
                  <p><strong>ID du don créé:</strong> {result.data.donationId}</p>
                  <p><strong>Message:</strong> {result.data.message}</p>

                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded">
                    <p className="font-bold mb-2">Réponse complète :</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {result.error && (
                <p className="text-red-700 dark:text-red-300">{result.error}</p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-lg font-bold mb-3">📋 Instructions :</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Cliquez sur le bouton "Envoyer le webhook de test"</li>
              <li>Les données seront envoyées à <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/api/donations/webhook</code></li>
              <li>Le don sera enregistré dans la base de données</li>
              <li>Regardez les logs du serveur (terminal) pour voir les détails complets</li>
              <li>Vérifiez dans Prisma Studio : <a href="http://localhost:5555" target="_blank" className="text-primary underline">http://localhost:5555</a></li>
            </ol>
          </div>

          {/* Liens utiles */}
          <div className="mt-6 flex gap-4">
            <a
              href="/dons"
              className="flex-1 text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded transition-all"
            >
              ← Retour aux dons
            </a>
            <a
              href="http://localhost:5555"
              target="_blank"
              className="flex-1 text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded transition-all"
            >
              Ouvrir Prisma Studio →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
