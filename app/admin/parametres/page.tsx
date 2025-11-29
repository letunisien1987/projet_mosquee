'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, Save, Loader2 } from 'lucide-react'

export default function ParametresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [jumuaMessage, setJumuaMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setJumuaMessage(data.jumuaMessage || '')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jumuaMessage,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès!' })
      } else {
        throw new Error('Erreur lors de l\'enregistrement')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement des paramètres' })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres de la Mosquée</h1>
          <p className="text-muted-foreground">Gérez les paramètres et messages personnalisés</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Message du Joumou'a */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Message du Joumou'a</h2>
            <p className="text-sm text-muted-foreground">
              Ce message s'affichera dans la carte Joumou'a sur la page d'accueil.
              Si vous laissez vide, un message par défaut sera affiché.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="jumuaMessage" className="block text-sm font-medium">
              Message personnalisé
            </label>
            <textarea
              id="jumuaMessage"
              value={jumuaMessage}
              onChange={(e) => setJumuaMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Ex: Khoutba spéciale ce vendredi sur la gratitude. Venez nombreux avec vos familles!"
            />
            <p className="text-xs text-muted-foreground">
              {jumuaMessage.length} caractères
            </p>
          </div>

          {/* Aperçu */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Aperçu du message:</h3>
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold mb-2 text-sm text-indigo-700 dark:text-indigo-300">
                Message du vendredi
              </h4>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {jumuaMessage || "Que la paix et les bénédictions d'Allah soient sur vous. Venez nombreux assister à la prière du Joumou'a."}
              </p>
            </div>
          </div>
        </div>

        {/* Message de confirmation */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Bouton Enregistrer */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer les paramètres
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
