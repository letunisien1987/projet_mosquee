'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import EventForm, { EventData } from '@/components/forms/EventForm'

export default function ModifierEvenementPage() {
  const { status } = useSession()
  const params = useParams()
  const eventId = params.id as string

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<EventData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/admin/evenements-gestion/${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setEvent(data.event)
      } else {
        setError('Événement non trouvé')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="p-8">
      <EventForm
        event={event}
        mode="edit"
        apiEndpoint={`/api/admin/evenements-gestion/${eventId}`}
        backUrl="/admin/evenements-gestion"
        successUrl="/admin/evenements-gestion"
        showManagerField={true}
        title="Modifier l'Événement"
      />
    </div>
  )
}
