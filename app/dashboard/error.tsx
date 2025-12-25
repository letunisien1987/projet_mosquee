'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Erreur dashboard:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Erreur de chargement
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Impossible de charger cette page. Veuillez réessayer.
        </p>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )
}
