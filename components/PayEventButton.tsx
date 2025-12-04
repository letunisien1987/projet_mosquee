'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

interface PayEventButtonProps {
  registrationId: string
  eventId: string
  amount: number
}

export default function PayEventButton({ registrationId, eventId, amount }: PayEventButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    // Rediriger vers l'API de checkout qui redirigera vers Stripe
    window.location.href = `/api/events/${eventId}/checkout?registrationId=${registrationId}`
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirection...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          Payer {amount.toFixed(2)} CHF
        </>
      )}
    </button>
  )
}
