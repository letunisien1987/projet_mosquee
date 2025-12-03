'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  ArrowLeft,
  Loader2,
  Pencil,
  Users,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  Baby,
  UserCheck,
  UserX,
  Hourglass,
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
  price?: number
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  manager_email?: string
}

interface Registration {
  id: string
  eventId: string
  eventTitle: string
  firstName: string
  lastName: string
  email: string
  phone: string
  participationType: string
  numberOfAdults: number
  numberOfChildren: number
  participants?: {
    adults?: { firstName: string; lastName: string }[]
    children?: { firstName: string; lastName: string; age?: number }[]
  }
  status: 'PENDING' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'WAITLIST'
  requiresPayment: boolean
  paymentAmount?: number
  createdAt: string
  user?: {
    id: string
    firstName: string | null
    lastName: string | null
  }
}

const statusConfig: Record<string, { label: string; icon: typeof Hourglass; color: string; bgColor: string }> = {
  PENDING: {
    label: 'En attente',
    icon: Hourglass,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  PENDING_PAYMENT: {
    label: 'Attente paiement',
    icon: CreditCard,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  CONFIRMED: {
    label: 'Confirmee',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  CANCELLED: {
    label: 'Annulee',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  WAITLIST: {
    label: 'Liste attente',
    icon: AlertCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
}

const categoryLabels: Record<string, string> = {
  religieux: 'Religieux',
  communaute: 'Communaute',
  education: 'Education',
  charite: 'Charite',
}

export default function EvenementDetailPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const eventRes = await fetch(`/api/admin/evenements-gestion/${eventId}`)
      if (!eventRes.ok) {
        setError('Evenement non trouve')
        return
      }
      const eventData = await eventRes.json()
      setEvent(eventData.event)

      // Fetch registrations for this event
      const regRes = await fetch('/api/admin/event-registrations')
      if (regRes.ok) {
        const allRegistrations = await regRes.json()
        // Filter registrations for this specific event
        const eventRegistrations = allRegistrations.filter(
          (r: Registration) => r.eventId === eventId
        )
        setRegistrations(eventRegistrations)
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    setUpdatingStatus(registrationId)
    try {
      const res = await fetch(`/api/admin/event-registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        setRegistrations(prev =>
          prev.map(r =>
            r.id === registrationId ? { ...r, status: newStatus as Registration['status'] } : r
          )
        )
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la mise a jour')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Stats
  const confirmedCount = registrations.filter(r => r.status === 'CONFIRMED').length
  const pendingCount = registrations.filter(r => r.status === 'PENDING').length
  const pendingPaymentCount = registrations.filter(r => r.status === 'PENDING_PAYMENT').length
  const cancelledCount = registrations.filter(r => r.status === 'CANCELLED').length
  const waitlistCount = registrations.filter(r => r.status === 'WAITLIST').length
  const totalParticipants = registrations
    .filter(r => r.status === 'CONFIRMED')
    .reduce((acc, r) => acc + r.numberOfAdults + r.numberOfChildren, 0)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="p-8">
        <Link
          href="/admin/evenements-gestion"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux evenements
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Evenement non trouve'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/evenements-gestion"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux evenements
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="h-7 w-7 text-primary" />
              {event.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-gray-500">
              <span className="px-2 py-1 rounded text-sm bg-gray-100">
                {categoryLabels[event.category] || event.category}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(event.date)}
                {event.start_time && ` a ${event.start_time}`}
              </span>
            </div>
          </div>

          <Link
            href={`/admin/evenements-gestion/${eventId}/modifier`}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total inscrits</p>
              <p className="text-xl font-bold">{registrations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Confirmes</p>
              <p className="text-xl font-bold text-green-600">{confirmedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Hourglass className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        {pendingPaymentCount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Attente paiement</p>
                <p className="text-xl font-bold text-orange-600">{pendingPaymentCount}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Participants</p>
              <p className="text-xl font-bold text-purple-600">{totalParticipants}</p>
            </div>
          </div>
        </div>

        {event.max_capacity && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Capacite</p>
                <p className="text-xl font-bold">
                  {totalParticipants}/{event.max_capacity}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Details de l&apos;evenement</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Statut</p>
            <p className="font-medium">
              {event.published ? (
                <span className="text-green-600">Publie</span>
              ) : (
                <span className="text-gray-400">Brouillon</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Inscription</p>
            <p className="font-medium">
              {event.registration_required ? 'Obligatoire' : 'Libre'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Validation</p>
            <p className="font-medium">
              {event.requires_approval ? 'Manuelle' : 'Automatique'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prix</p>
            <p className="font-medium">
              {event.payment_type === 'FREE' || !event.price
                ? 'Gratuit'
                : `${event.price} CHF`}
            </p>
          </div>
          {event.manager_email && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Responsable</p>
              <p className="font-medium">{event.manager_email}</p>
            </div>
          )}
        </div>
        {event.description && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
          </div>
        )}
      </div>

      {/* Registrations List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Inscriptions ({registrations.length})
          </h2>
        </div>

        {registrations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Aucune inscription pour cet evenement
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {registrations.map((registration) => {
              const statusInfo = statusConfig[registration.status]
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={registration.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">
                          {registration.firstName} {registration.lastName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                        {registration.requiresPayment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-600">
                            <CreditCard className="h-3 w-3" />
                            {registration.paymentAmount} CHF
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {registration.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {registration.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {registration.numberOfAdults} adulte(s)
                        </span>
                        {registration.numberOfChildren > 0 && (
                          <span className="flex items-center gap-1">
                            <Baby className="h-4 w-4" />
                            {registration.numberOfChildren} enfant(s)
                          </span>
                        )}
                        <span className="text-xs">
                          Inscrit le {formatDateTime(registration.createdAt)}
                        </span>
                      </div>

                      {/* Participants details */}
                      {registration.participants && (
                        <div className="mt-2 text-sm text-gray-600">
                          {registration.participants.adults &&
                            registration.participants.adults.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {registration.participants.adults.map((adult, i) => (
                                  <span
                                    key={i}
                                    className="bg-gray-100 px-2 py-1 rounded text-xs"
                                  >
                                    {adult.firstName} {adult.lastName}
                                  </span>
                                ))}
                              </div>
                            )}
                          {registration.participants.children &&
                            registration.participants.children.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {registration.participants.children.map((child, i) => (
                                  <span
                                    key={i}
                                    className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs"
                                  >
                                    {child.firstName} {child.lastName}
                                    {child.age && ` (${child.age} ans)`}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {event.requires_approval && registration.status === 'PENDING' && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleStatusChange(registration.id, 'CONFIRMED')}
                          disabled={updatingStatus === registration.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg disabled:opacity-50"
                        >
                          {updatingStatus === registration.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Confirmer
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusChange(registration.id, 'CANCELLED')}
                          disabled={updatingStatus === registration.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50"
                        >
                          <UserX className="h-4 w-4" />
                          Refuser
                        </button>
                      </div>
                    )}

                    {registration.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(registration.id, 'CANCELLED')}
                        disabled={updatingStatus === registration.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 text-sm rounded-lg disabled:opacity-50 ml-4"
                      >
                        {updatingStatus === registration.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Annuler
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
