'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  Edit,
  CreditCard,
  LayoutGrid,
  List,
} from 'lucide-react'

interface OfferingWithStats {
  id: string
  item_type: 'EVENT' | 'ACTIVITY'
  title: string
  slug: string
  category: string
  date?: string
  schedule?: string
  price?: number
  max_capacity?: number
  requires_approval: boolean
  published: boolean
  registrationCount: number
  stats: {
    pending: number
    approved: number
    confirmed: number
    active: number
    cancelled: number
    total: number
  }
}

export default function OrganisateurPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offerings, setOfferings] = useState<OfferingWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'EVENT' | 'ACTIVITY'>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchOfferings()
    }
  }, [session])

  const fetchOfferings = async () => {
    try {
      const res = await fetch('/api/membre/organisateur/offerings')
      if (res.ok) {
        const data = await res.json()
        setOfferings(data.offerings)
      } else if (res.status === 403) {
        setError("Vous n'êtes responsable d'aucune offre")
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Filtrer
  const filteredOfferings = offerings.filter((o) => filter === 'ALL' || o.item_type === filter)

  // Stats globales
  const totalPending = offerings.reduce((acc, o) => acc + o.stats.pending, 0)
  const totalPendingPayment = offerings.reduce((acc, o) => acc + o.stats.approved, 0)
  const totalActive = offerings.reduce(
    (acc, o) => acc + o.stats.confirmed + o.stats.active,
    0
  )
  const eventsCount = offerings.filter((o) => o.item_type === 'EVENT').length
  const activitiesCount = offerings.filter((o) => o.item_type === 'ACTIVITY').length

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Espace Organisateur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos événements et activités
          </p>
        </div>
        <Link
          href="/dashboard/organiser/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Nouvelle offre
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Événements</p>
              <p className="text-2xl font-bold">{eventsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activités</p>
              <p className="text-2xl font-bold">{activitiesCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">À payer</p>
              <p className="text-2xl font-bold text-indigo-600">{totalPendingPayment}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-2xl font-bold text-green-600">{totalActive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et vue */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tout ({offerings.length})
          </button>
          <button
            onClick={() => setFilter('EVENT')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'EVENT'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200'
            }`}
          >
            Événements ({eventsCount})
          </button>
          <button
            onClick={() => setFilter('ACTIVITY')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'ACTIVITY'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200'
            }`}
          >
            Activités ({activitiesCount})
          </button>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800">
          {error}
        </div>
      )}

      {/* Liste des offres */}
      {filteredOfferings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune offre</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {filter === 'ALL'
              ? "Vous n'êtes responsable d'aucune offre"
              : filter === 'EVENT'
                ? "Vous n'avez aucun événement"
                : "Vous n'avez aucune activité"}
          </p>
          <Link
            href="/dashboard/organiser/nouveau"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Créer une offre
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfferings.map((offering) => (
            <div
              key={`${offering.item_type}-${offering.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {offering.item_type === 'EVENT' ? (
                    <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </span>
                  ) : (
                    <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      offering.published
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {offering.published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/dashboard/organiser/${offering.item_type.toLowerCase()}/${offering.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Voir les inscriptions"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/dashboard/organiser/${offering.item_type.toLowerCase()}/${offering.id}/modifier`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2 line-clamp-2">{offering.title}</h3>

              <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                {offering.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(offering.date).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {offering.schedule && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {offering.schedule}
                  </span>
                )}
                {offering.price !== undefined && offering.price > 0 && (
                  <span className="text-emerald-600 font-medium">{offering.price} CHF</span>
                )}
              </div>

              {/* Stats rapides */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {offering.stats.pending > 0 && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold">
                      {offering.stats.pending}
                    </span>
                    <span className="text-xs">attente</span>
                  </div>
                )}
                {offering.stats.approved > 0 && (
                  <div className="flex items-center gap-1 text-indigo-600">
                    <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold">
                      {offering.stats.approved}
                    </span>
                    <span className="text-xs">à payer</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-green-600 ml-auto">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">
                    {offering.stats.confirmed + offering.stats.active}
                  </span>
                  {offering.max_capacity && (
                    <span className="text-gray-400">/ {offering.max_capacity}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Titre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date/Horaire
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  En attente
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Confirmés
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOfferings.map((offering) => (
                <tr
                  key={`${offering.item_type}-${offering.id}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3">
                    {offering.item_type === 'EVENT' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">
                        <Calendar className="h-3 w-3" />
                        Événement
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                        <BookOpen className="h-3 w-3" />
                        Activité
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{offering.title}</div>
                    {!offering.published && (
                      <span className="text-xs text-gray-500">(Brouillon)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {offering.date
                      ? new Date(offering.date).toLocaleDateString('fr-FR')
                      : offering.schedule || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {offering.stats.pending > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        {offering.stats.pending}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-green-600">
                      {offering.stats.confirmed + offering.stats.active}
                    </span>
                    {offering.max_capacity && (
                      <span className="text-gray-400">/{offering.max_capacity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/dashboard/organiser/${offering.item_type.toLowerCase()}/${offering.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/organiser/${offering.item_type.toLowerCase()}/${offering.id}/modifier`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
