'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  Users,
  Clock,
  MapPin,
  DollarSign,
  Eye,
  EyeOff,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  User,
  ExternalLink,
} from 'lucide-react'

interface Offering {
  id: string
  item_type: 'EVENT' | 'ACTIVITY'
  title: string
  slug: string
  description?: string
  content?: string
  category: string
  activity_category?: string
  date?: string
  start_time?: string
  end_time?: string
  location?: string
  image?: string
  registration_deadline?: string
  level?: string
  age_group?: string
  schedule?: string
  instructor?: string
  enrollment_open?: boolean
  registration_required: boolean
  max_capacity?: number
  requires_approval: boolean
  published: boolean
  featured: boolean
  price?: number
  payment_type: string
  subscription_interval?: string
  allow_refund?: boolean
  cancellation_deadline_days?: number
  manager_id?: string
  manager_email?: string
  restrictions?: {
    enabled: boolean
    participation_type?: string
    allowed_gender?: string
    min_age?: number
    max_age?: number
  }
}

interface Stats {
  registrations: Array<{ status: string; _count: { _all: number } }>
  totalRegistrations: number
  enrollments?: Array<{ status: string; _count: { _all: number } }>
  totalEnrollments: number
  total: number
}

export default function OfferingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [offering, setOffering] = useState<Offering | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchOffering()
  }, [resolvedParams.id])

  const fetchOffering = async () => {
    try {
      const response = await fetch(`/api/admin/offerings/${resolvedParams.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setOffering(data.offering)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/offerings/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      router.push('/dashboard/admin/gestion')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !offering) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{error || 'Offre non trouvée'}</p>
        <Link
          href="/dashboard/admin/gestion"
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </div>
    )
  }

  const isEvent = offering.item_type === 'EVENT'
  const typeLabel = isEvent ? 'Événement' : 'Activité'
  const typeColor = isEvent ? 'indigo' : 'emerald'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-CH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatPrice = (price?: number | string, paymentType?: string, interval?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (!numPrice || numPrice === 0 || paymentType === 'FREE') return 'Gratuit'
    const formatted = `${numPrice.toFixed(2)} CHF`
    if (paymentType === 'SUBSCRIPTION') {
      const intervals: Record<string, string> = {
        WEEKLY: '/semaine',
        MONTHLY: '/mois',
        YEARLY: '/an',
      }
      return `${formatted}${intervals[interval || 'MONTHLY'] || ''}`
    }
    return formatted
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
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
    return labels[cat] || cat
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin/gestion"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-${typeColor}-100 text-${typeColor}-700 dark:bg-${typeColor}-900/30 dark:text-${typeColor}-300`}>
                    {isEvent ? <Calendar className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    {typeLabel}
                  </span>
                  {offering.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <Eye className="h-3 w-3" />
                      Publié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      <EyeOff className="h-3 w-3" />
                      Brouillon
                    </span>
                  )}
                  {offering.featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      <Star className="h-3 w-3" />
                      Mis en avant
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {offering.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/admin/gestion/${resolvedParams.id}/modifier`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(offering.description || offering.content) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
                {offering.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{offering.description}</p>
                )}
                {offering.content && (
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{offering.content}</p>
                  </div>
                )}
              </div>
            )}

            {/* Détails selon le type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isEvent ? 'Date et lieu' : 'Horaires et détails'}
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {isEvent ? (
                  <>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</p>
                        <p className="text-gray-900 dark:text-white">{formatDate(offering.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Horaires</p>
                        <p className="text-gray-900 dark:text-white">
                          {offering.start_time || '-'} - {offering.end_time || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lieu</p>
                        <p className="text-gray-900 dark:text-white">{offering.location || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date limite d&apos;inscription</p>
                        <p className="text-gray-900 dark:text-white">{formatDate(offering.registration_deadline)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Horaire</p>
                        <p className="text-gray-900 dark:text-white">{offering.schedule || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Instructeur</p>
                        <p className="text-gray-900 dark:text-white">{offering.instructor || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Niveau</p>
                        <p className="text-gray-900 dark:text-white">{offering.level || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Groupe d&apos;âge</p>
                        <p className="text-gray-900 dark:text-white">{offering.age_group || '-'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Restrictions */}
            {offering.restrictions?.enabled && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Restrictions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de participation</p>
                    <p className="text-gray-900 dark:text-white">
                      {offering.restrictions.participation_type === 'INDIVIDUAL' ? 'Individuel' :
                       offering.restrictions.participation_type === 'FAMILY' ? 'Famille' : 'Mixte'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Genre autorisé</p>
                    <p className="text-gray-900 dark:text-white">
                      {offering.restrictions.allowed_gender === 'ALL' ? 'Tous' :
                       offering.restrictions.allowed_gender === 'MALE' ? 'Hommes' :
                       offering.restrictions.allowed_gender === 'FEMALE' ? 'Femmes' : 'Enfants'}
                    </p>
                  </div>
                  {(offering.restrictions.min_age || offering.restrictions.max_age) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tranche d&apos;âge</p>
                      <p className="text-gray-900 dark:text-white">
                        {offering.restrictions.min_age || 0} - {offering.restrictions.max_age || '∞'} ans
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total inscriptions</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total || 0}</span>
                </div>
                {offering.max_capacity && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capacité</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {stats?.total || 0} / {offering.max_capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ((stats?.total || 0) / offering.max_capacity) >= 1 ? 'bg-red-500' :
                          ((stats?.total || 0) / offering.max_capacity) >= 0.8 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, ((stats?.total || 0) / offering.max_capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tarification */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarification</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Prix</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatPrice(offering.price, offering.payment_type, offering.subscription_interval)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remboursable</span>
                  {offering.allow_refund ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Oui
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Non
                    </span>
                  )}
                </div>
                {offering.allow_refund && offering.cancellation_deadline_days && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Délai d&apos;annulation</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {offering.cancellation_deadline_days} jours
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Catégorie</span>
                  <span className="text-gray-900 dark:text-white">{getCategoryLabel(offering.category)}</span>
                </div>
                {!isEvent && offering.activity_category && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type</span>
                    <span className="text-gray-900 dark:text-white">{getCategoryLabel(offering.activity_category)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Inscription requise</span>
                  {offering.registration_required ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Approbation requise</span>
                  {offering.requires_approval ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                {!isEvent && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Inscriptions ouvertes</span>
                    {offering.enrollment_open ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Responsable */}
            {offering.manager_email && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Responsable</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`mailto:${offering.manager_email}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      {offering.manager_email}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Lien public */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lien public</h2>
              <Link
                href={isEvent ? `/evenements/${offering.slug}` : `/activites/${offering.slug}`}
                target="_blank"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
              >
                <ExternalLink className="h-4 w-4" />
                Voir la page publique
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer &quot;{offering.title}&quot; ?
              {(stats?.total || 0) > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Attention : {stats?.total} inscription(s) associée(s) seront également supprimées.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
