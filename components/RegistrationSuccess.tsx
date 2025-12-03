'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

interface RegistrationSuccessProps {
  title?: string
  message: string
  additionalMessage?: string  // Ex: info sur le paiement
  backHref: string
  backLabel: string
  showMyRegistrations?: boolean
  myRegistrationsHref?: string
  myRegistrationsLabel?: string
  accentColor?: string  // 'bg-red-600 hover:bg-red-700'
}

export function RegistrationSuccess({
  title = 'Inscription confirmée !',
  message,
  additionalMessage,
  backHref,
  backLabel,
  showMyRegistrations = false,
  myRegistrationsHref = '/membre/inscriptions',
  myRegistrationsLabel = 'Voir mes inscriptions',
  accentColor = 'bg-red-600 hover:bg-red-700'
}: RegistrationSuccessProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>

        {additionalMessage && (
          <p className="text-sm text-amber-600 mb-4">{additionalMessage}</p>
        )}

        <div className="space-y-2">
          <Link
            href={backHref}
            className={`block w-full ${accentColor} text-white py-3 rounded-lg font-semibold transition-colors`}
          >
            {backLabel}
          </Link>

          {showMyRegistrations && (
            <Link
              href={myRegistrationsHref}
              className="block w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors"
            >
              {myRegistrationsLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
