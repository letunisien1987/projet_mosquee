'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CancelEventButtonProps {
  registrationId: string
  eventTitle: string
}

export default function CancelEventButton({ registrationId, eventTitle }: CancelEventButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCancel = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler votre participation à "${eventTitle}" ?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/membre/evenements/${registrationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation')
      }

      // Rafraîchir la page pour afficher les changements
      router.refresh()

      // Afficher un message de succès
      alert('Votre inscription a été annulée avec succès.')

    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isLoading}
        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Annulation en cours...' : 'Annuler ma participation'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
