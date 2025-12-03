'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
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
  DollarSign,
} from 'lucide-react'

interface Activity {
  id: string
  title: string
  slug: string
  category: string
  description?: string
  schedule?: string
  instructor?: string
  max_participants?: number
  price?: number
  active: boolean
  enrollment_open: boolean
  requires_approval: boolean
  enrollmentCount: number
}

const categoryLabels: Record<string, string> = {
  coran: 'Coran',
  arabe: 'Arabe',
  ecole: 'École',
  tajweed: 'Tajweed',
  hifz: 'Hifz',
  halaqat: 'Halaqat',
  autre: 'Autre',
}

const categoryColors: Record<string, string> = {
  coran: 'bg-green-100 text-green-700',
  arabe: 'bg-blue-100 text-blue-700',
  ecole: 'bg-purple-100 text-purple-700',
  tajweed: 'bg-amber-100 text-amber-700',
  hifz: 'bg-rose-100 text-rose-700',
  halaqat: 'bg-cyan-100 text-cyan-700',
  autre: 'bg-gray-100 text-gray-700',
}

export default function ActivitesAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activities, setActivities] = useState<Activity[]>([])
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
      fetchActivities()
    }
  }, [session])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/admin/activites')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities)
      } else {
        setError('Erreur lors du chargement')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (activity: Activity) => {
    if (!confirm(`Supprimer l'activité "${activity.title}" ?`)) return

    setDeleteLoading(activity.id)
    try {
      const res = await fetch(`/api/admin/activites/${activity.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setActivities(activities.filter(a => a.id !== activity.id))
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

  const filteredActivities = activities.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const activeCount = activities.filter(a => a.active).length
  const totalEnrollments = activities.reduce((acc, a) => acc + a.enrollmentCount, 0)

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
              <BookOpen className="h-7 w-7 text-primary" />
              Gestion des Activités
            </h1>
            <p className="text-gray-500 mt-1">
              Créez et gérez les activités de la mosquée
            </p>
          </div>
          <Link
            href="/admin/activites/nouveau"
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouvelle activité
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total activités</p>
              <p className="text-2xl font-bold">{activities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actives</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
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
              <p className="text-2xl font-bold text-purple-600">{totalEnrollments}</p>
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
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Liste des activités */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Activité</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Catégorie</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Horaire</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Prix</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Inscrits</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Statut</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="font-medium">{activity.title}</div>
                  {activity.instructor && (
                    <div className="text-sm text-gray-500">
                      Par: {activity.instructor}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${categoryColors[activity.category] || 'bg-gray-100 text-gray-700'}`}>
                    {categoryLabels[activity.category] || activity.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {activity.schedule || '-'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm">
                    {activity.price ? (
                      <>
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {activity.price} CHF
                      </>
                    ) : (
                      <span className="text-green-600">Gratuit</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{activity.enrollmentCount}</span>
                    {activity.max_participants && (
                      <span className="text-gray-400">/ {activity.max_participants}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {activity.active ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                        <X className="h-3 w-3" /> Inactive
                      </span>
                    )}
                    {activity.enrollment_open ? (
                      <span className="text-xs text-blue-600">Inscriptions ouvertes</span>
                    ) : (
                      <span className="text-xs text-gray-400">Inscriptions fermées</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/activites/${activity.id}/modifier`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(activity)}
                      disabled={deleteLoading === activity.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deleteLoading === activity.id ? (
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

        {filteredActivities.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? 'Aucune activité trouvée' : 'Aucune activité créée'}
          </div>
        )}
      </div>
    </div>
  )
}
