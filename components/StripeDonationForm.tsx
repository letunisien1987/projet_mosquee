'use client'

/**
 * Formulaire de don via Stripe Checkout
 *
 * ⚠️ SÉCURITÉ:
 * - Le paiement est géré par Stripe Checkout (page sécurisée)
 * - La clé secrète n'est JAMAIS exposée au client
 * - Redirection directe vers Stripe (pas de clé publique nécessaire)
 */

import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'

interface StripeDonationFormProps {
  projectId: string
  projectTitle: string
  presetAmounts?: number[] // Montants prédéfinis en centimes
}

export default function StripeDonationForm({
  projectId,
  projectTitle,
  presetAmounts = [2000, 5000, 10000, 20000], // 20, 50, 100, 200 CHF
}: StripeDonationFormProps) {
  const [amount, setAmount] = useState<number>(5000) // 50 CHF par défaut
  const [customAmount, setCustomAmount] = useState<string>('')
  const [donorName, setDonorName] = useState<string>('')
  const [donorEmail, setDonorEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Calculer le montant final (custom ou preset)
      const finalAmount = customAmount
        ? Math.round(parseFloat(customAmount) * 100) // Convertir CHF en centimes
        : amount

      if (finalAmount < 100) {
        setError('Le montant minimum est de 1 CHF')
        setLoading(false)
        return
      }

      // Créer une session Stripe Checkout via notre API
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          projectId,
          projectTitle,
          donorEmail,
          donorName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      // Rediriger vers Stripe Checkout (URL sécurisée)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de paiement manquante')
      }
    } catch (err: any) {
      console.error('Erreur don Stripe:', err)
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Montants prédéfinis */}
      <div>
        <label className="block text-sm font-medium mb-3">
          Choisissez un montant
        </label>
        <div className="grid grid-cols-2 gap-3">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset)
                setCustomAmount('')
              }}
              className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                amount === preset && !customAmount
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              {preset / 100} CHF
            </button>
          ))}
        </div>
      </div>

      {/* Montant personnalisé */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Ou entrez un montant personnalisé (CHF)
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Montant personnalisé"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Informations du donateur */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Votre nom complet
        </label>
        <input
          type="text"
          required
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Prénom Nom"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Votre email
        </label>
        <input
          type="email"
          required
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirection vers Stripe...
          </>
        ) : (
          <>
            <Heart className="h-5 w-5" />
            Faire un don de {customAmount ? parseFloat(customAmount).toFixed(2) : (amount / 100).toFixed(2)} CHF
          </>
        )}
      </button>

      {/* Sécurité Stripe */}
      <p className="text-xs text-gray-500 text-center">
        Paiement sécurisé par Stripe. Vos informations bancaires ne sont jamais stockées sur notre serveur.
      </p>
    </form>
  )
}
