import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getOfferingById } from '@/lib/directus'
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertCircle,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import CancelEventButton from '@/components/CancelEventButton'
import PayEventButton from '@/components/PayEventButton'

export const dynamic = 'force-dynamic'

type InscriptionType = 'EVENT' | 'ACTIVITY'

interface UnifiedInscription {
  id: string
  type: InscriptionType
  offeringId: string
  offeringTitle: string
  status: string
  createdAt: Date
  numberOfAdults: number
  numberOfChildren: number
  requiresPayment: boolean
  paymentAmount: number | null
  paymentId: string | null
  notes: string | null
  // Infos enrichies depuis Directus
  date?: string
  schedule?: string
  location?: string
}

export default async function InscriptionsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  // Récupérer les inscriptions aux événements
  const eventRegistrations = await prisma.eventRegistration.findMany({
    where: {
      OR: [{ userId: session.user.id }, { email: user?.email?.toLowerCase() }],
    },
    orderBy: { createdAt: 'desc' },
  })

  // Récupérer les inscriptions aux activités
  const activityEnrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Lier les inscriptions orphelines
  const orphanRegistrations = eventRegistrations.filter(
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

  // Unifier les inscriptions
  const inscriptions: UnifiedInscription[] = []

  // Ajouter les événements
  for (const reg of eventRegistrations) {
    const offering = await getOfferingById(reg.eventId)
    inscriptions.push({
      id: reg.id,
      type: 'EVENT',
      offeringId: reg.eventId,
      offeringTitle: reg.eventTitle,
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
    })
  }

  // Ajouter les activités
  for (const enr of activityEnrollments) {
    // Vérifier que l'activityId existe
    if (!enr.activityId) continue

    const offering = await getOfferingById(enr.activityId)
    inscriptions.push({
      id: enr.id,
      type: 'ACTIVITY',
      offeringId: enr.activityId,
      offeringTitle: enr.activityTitle,
      status: enr.status,
      createdAt: enr.createdAt,
      numberOfAdults: 1,
      numberOfChildren: 0,
      requiresPayment: enr.requiresPayment,
      paymentAmount: enr.paymentAmount ? Number(enr.paymentAmount) : null,
      paymentId: enr.paymentId,
      notes: enr.notes,
      schedule: offering?.schedule,
    })
  }

  // Trier par date de création
  inscriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // Stats
  const stats = {
    total: inscriptions.length,
    events: inscriptions.filter((i) => i.type === 'EVENT').length,
    activities: inscriptions.filter((i) => i.type === 'ACTIVITY').length,
    confirmed: inscriptions.filter((i) => ['CONFIRMED', 'ACTIVE'].includes(i.status)).length,
    pending: inscriptions.filter((i) => i.status === 'PENDING').length,
    pendingPayment: inscriptions.filter((i) => ['PENDING_PAYMENT', 'APPROVED'].includes(i.status))
      .length,
    cancelled: inscriptions.filter((i) => i.status === 'CANCELLED').length,
  }

  // Séparer actives et annulées
  const activeInscriptions = inscriptions.filter((i) => i.status !== 'CANCELLED')
  const cancelledInscriptions = inscriptions.filter((i) => i.status === 'CANCELLED')

  const getStatusBadge = (status: string, type: InscriptionType) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            {type === 'EVENT' ? 'Confirmé' : 'Actif'}
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

  const getTypeIcon = (type: InscriptionType) => {
    return type === 'EVENT' ? (
      <Calendar className="h-5 w-5 text-emerald-600" />
    ) : (
      <BookOpen className="h-5 w-5 text-blue-600" />
    )
  }

  const getTypeBadge = (type: InscriptionType) => {
    return type === 'EVENT' ? (
      <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded">
        Événement
      </span>
    ) : (
      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
        Activité
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mes Inscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Toutes vos inscriptions aux événements et activités
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Événements</p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{stats.events}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">Activités</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.activities}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-700 dark:text-green-400">Confirmées</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.confirmed}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">En attente</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pending}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-4">
          <p className="text-sm text-indigo-700 dark:text-indigo-400">À payer</p>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">
            {stats.pendingPayment}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">Annulées</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.cancelled}</p>
        </div>
      </div>

      {/* Inscriptions actives */}
      {activeInscriptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Inscriptions actives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInscriptions.map((inscription) => (
              <div
                key={`${inscription.type}-${inscription.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(inscription.type)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {inscription.offeringTitle}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(inscription.type)}
                      {getStatusBadge(inscription.status, inscription.type)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {inscription.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(inscription.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                  {inscription.schedule && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {inscription.schedule}
                    </div>
                  )}
                  {inscription.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {inscription.location}
                    </div>
                  )}
                  {inscription.numberOfAdults + inscription.numberOfChildren > 1 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {inscription.numberOfAdults + inscription.numberOfChildren} participant(s)
                    </div>
                  )}
                  {inscription.requiresPayment && inscription.paymentAmount && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {inscription.paymentAmount.toFixed(2)} CHF
                      {inscription.paymentId && (
                        <span className="text-green-600 dark:text-green-400">(Payé)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                  {['PENDING_PAYMENT', 'APPROVED'].includes(inscription.status) &&
                    inscription.requiresPayment &&
                    !inscription.paymentId && (
                      <PayEventButton
                        registrationId={inscription.id}
                        eventId={inscription.offeringId}
                        amount={inscription.paymentAmount || 0}
                      />
                    )}

                  {['CONFIRMED', 'ACTIVE'].includes(inscription.status) &&
                    inscription.type === 'EVENT' && (
                      <CancelEventButton
                        registrationId={inscription.id}
                        eventTitle={inscription.offeringTitle}
                      />
                    )}

                  {inscription.status === 'PENDING' && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                      En cours de validation par l&apos;organisateur
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inscriptions annulées */}
      {cancelledInscriptions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Inscriptions annulées
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Offre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cancelledInscriptions.map((inscription) => (
                  <tr
                    key={`${inscription.type}-${inscription.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">{getTypeBadge(inscription.type)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {inscription.offeringTitle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(inscription.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {inscriptions.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune inscription
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n&apos;êtes inscrit à aucun événement ou activité
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/evenements"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Calendar className="h-5 w-5" />
              Événements
            </Link>
            <Link
              href="/activites"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <BookOpen className="h-5 w-5" />
              Activités
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
