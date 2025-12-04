'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  BookOpen,
  Plus,
  Search,
  Users,
  MapPin,
  Clock,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
  XCircle,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react'

// Types
interface Offering {
  id: string
  item_type: 'EVENT' | 'ACTIVITY'
  title: string
  slug: string
  description?: string
  category: string
  activity_category?: string
  date?: string
  start_time?: string
  end_time?: string
  location?: string
  schedule?: string
  instructor?: string
  level?: string
  age_group?: string
  max_capacity?: number
  price?: number
  payment_type?: string
  published: boolean
  featured?: boolean
  enrollment_open?: boolean
  requires_approval: boolean
  manager_email?: string
  registrationCount: number
  isManager: boolean
}

// Labels pour les catégories
const EVENT_CATEGORIES: Record<string, string> = {
  religieux: 'Religieux',
  communaute: 'Communauté',
  education: 'Éducation',
  charite: 'Charité',
}

const ACTIVITY_CATEGORIES: Record<string, string> = {
  coran: 'Coran',
  arabe: 'Arabe',
  ecole: 'École',
  tajweed: 'Tajweed',
  hifz: 'Hifz',
  halaqat: 'Halaqat',
  autre: 'Autre',
}

export default function AdminGestionPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EVENT' | 'ACTIVITY'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [counts, setCounts] = useState({ total: 0, events: 0, activities: 0 })
  const [isFullAccess, setIsFullAccess] = useState(false)

  // Charger les offres
  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setLoading(true)
        const typeParam = typeFilter !== 'ALL' ? `?type=${typeFilter}` : ''
        const response = await fetch(`/api/admin/offerings${typeParam}`)

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données')
        }

        const data = await response.json()
        setOfferings(data.offerings || [])
        setCounts(data.counts || { total: 0, events: 0, activities: 0 })
        setIsFullAccess(data.isFullAccess || false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setLoading(false)
      }
    }

    fetchOfferings()
  }, [typeFilter])

  // Filtrer par recherche
  const filteredOfferings = offerings.filter((o) =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Formater la date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Supprimer une offre
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return

    try {
      const response = await fetch(`/api/admin/offerings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setOfferings(offerings.filter((o) => o.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  // Carte d'offre
  const OfferingCard = ({ offering }: { offering: Offering }) => {
    const isEvent = offering.item_type === 'EVENT'
    const categoryLabel = isEvent
      ? EVENT_CATEGORIES[offering.category] || offering.category
      : ACTIVITY_CATEGORIES[offering.activity_category || 'autre'] || offering.category

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
        {/* Header avec badge type */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isEvent
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}
              >
                {isEvent ? 'Événement' : 'Activité'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{categoryLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              {offering.published ? (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" /> Publié
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <XCircle className="h-3 w-3" /> Brouillon
                </span>
              )}
            </div>
          </div>

          <h3 className="mt-2 font-semibold text-gray-900 dark:text-white line-clamp-2">
            {offering.title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Date/Schedule */}
          {isEvent && offering.date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(offering.date)}</span>
              {offering.start_time && <span>- {offering.start_time}</span>}
            </div>
          )}
          {!isEvent && offering.schedule && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{offering.schedule}</span>
            </div>
          )}

          {/* Location/Instructor */}
          {isEvent && offering.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{offering.location}</span>
            </div>
          )}
          {!isEvent && offering.instructor && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{offering.instructor}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                {offering.registrationCount}
                {offering.max_capacity && ` / ${offering.max_capacity}`}
              </span>
              {offering.price && offering.price > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                  {offering.price} CHF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
          <Link
            href={`/admin/gestion/${offering.id}`}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Voir détails"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`/admin/gestion/${offering.id}/modifier`}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </Link>
          {isFullAccess && (
            <button
              onClick={() => handleDelete(offering.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Liste view item
  const OfferingListItem = ({ offering }: { offering: Offering }) => {
    const isEvent = offering.item_type === 'EVENT'
    const categoryLabel = isEvent
      ? EVENT_CATEGORIES[offering.category] || offering.category
      : ACTIVITY_CATEGORIES[offering.activity_category || 'autre'] || offering.category

    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="px-4 py-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isEvent
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}
          >
            {isEvent ? 'Événement' : 'Activité'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{offering.title}</div>
            <div className="text-xs text-gray-500">{categoryLabel}</div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          {isEvent ? formatDate(offering.date) : offering.schedule || '-'}
        </td>
        <td className="px-4 py-3 text-sm text-center">
          {offering.registrationCount}
          {offering.max_capacity && ` / ${offering.max_capacity}`}
        </td>
        <td className="px-4 py-3 text-sm text-center">
          {offering.price ? `${offering.price} CHF` : 'Gratuit'}
        </td>
        <td className="px-4 py-3 text-center">
          {offering.published ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="h-3 w-3" /> Oui
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <XCircle className="h-3 w-3" /> Non
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/admin/gestion/${offering.id}`}
              className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/gestion/${offering.id}/modifier`}
              className="p-1.5 text-gray-500 hover:text-amber-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </Link>
            {isFullAccess && (
              <button
                onClick={() => handleDelete(offering.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des offres
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos événements et activités depuis une interface unique
          </p>
        </div>
        <Link
          href="/admin/gestion/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle offre
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <LayoutGrid className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Événements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.events}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activités</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.activities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Type filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'EVENT' | 'ACTIVITY')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="ALL">Tous les types</option>
              <option value="EVENT">Événements uniquement</option>
              <option value="ACTIVITY">Activités uniquement</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredOfferings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune offre trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'Aucun résultat pour votre recherche'
              : 'Commencez par créer votre première offre'}
          </p>
          <Link
            href="/admin/gestion/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Créer une offre
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfferings.map((offering) => (
            <OfferingCard key={`${offering.item_type}-${offering.id}`} offering={offering} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Horaire</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Inscriptions</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Publié</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOfferings.map((offering) => (
                <OfferingListItem key={`${offering.item_type}-${offering.id}`} offering={offering} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
