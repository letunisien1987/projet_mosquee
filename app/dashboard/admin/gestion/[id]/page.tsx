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
  Phone,
  User,
  ExternalLink,
  CreditCard,
  Check,
  X,
  Filter,
} from 'lucide-react'

interface Offering {
  id: string
  itemType: 'EVENT' | 'ACTIVITY'
  title: string
  slug: string
  description?: string
  content?: string
  category: string
  activityCategory?: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  image?: string
  imageUrl?: string
  registrationDeadline?: string
  level?: string
  ageGroup?: string
  schedule?: string
  instructor?: string
  instructorName?: string
  enrollmentOpen?: boolean
  registrationRequired: boolean
  maxCapacity?: number
  maxParticipants?: number
  requiresApproval: boolean
  published: boolean
  featured: boolean
  price?: number
  paymentType?: string
  subscriptionInterval?: string
  allowRefund?: boolean
  cancellationDeadlineDays?: number
  managerId?: string
  managerEmail?: string
  // Contact organisateur
  showOrganizerName?: boolean
  showOrganizerEmail?: boolean
  showOrganizerPhone?: boolean
  // Tarification avancée
  pricing?: {
    adultPrice?: number
    childPrice?: number
    childFreeUntilAge?: number
    groupDiscount?: {
      enabled: boolean
      fromPersons: number
      discountPercent: number
    }
    familyMaxPrice?: number
    earlyBird?: {
      enabled: boolean
      untilDate?: string
      discountPercent: number
    }
  }
  restrictions?: {
    enabled: boolean
    participationType?: string
    allowedGender?: string
    minAge?: number
    maxAge?: number
  }
}

interface Stats {
  registrations: Array<{ status: string; _count: { _all: number } }>
  totalRegistrations: number
  enrollments?: Array<{ status: string; _count: { _all: number } }>
  totalEnrollments: number
  total: number
}

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: string
  participationType?: string
  numberOfAdults: number
  numberOfChildren: number
  paymentAmount?: number
  paymentId?: string
  notes?: string
  createdAt: string
}

