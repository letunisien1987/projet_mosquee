'use client'

import { useEffect } from 'react'

export default function StudioPage() {
  useEffect(() => {
    // Rediriger vers le studio Sanity
    window.location.href = '/studio'
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirection vers Sanity Studio...
        </p>
      </div>
    </div>
  )
}
