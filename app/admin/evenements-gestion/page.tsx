'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Users,
  Clock,
  Check,
  X,
  ArrowLeft,
  MapPin,
  Star,
  CreditCard,
  Repeat,
  User,
} from 'lucide-react'

interface Event {
  id: string
  title: string
  slug: string
  category: string
  description?: string
  date: string
  start_time?: string
  end_time?: string
  location?: string
  max_capacity?: number
  registration_required: boolean
  requires_approval: boolean
  featured: boolean
  published: boolean
  registrationCount: number
  // Paiement
  price?: number
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscription_interval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  // Responsable
  manager_id?: string
  manager_email?: string
}

const categoryLabels: Record<string, string> = {
  religieux: 'Religieux',
  communaute: 'Communauté',
  education: 'Éducation',
  charite: 'Charité',
}

const categoryColors: Record<string, string> = {
  religieux: 'bg-green-100 text-green-700',
  communaute: 'bg-blue-100 text-blue-700',
  education: 'bg-purple-100 text-purple-700',
  charite: 'bg-amber-100 text-amber-700',
}

const paymentTypeLabels: Record<string, string> = {
  FREE: 'Gratuit',
  ONE_TIME: 'Paiement unique',
  SUBSCRIPTION: 'Abonnement',
}

const subscriptionIntervalLabels: Record<string, string> = {
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel',
}

export default function EvenementsGestionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchEvents()
    }
  }, [session])

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/evenements-gestion')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      } else {
        setError('Erreur lors du chargement')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (event: Event) => {
    if (!confirm(`Supprimer l'événement "${event.title}" ?`)) return

    setDeleteLoading(event.id)
    try {
      const res = await fetch(`/api/admin/evenements-gestion/${event.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setEvents(events.filter(e => e.id !== event.id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setDeleteLoading(null)
    }
  }

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const publishedCount = events.filter(e => e.published).length
  const upcomingCount = events.filter(e => new Date(e.date) >= new Date()).length
  const totalRegistrations = events.reduce((acc, e) => acc + e.registrationCount, 0)
  const paidEventsCount = events.filter(e => e.payment_type && e.payment_type !== 'FREE').length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="h-7 w-7 text-primary" />
              Gestion des Événements
            </h1>
            <p className="text-gray-500 mt-1">
              Créez et gérez les événements de la mosquée
            </p>
          </div>
          <Link
            href="/admin/evenements-gestion/nouveau"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvel événement
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total événements</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Publiés</p>
              <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">À venir</p>
              <p className="text-2xl font-bold text-amber-600">{upcomingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total inscrits</p>
              <p className="text-2xl font-bold text-purple-600">{totalRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Payants</p>
              <p className="text-2xl font-bold text-emerald-600">{paidEventsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Liste des événements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold">Événement</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Catégorie</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Paiement</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Responsable</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Inscrits</th>
              <th className="px-4 py-4 text-left text-sm font-semibold">Statut</th>
              <th className="px-4 py-4 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEvents.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {event.featured && (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    )}
                    <div>
                      <span className="font-medium">{event.title}</span>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${categoryColors[event.category] || 'bg-gray-100 text-gray-700'}`}>
                    {categoryLabels[event.category] || event.category}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(event.date)}
                  </div>
                  {event.start_time && (
                    <div className="text-xs text-gray-500 mt-1">
                      {event.start_time}{event.end_time && ` - ${event.end_time}`}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  {event.payment_type === 'FREE' || !event.payment_type ? (
                    <span className="text-gray-500 text-sm">Gratuit</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        {event.payment_type === 'SUBSCRIPTION' ? (
                          <Repeat className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                        )}
                        <span className="font-medium text-emerald-700">{event.price} CHF</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {paymentTypeLabels[event.payment_type]}
                        {event.payment_type === 'SUBSCRIPTION' && event.subscription_interval && (
                          <> ({subscriptionIntervalLabels[event.subscription_interval]})</>
                        )}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  {event.manager_email ? (
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="truncate max-w-[120px]" title={event.manager_email}>
                        {event.manager_email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {event.registration_required ? (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{event.registrationCount}</span>
                      {event.max_capacity && (
                        <span className="text-gray-400">/ {event.max_capacity}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Libre</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    {event.published ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <Check className="h-3 w-3" /> Publié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                        <X className="h-3 w-3" /> Brouillon
                      </span>
                    )}
                    {event.requires_approval && (
                      <span className="text-xs text-blue-600">Validation requise</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/evenements-gestion/${event.id}/modifier`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(event)}
                      disabled={deleteLoading === event.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deleteLoading === event.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEvents.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? 'Aucun événement trouvé' : 'Aucun événement créé'}
          </div>
        )}
      </div>
    </div>
  )
}