export default function OfferingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [offering, setOffering] = useState<Offering | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchOffering()
  }, [resolvedParams.id])

  useEffect(() => {
    if (offering) {
      fetchRegistrations()
    }
  }, [offering])

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

  const fetchRegistrations = async () => {
    setLoadingRegistrations(true)
    try {
      const response = await fetch(`/api/admin/offerings/${resolvedParams.id}/registrations`)
      const data = await response.json()

      if (response.ok) {
        setRegistrations(data.registrations || [])
      }
    } catch (err) {
      console.error('Erreur chargement inscriptions:', err)
    } finally {
      setLoadingRegistrations(false)
    }
  }

  const handleApprove = async (registrationId: string) => {
    setActionLoading(registrationId)
    try {
      const res = await fetch(
        `/api/admin/offerings/${resolvedParams.id}/registrations/${registrationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' }),
        }
      )
      if (res.ok) {
        fetchRegistrations()
        fetchOffering()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (registrationId: string) => {
    if (!confirm('Etes-vous sur de vouloir refuser cette inscription ?')) return
    setActionLoading(registrationId)
    try {
      const res = await fetch(
        `/api/admin/offerings/${resolvedParams.id}/registrations/${registrationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject' }),
        }
      )
      if (res.ok) {
        fetchRegistrations()
        fetchOffering()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            {status === 'ACTIVE' ? 'Actif' : 'Confirme'}
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        )
      case 'PENDING_PAYMENT':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <CreditCard className="h-3 w-3" />
            A payer
          </span>
        )
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            {status === 'REJECTED' ? 'Refuse' : 'Annule'}
          </span>
        )
      default:
        return <span className="text-xs text-gray-500">{status}</span>
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
        <p className="text-gray-600 dark:text-gray-400">{error || 'Offre non trouvee'}</p>
        <Link
          href="/dashboard/admin/gestion"
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a la liste
        </Link>
      </div>
    )
  }

  const isEvent = offering.itemType === 'EVENT'
  const typeLabel = isEvent ? 'Evenement' : 'Activite'
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
      communaute: 'Communaute',
      education: 'Education',
      charite: 'Charite',
      coran: 'Coran',
      arabe: 'Arabe',
      ecole: 'Ecole',
      tajweed: 'Tajweed',
      hifz: 'Hifz',
      halaqat: 'Halaqat',
      autre: 'Autre',
    }
    return labels[cat] || cat
  }

  // Calcul des stats par statut
  const registrationStats = {
    pending: registrations.filter((r) => r.status === 'PENDING').length,
    pendingPayment: registrations.filter((r) => ['PENDING_PAYMENT', 'APPROVED'].includes(r.status)).length,
    confirmed: registrations.filter((r) => ['CONFIRMED', 'ACTIVE'].includes(r.status)).length,
    cancelled: registrations.filter((r) => ['CANCELLED', 'REJECTED'].includes(r.status)).length,
  }

  const filteredRegistrations = registrations.filter((r) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'PENDING') return r.status === 'PENDING'
    if (statusFilter === 'PENDING_PAYMENT') return ['PENDING_PAYMENT', 'APPROVED'].includes(r.status)
    if (statusFilter === 'CONFIRMED') return ['CONFIRMED', 'ACTIVE'].includes(r.status)
    if (statusFilter === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(r.status)
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                      Publie
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* Details selon le type */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isEvent ? 'Date et lieu' : 'Horaires et details'}
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
                          {offering.startTime || '-'} - {offering.endTime || '-'}
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
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date limite inscription</p>
                        <p className="text-gray-900 dark:text-white">{formatDate(offering.registrationDeadline)}</p>
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
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Groupe age</p>
                        <p className="text-gray-900 dark:text-white">{offering.ageGroup || '-'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section Inscriptions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Inscriptions ({registrations.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700"
                    >
                      <option value="ALL">Tous ({registrations.length})</option>
                      <option value="PENDING">En attente ({registrationStats.pending})</option>
                      <option value="PENDING_PAYMENT">A payer ({registrationStats.pendingPayment})</option>
                      <option value="CONFIRMED">Confirmes ({registrationStats.confirmed})</option>
                      <option value="CANCELLED">Annules ({registrationStats.cancelled})</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats rapides cliquables */}
              <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-100 border-2 border-amber-300 dark:bg-amber-900/30'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  <p className="text-lg font-bold text-amber-600">{registrationStats.pending}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'PENDING_PAYMENT' ? 'ALL' : 'PENDING_PAYMENT')}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    statusFilter === 'PENDING_PAYMENT'
                      ? 'bg-blue-100 border-2 border-blue-300 dark:bg-blue-900/30'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <p className="text-lg font-bold text-blue-600">{registrationStats.pendingPayment}</p>
                  <p className="text-xs text-gray-500">A payer</p>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    statusFilter === 'CONFIRMED'
                      ? 'bg-green-100 border-2 border-green-300 dark:bg-green-900/30'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                >
                  <p className="text-lg font-bold text-green-600">{registrationStats.confirmed}</p>
                  <p className="text-xs text-gray-500">Confirmes</p>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-red-100 border-2 border-red-300 dark:bg-red-900/30'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <p className="text-lg font-bold text-red-600">{registrationStats.cancelled}</p>
                  <p className="text-xs text-gray-500">Annules</p>
                </button>
              </div>

              {/* Liste des inscriptions */}
              {loadingRegistrations ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune inscription</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRegistrations.map((reg) => (
                    <div key={reg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {reg.firstName} {reg.lastName}
                            </span>
                            {getStatusBadge(reg.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {reg.email}
                            </span>
                            {reg.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {reg.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {reg.numberOfAdults + reg.numberOfChildren} pers.
                            </span>
                            {reg.paymentAmount && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {Number(reg.paymentAmount).toFixed(2)} CHF
                                {reg.paymentId && (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                              </span>
                            )}
                          </div>
                          {reg.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                              {reg.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {reg.status === 'PENDING' && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApprove(reg.id)}
                              disabled={actionLoading === reg.id}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                              title="Approuver"
                            >
                              {actionLoading === reg.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(reg.id)}
                              disabled={actionLoading === reg.id}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              title="Refuser"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restrictions */}
            {offering.restrictions?.enabled && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Restrictions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de participation</p>
                    <p className="text-gray-900 dark:text-white">
                      {offering.restrictions.participationType === 'INDIVIDUAL' ? 'Individuel' :
                       offering.restrictions.participationType === 'FAMILY' ? 'Famille' : 'Mixte'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Genre autorise</p>
                    <p className="text-gray-900 dark:text-white">
                      {offering.restrictions.allowedGender === 'ALL' ? 'Tous' :
                       offering.restrictions.allowedGender === 'MALE' ? 'Hommes' :
                       offering.restrictions.allowedGender === 'FEMALE' ? 'Femmes' : 'Enfants'}
                    </p>
                  </div>
                  {(offering.restrictions.minAge || offering.restrictions.maxAge) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tranche age</p>
                      <p className="text-gray-900 dark:text-white">
                        {offering.restrictions.minAge || 0} - {offering.restrictions.maxAge || '∞'} ans
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne laterale */}
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total inscriptions</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total || 0}</span>
                </div>
                {offering.maxCapacity && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capacite</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {stats?.total || 0} / {offering.maxCapacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ((stats?.total || 0) / offering.maxCapacity) >= 1 ? 'bg-red-500' :
                          ((stats?.total || 0) / offering.maxCapacity) >= 0.8 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, ((stats?.total || 0) / offering.maxCapacity) * 100)}%` }}
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
                    {formatPrice(offering.price, offering.paymentType, offering.subscriptionInterval)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remboursable</span>
                  {offering.allowRefund ? (
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
                {offering.allowRefund && offering.cancellationDeadlineDays && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Delai annulation</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {offering.cancellationDeadlineDays} jours
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
                  <span className="text-gray-600 dark:text-gray-400">Categorie</span>
                  <span className="text-gray-900 dark:text-white">{getCategoryLabel(offering.category)}</span>
                </div>
                {!isEvent && offering.activityCategory && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type</span>
                    <span className="text-gray-900 dark:text-white">{getCategoryLabel(offering.activityCategory)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Inscription requise</span>
                  {offering.registrationRequired ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Approbation requise</span>
                  {offering.requiresApproval ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                {!isEvent && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Inscriptions ouvertes</span>
                    {offering.enrollmentOpen ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Responsable */}
            {offering.managerEmail && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Responsable</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`mailto:${offering.managerEmail}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      {offering.managerEmail}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Organisateur */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Organisateur</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Informations affichées aux visiteurs :</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {offering.showOrganizerName ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={offering.showOrganizerName ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      Nom de l&apos;organisateur
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {offering.showOrganizerEmail ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={offering.showOrganizerEmail ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      Email de l&apos;organisateur
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {offering.showOrganizerPhone ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={offering.showOrganizerPhone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                      Téléphone de l&apos;organisateur
                    </span>
                  </div>
                </div>
            </div>

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
                <p className="text-sm text-gray-500">Cette action est irreversible</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Etes-vous sur de vouloir supprimer &quot;{offering.title}&quot; ?
              {(stats?.total || 0) > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Attention : {stats?.total} inscription(s) associee(s) seront egalement supprimees.
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
