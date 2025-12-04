'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  CreditCard,
  Check,
  X,
  MoreVertical,
} from 'lucide-react'

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: string
  numberOfAdults: number
  numberOfChildren: number
  paymentAmount?: number
  paymentId?: string
  notes?: string
  createdAt: string
}

interface EventDetail {
  id: string
  title: string
  date?: string
  start_time?: string
  end_time?: string
  location?: string
  price?: number
  max_capacity?: number
  requires_approval: boolean
  published: boolean
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
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
      const res = await fetch(`/api/membre/organisateur/event/${id}`)
      if (res.ok) {
        const data = await res.json()
        setEvent(data.event)
        setRegistrations(data.registrations)
      } else if (res.status === 403) {
        setError("Vous n'êtes pas autorisé à voir cet événement")
      } else {
        setError('Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (registrationId: string) => {
    setActionLoading(registrationId)
    try {
      const res = await fetch(`/api/membre/organisateur/event/${id}/registrations/${registrationId}`, {
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

  const handleReject = async (registrationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette inscription ?')) return
    setActionLoading(registrationId)
    try {
      const res = await fetch(`/api/membre/organisateur/event/${id}/registrations/${registrationId}`, {
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <Link href="/membre/organisateur" className="text-emerald-600 hover:underline mt-4 inline-block">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const filteredRegistrations = registrations.filter(
    (r) => filter === 'ALL' || r.status === filter
  )

  const stats = {
    pending: registrations.filter((r) => r.status === 'PENDING').length,
    pendingPayment: registrations.filter((r) => r.status === 'PENDING_PAYMENT').length,
    confirmed: registrations.filter((r) => r.status === 'CONFIRMED').length,
    cancelled: registrations.filter((r) => r.status === 'CANCELLED').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Confirmé
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        )
      case 'PENDING_PAYMENT':
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
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                  Événement
                </span>
                {event?.published ? (
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
                {event?.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {event?.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {event?.start_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </span>
                )}
                {event?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/membre/organisateur/event/${id}/modifier`}
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
            filter === 'PENDING_PAYMENT'
              ? 'bg-blue-100 border-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50'
          }`}
          onClick={() => setFilter(filter === 'PENDING_PAYMENT' ? 'ALL' : 'PENDING_PAYMENT')}
        >
          <p className="text-sm text-blue-700">À payer</p>
          <p className="text-2xl font-bold text-blue-800">{stats.pendingPayment}</p>
        </div>
        <div
          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
            filter === 'CONFIRMED'
              ? 'bg-green-100 border-green-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50'
          }`}
          onClick={() => setFilter(filter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
        >
          <p className="text-sm text-green-700">Confirmés</p>
          <p className="text-2xl font-bold text-green-800">{stats.confirmed}</p>
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
            Inscriptions ({filteredRegistrations.length})
          </h2>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="text-sm text-emerald-600 hover:underline"
            >
              Voir tout
            </button>
          )}
        </div>

        {filteredRegistrations.length === 0 ? (
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
                          {reg.paymentAmount.toFixed(2)} CHF
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
    </div>
  )
}
