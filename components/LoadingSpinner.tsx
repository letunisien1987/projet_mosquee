'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({
  message = 'Chargement...',
  className = ''
}: LoadingSpinnerProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}
