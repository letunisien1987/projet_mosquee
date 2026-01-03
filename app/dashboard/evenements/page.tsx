import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getOfferingsByIds } from '@/lib/content'
import type { EventRegistration as PrismaEventRegistration } from '@prisma/client'
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import CancelEventButton from '@/components/CancelEventButton'
import PayEventButton from '@/components/PayEventButton'

export const dynamic = 'force-dynamic'

interface EventRegistration {
  id: string
  eventId: string
  eventTitle: string
  status: string
  createdAt: Date
  numberOfAdults: number
  numberOfChildren: number
  requiresPayment: boolean
  paymentAmount: number | null
  paymentId: string | null
  notes: string | null
  date?: string
  location?: string
  startTime?: string
  endTime?: string
}

export default async function EvenementsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  let user: { email: string | null } | null = null
  let registrations: PrismaEventRegistration[] = []

  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    })

    // Récupérer les inscriptions aux événements
    registrations = await prisma.eventRegistration.findMany({
      where: {
        OR: [{ userId: session.user.id }, { email: user?.email?.toLowerCase() }],
      },
      orderBy: { createdAt: 'desc' },
    })

    // Lier les inscriptions orphelines
    const orphanRegistrations = registrations.filter(
      (r) => !r.userId && r.email?.toLowerCase() === user?.email?.toLowerCase()
    )
    if (orphanRegistrations.length > 0) {
      await prisma.eventRegistration.updateMany({
        where: {
          id: { in: orphanRegistrations.map((r) => r.id) },
          userId: null,
        },
        data: { userId: session.user.id },
      })
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
  }

  // Batch fetch des offerings (fix N+1)
  const eventIds = registrations.map((r) => r.eventId).filter((id): id is string => id !== null)
  const offeringsMap = await getOfferingsByIds(eventIds)

  // Enrichir avec les données de Prisma
  const events: EventRegistration[] = []
  for (const reg of registrations) {
    if (!reg.eventId) continue // Skip si pas d'eventId
    const offering = offeringsMap.get(reg.eventId)
    events.push({
      id: reg.id,
      eventId: reg.eventId,
      eventTitle: reg.eventTitle,
      status: reg.status,
      createdAt: reg.createdAt,
      numberOfAdults: reg.numberOfAdults,
      numberOfChildren: reg.numberOfChildren,
      requiresPayment: reg.requiresPayment,
      paymentAmount: reg.paymentAmount ? Number(reg.paymentAmount) : null,
      paymentId: reg.paymentId,
      notes: reg.notes,
      date: offering?.date,
      location: offering?.location,
      startTime: offering?.startTime,
      endTime: offering?.endTime,
    })
  }

  // Stats
  const stats = {
    total: events.length,
    confirmed: events.filter((e) => e.status === 'CONFIRMED').length,
    pending: events.filter((e) => e.status === 'PENDING').length,
    pendingPayment: events.filter((e) => ['PENDING_PAYMENT', 'APPROVED'].includes(e.status)).length,
    cancelled: events.filter((e) => e.status === 'CANCELLED').length,
  }

  // Séparer les événements à venir et passés
  const now = new Date()
  const upcomingEvents = events.filter(
    (e) => e.status !== 'CANCELLED' && (!e.date || new Date(e.date) >= now)
  )
  const pastEvents = events.filter((e) => e.date && new Date(e.date) < now && e.status !== 'CANCELLED')
  const cancelledEvents = events.filter((e) => e.status === 'CANCELLED')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            Confirmé
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        )
      case 'PENDING_PAYMENT':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <CreditCard className="h-3 w-3" />
            Paiement requis
          </span>
        )
      case 'WAITLIST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
            <AlertCircle className="h-3 w-3" />
            Liste d&apos;attente
          </span>
        )
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            {status === 'REJECTED' ? 'Refusé' : 'Annulé'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('fr-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const EventCard = ({ event }: { event: EventRegistration }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{event.eventTitle}</h3>
          </div>
          {getStatusBadge(event.status)}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {event.date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(event.date)}
          </div>
        )}
        {(event.startTime || event.endTime) && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {event.startTime}
            {event.endTime && ` - ${event.endTime}`}
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location}
          </div>
        )}
        {event.numberOfAdults + event.numberOfChildren > 1 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {event.numberOfAdults + event.numberOfChildren} participant(s)
            {event.numberOfChildren > 0 &&
              ` (${event.numberOfAdults} adulte${event.numberOfAdults > 1 ? 's' : ''}, ${event.numberOfChildren} enfant${event.numberOfChildren > 1 ? 's' : ''})`}
          </div>
        )}
        {event.requiresPayment && event.paymentAmount && (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {event.paymentAmount.toFixed(2)} CHF
            {event.paymentId && <span className="text-green-600 dark:text-green-400">(Payé)</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
        {['PENDING_PAYMENT', 'APPROVED'].includes(event.status) &&
          event.requiresPayment &&
          !event.paymentId && (
            <PayEventButton registrationId={event.id} eventId={event.eventId} amount={event.paymentAmount || 0} />
          )}

        {event.status === 'CONFIRMED' && (
          <CancelEventButton registrationId={event.id} eventTitle={event.eventTitle} />
        )}

        {event.status === 'PENDING' && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400 italic">
            En cours de validation par l&apos;organisateur
          </p>
        )}

        <Link
          href={`/evenements/${event.eventId}`}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Voir l&apos;événement
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          Mes Événements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Toutes vos inscriptions aux événements de la mosquée
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-700 dark:text-green-400">Confirmés</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.confirmed}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">En attente</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">À payer</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.pendingPayment}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">Annulés</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.cancelled}</p>
        </div>
      </div>

      {/* Événements à venir */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Événements à venir
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Événements passés */}
      {pastEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Événements passés</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Événement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pastEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {event.eventTitle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(event.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Événements annulés */}
      {cancelledEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Inscriptions annulées
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Événement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cancelledEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {event.eventTitle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(event.createdAt).toLocaleDateString('fr-CH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune inscription aux événements
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Découvrez les événements de la mosquée et inscrivez-vous
          </p>
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Calendar className="h-5 w-5" />
            Voir les événements
          </Link>
        </div>
      )}
    </div>
  )
}
