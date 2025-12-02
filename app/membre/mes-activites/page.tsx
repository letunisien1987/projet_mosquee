'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  CreditCard,
} from 'lucide-react'

interface ActivityWithStats {
  id: string
  title: string
  category: string
  schedule?: string
  price?: number
  requires_approval: boolean
  active: boolean
  enrollment_open: boolean
  stats: {
    pending: number
    approved: number
    active: number
    rejected: number
    cancelled: number
    total: number
  }
}

export default function MesActivitesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchActivities()
    }
  }, [session])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/membre/mes-activites')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities)
      } else {
        setError('Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  // Calcul des totaux
  const totalPending = activities.reduce((acc, a) => acc + a.stats.pending, 0)
  const totalActive = activities.reduce((acc, a) => acc + a.stats.active, 0)
  const totalApproved = activities.reduce((acc, a) => acc + a.stats.approved, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Mes Activités</h1>
          <p className="text-white/80">
            Gérez les inscriptions et participants de vos activités
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activités gérées</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paiement en attente</p>
                <p className="text-2xl font-bold text-blue-600">{totalApproved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Participants actifs</p>
                <p className="text-2xl font-bold text-green-600">{totalActive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des activités */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune activité assignée</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Vous n'êtes responsable d'aucune activité pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/membre/mes-activites/${activity.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{activity.title}</h3>
                        {activity.requires_approval && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            Validation requise
                          </span>
                        )}
                        {activity.price && activity.price > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {activity.price} CHF
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {activity.schedule && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {activity.schedule}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {activity.stats.total} inscription(s)
                        </span>
                      </div>
                    </div>

                    {/* Stats rapides */}
                    <div className="flex items-center gap-6">
                      {activity.stats.pending > 0 && (
                        <div className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full font-bold">
                            {activity.stats.pending}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">En attente</p>
                        </div>
                      )}

                      {activity.stats.approved > 0 && (
                        <div className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-bold">
                            {activity.stats.approved}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">À payer</p>
                        </div>
                      )}

                      <div className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-bold">
                          {activity.stats.active}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Actifs</p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
