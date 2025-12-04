'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Phone,
  CreditCard,
  Check,
  X,
} from 'lucide-react'

interface Enrollment {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: string
  paymentAmount?: number
  paymentId?: string
  notes?: string
  createdAt: string
}

interface ActivityDetail {
  id: string
  title: string
  schedule?: string
  price?: number
  max_capacity?: number
  requires_approval: boolean
  published: boolean
}

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user && id) {
      fetchData()
    }
  }, [session, id])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/membre/organisateur/activity/${id}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data.activity)
        setEnrollments(data.enrollments)
      } else if (res.status === 403) {
        setError("Vous n'êtes pas autorisé à voir cette activité")
      } else {
        setError('Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (enrollmentId: string) => {
    setActionLoading(enrollmentId)
    try {
      const res = await fetch(`/api/membre/organisateur/activity/${id}/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (enrollmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette inscription ?')) return
    setActionLoading(enrollmentId)
    try {
      const res = await fetch(`/api/membre/organisateur/activity/${id}/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <Link href="/membre/organisateur" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const filteredEnrollments = enrollments.filter(
    (e) => filter === 'ALL' || e.status === filter
  )

  const stats = {
    pending: enrollments.filter((e) => e.status === 'PENDING').length,
    approved: enrollments.filter((e) => e.status === 'APPROVED').length,
    active: enrollments.filter((e) => e.status === 'ACTIVE').length,
    cancelled: enrollments.filter((e) => e.status === 'CANCELLED').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Actif
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CreditCard className="h-3 w-3" />
            À payer
          </span>
        )
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            {status === 'REJECTED' ? 'Refusé' : 'Annulé'}
          </span>
        )
      default:
        return <span className="text-xs text-gray-500">{status}</span>
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/membre/organisateur"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Activité
                </span>
                {activity?.published ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Publié
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    Brouillon
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {activity?.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {activity?.schedule && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {activity.schedule}
                  </span>
                )}
                {activity?.price !== undefined && activity.price > 0 && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {activity.price} CHF
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/membre/organisateur/activity/${id}/modifier`}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Modifier
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            filter === 'PENDING'
              ? 'bg-amber-100 border-amber-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-amber-50'
          }`}
          onClick={() => setFilter(filter === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <p className="text-sm text-amber-700">En attente</p>
          <p className="text-2xl font-bold text-amber-800">{stats.pending}</p>
        </div>
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            filter === 'APPROVED'
              ? 'bg-blue-100 border-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50'
          }`}
          onClick={() => setFilter(filter === 'APPROVED' ? 'ALL' : 'APPROVED')}
        >
          <p className="text-sm text-blue-700">À payer</p>
          <p className="text-2xl font-bold text-blue-800">{stats.approved}</p>
        </div>
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            filter === 'ACTIVE'
              ? 'bg-green-100 border-green-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50'
          }`}
          onClick={() => setFilter(filter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        >
          <p className="text-sm text-green-700">Actifs</p>
          <p className="text-2xl font-bold text-green-800">{stats.active}</p>
        </div>
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            filter === 'CANCELLED'
              ? 'bg-red-100 border-red-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-red-50'
          }`}
          onClick={() => setFilter(filter === 'CANCELLED' ? 'ALL' : 'CANCELLED')}
        >
          <p className="text-sm text-red-700">Annulés</p>
          <p className="text-2xl font-bold text-red-800">{stats.cancelled}</p>
        </div>
      </div>

      {/* Liste des inscriptions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Inscriptions ({filteredEnrollments.length})
          </h2>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="text-sm text-blue-600 hover:underline"
            >
              Voir tout
            </button>
          )}
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune inscription</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEnrollments.map((enr) => (
              <div key={enr.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {enr.firstName} {enr.lastName}
                      </span>
                      {getStatusBadge(enr.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {enr.email}
                      </span>
                      {enr.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {enr.phone}
                        </span>
                      )}
                      {enr.paymentAmount && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {enr.paymentAmount.toFixed(2)} CHF
                          {enr.paymentId && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {enr.status === 'PENDING' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(enr.id)}
                        disabled={actionLoading === enr.id}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Approuver"
                      >
                        {actionLoading === enr.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(enr.id)}
                        disabled={actionLoading === enr.id}
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
    </div>
  )
}
