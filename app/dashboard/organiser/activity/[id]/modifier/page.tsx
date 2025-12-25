'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ActivityForm, { ActivityData } from '@/components/forms/ActivityForm'

export default function ModifierActiviteOrganisateurPage() {
  const { status } = useSession()
  const params = useParams()
  const activityId = params.id as string

  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activityId) {
      fetchActivity()
    }
  }, [activityId])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/membre/organisateur/activity/${activityId}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data.activity)
      } else {
        const data = await res.json()
        setError(data.error || 'Activité non trouvée')
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      </div>
    )
  }

  if (!activity) {
    return null
  }

  return (
    <ActivityForm
      activity={activity}
      mode="edit"
      apiEndpoint={`/api/membre/organisateur/activity/${activityId}`}
      backUrl={`/dashboard/organiser/activity/${activityId}`}
      successUrl={`/dashboard/organiser/activity/${activityId}`}
      showManagerField={false}
      title="Modifier l'activité"
    />
  )
}
