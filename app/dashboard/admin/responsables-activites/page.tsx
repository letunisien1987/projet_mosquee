'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  Check,
  Clock,
  Wand2,
} from 'lucide-react'

interface Activity {
  id: string
  title: string
  category: string
  schedule?: string
  price?: number
  requires_approval: boolean
  active: boolean
  manager_id?: string
  manager_email?: string
  manager?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface Event {
  id: string
  title: string
  category: string
  date: string
  location?: string
  registration_required: boolean
  published: boolean
  manager_id?: string
  manager_email?: string
  manager?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  IMAM: 'Imam',
  STAFF: 'Staff',
  TEACHER: 'Enseignant',
  MEMBER: 'Membre',
}

const categoryLabels: Record<string, string> = {
  religieux: 'Religieux',
  communaute: 'Communauté',
  education: 'Éducation',
  charite: 'Charité',
  coran: 'Coran',
  arabe: 'Arabe',
  ecole: 'École',
  tajweed: 'Tajweed',
  hifz: 'Hifz',
  halaqat: 'Halaqat',
  autre: 'Autre',
}

type TabType = 'activities' | 'events'

export default function ResponsablesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabType>('activities')
  const [activities, setActivities] = useState<Activity[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [potentialManagers, setPotentialManagers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Activity | Event | null>(null)
  const [selectedItemType, setSelectedItemType] = useState<'activity' | 'event'>('activity')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [assigningDefault, setAssigningDefault] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch activities and events in parallel
      const [activitiesRes, eventsRes] = await Promise.all([
        fetch('/api/admin/activities/managers'),
        fetch('/api/admin/events/managers'),
      ])

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData.activities)
        setPotentialManagers(activitiesData.potentialManagers)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.events)
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedItem || !selectedUser) return

    setActionLoading(selectedItem.id)
    try {
      const endpoint = selectedItemType === 'activity'
        ? '/api/admin/activities/managers'
        : '/api/admin/events/managers'

      const bodyKey = selectedItemType === 'activity' ? 'activityId' : 'eventId'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [bodyKey]: selectedItem.id,
          userId: selectedUser,
        }),
      })

      if (res.ok) {
        fetchData()
        setShowAssignModal(false)
        setSelectedItem(null)
        setSelectedUser('')
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (item: Activity | Event, type: 'activity' | 'event') => {
    if (!confirm('Retirer le responsable ?')) return

    setActionLoading(item.id)
    try {
      const endpoint = type === 'activity'
        ? '/api/admin/activities/managers'
        : '/api/admin/events/managers'

      const bodyKey = type === 'activity' ? 'activityId' : 'eventId'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [bodyKey]: item.id,
          userId: null,
        }),
      })

      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAssignDefault = async () => {
    if (!confirm('Assigner l\'admin comme responsable par défaut à tous les éléments sans responsable ?')) return

    setAssigningDefault(true)
    try {
      const res = await fetch('/api/admin/managers/assign-default', {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        alert(`${data.details.activitiesUpdated} activités et ${data.details.eventsUpdated} événements mis à jour`)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setAssigningDefault(false)
    }
  }

  const openAssignModal = (item: Activity | Event, type: 'activity' | 'event') => {
    setSelectedItem(item)
    setSelectedItemType(type)
    setShowAssignModal(true)
  }

  const filteredActivities = activities.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const activitiesWithManager = activities.filter((a) => a.manager).length
  const activitiesWithoutManager = activities.filter((a) => !a.manager).length
  const eventsWithManager = events.filter((e) => e.manager).length
  const eventsWithoutManager = events.filter((e) => !e.manager).length

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            Gestion des Responsables
          </h1>
          <p className="text-gray-500 mt-1">
            Assignez un responsable à chaque activité et événement
          </p>
        </div>
        <button
          onClick={handleAssignDefault}
          disabled={assigningDefault}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {assigningDefault ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Assigner Admin par défaut
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activités</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Événements</p>
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
              <p className="text-sm text-gray-500">Avec responsable</p>
              <p className="text-2xl font-bold text-green-600">
                {activitiesWithManager + eventsWithManager}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sans responsable</p>
              <p className="text-2xl font-bold text-amber-600">
                {activitiesWithoutManager + eventsWithoutManager}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'activities'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          Activités ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'events'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Calendar className="h-5 w-5" />
          Événements ({events.length})
        </button>
      </div>

      {/* Recherche */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Rechercher ${activeTab === 'activities' ? 'une activité' : 'un événement'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Liste des activités */}
      {activeTab === 'activities' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Activité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Horaire</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Responsable</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm text-gray-500">
                      {activity.price ? `${activity.price} CHF` : 'Gratuit'}
                      {activity.requires_approval && ' - Validation requise'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      {categoryLabels[activity.category] || activity.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {activity.schedule || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {activity.manager ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-medium text-sm">
                            {activity.manager.firstName[0]}
                            {activity.manager.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {activity.manager.firstName} {activity.manager.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{activity.manager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-600 text-sm">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {activity.manager ? (
                      <button
                        onClick={() => handleRemove(activity, 'activity')}
                        disabled={actionLoading === activity.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {actionLoading === activity.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                        Retirer
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssignModal(activity, 'activity')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-sm transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assigner
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredActivities.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Aucune activité trouvée
            </div>
          )}
        </div>
      )}

      {/* Liste des événements */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Événement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Responsable</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      {event.location || 'Lieu non spécifié'}
                      {!event.published && ' - Non publié'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                      {categoryLabels[event.category] || event.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString('fr-CH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {event.manager ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-medium text-sm">
                            {event.manager.firstName[0]}
                            {event.manager.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {event.manager.firstName} {event.manager.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{event.manager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-600 text-sm">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {event.manager ? (
                      <button
                        onClick={() => handleRemove(event, 'event')}
                        disabled={actionLoading === event.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {actionLoading === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                        Retirer
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssignModal(event, 'event')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-sm transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assigner
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEvents.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Aucun événement trouvé
            </div>
          )}
        </div>
      )}

      {/* Modal d'assignation */}
      {showAssignModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Assigner un responsable
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedItemType === 'activity' ? 'Activité' : 'Événement'}: <strong>{selectedItem.title}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Sélectionner un membre
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">-- Choisir un membre --</option>
                {potentialManagers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({roleLabels[user.role] || user.role})
                  </option>
                ))}
              </select>
              {selectedUser && (
                <p className="text-xs text-gray-500 mt-1">
                  Email: {potentialManagers.find(u => u.id === selectedUser)?.email}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedItem(null)
                  setSelectedUser('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedUser || actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
