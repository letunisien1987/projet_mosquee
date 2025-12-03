import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Calendar, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import CancelEventButton from '@/components/CancelEventButton'

export const dynamic = 'force-dynamic'

export default async function EvenementsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'CONFIRMED').length,
    pending: registrations.filter(r => r.status === 'PENDING').length,
    cancelled: registrations.filter(r => r.status === 'CANCELLED').length,
  }

  // Séparer les événements à venir et passés
  // TEMPORAIRE: Afficher toutes les inscriptions en "à venir" car eventDate n'existe pas encore dans la DB
  const now = new Date()
  const upcomingEvents = registrations.filter(r => r.status !== 'CANCELLED')
  const pastEvents: typeof registrations = [] // Vide pour l'instant

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mes Événements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez vos inscriptions aux événements
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-400">Confirmées</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">En attente</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 dark:text-red-400">Annulées</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.cancelled}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Événements à venir */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Événements à venir
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((registration) => (
              <div
                key={registration.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {registration.eventTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Calendar className="h-4 w-4" />
                      Inscrit le {new Date(registration.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    registration.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : registration.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {registration.status === 'CONFIRMED' && <CheckCircle className="h-3 w-3" />}
                    {registration.status === 'PENDING' && <Clock className="h-3 w-3" />}
                    {registration.status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                    {registration.status}
                  </span>
                </div>

                {(registration.numberOfAdults + registration.numberOfChildren) > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Users className="h-4 w-4" />
                    {registration.numberOfAdults + registration.numberOfChildren} participant(s)
                  </div>
                )}

                {registration.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {registration.notes}
                    </p>
                  </div>
                )}

                {registration.status === 'CONFIRMED' && (
                  <CancelEventButton
                    registrationId={registration.id}
                    eventTitle={registration.eventTitle}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Événements passés */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Événements passés
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pastEvents.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {registration.eventTitle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {registration.numberOfAdults + registration.numberOfChildren}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          registration.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : registration.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {registration.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {registrations.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun événement
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n'êtes inscrit à aucun événement pour le moment
          </p>
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            <Calendar className="h-5 w-5" />
            Découvrir les événements
          </Link>
        </div>
      )}
    </div>
  )
}
