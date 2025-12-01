import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  Heart,
  BookOpen,
  Calendar,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
  try {
    // Récupérer les données de l'utilisateur
    const [donations, enrollments, eventRegistrations, memberships] = await Promise.all([
      prisma.donation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.enrollment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.eventRegistration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.membership.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      }),
    ])

    // Calculer les statistiques
    const totalDonations = await prisma.donation.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    })

    const enrollmentStats = await prisma.enrollment.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    })

    const eventStats = await prisma.eventRegistration.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    })

    return {
      donations,
      enrollments,
      eventRegistrations,
      currentMembership: memberships[0] || null,
      notifications: [], // Pas de notifications pour l'instant
      totalDonations: totalDonations._sum.amount || 0,
      donationCount: totalDonations._count,
      enrollmentStats,
      eventStats,
      unreadNotifications: 0, // Pas de notifications pour l'instant
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error)
    return null
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  const data = await getDashboardData(session.user.id)

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Erreur de chargement
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Impossible de charger les données du tableau de bord
        </p>
      </div>
    )
  }

  const activeEnrollments = data.enrollmentStats.find(s => s.status === 'ACTIVE')?._count || 0
  const confirmedEvents = data.eventStats.find(s => s.status === 'CONFIRMED')?._count || 0

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tableau de bord
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bienvenue {session.user.firstName} {session.user.lastName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Dons */}
        <Link
          href="/membre/dons"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {data.totalDonations.toFixed(2)} €
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total des dons ({data.donationCount})
          </p>
        </Link>

        {/* Inscriptions actives */}
        <Link
          href="/membre/inscriptions"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {activeEnrollments}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Inscriptions actives
          </p>
        </Link>

        {/* Événements */}
        <Link
          href="/membre/evenements"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {confirmedEvents}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Événements confirmés
          </p>
        </Link>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            {data.unreadNotifications > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                {data.unreadNotifications}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {data.unreadNotifications}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Notifications non lues
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications récentes
            </h2>
            <Link
              href="/membre/parametres"
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              Tout voir
            </Link>
          </div>

          {data.notifications.length > 0 ? (
            <div className="space-y-3">
              {data.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.read
                      ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Bell className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                      notif.read ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        notif.read
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          className="text-xs text-primary hover:text-primary-dark mt-2 inline-block"
                        >
                          Voir plus →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune notification
              </p>
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activité récente
          </h2>

          <div className="space-y-4">
            {/* Derniers dons */}
            {data.donations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Derniers dons
                </h3>
                <div className="space-y-2">
                  {data.donations.slice(0, 3).map((don) => (
                    <div
                      key={don.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {don.projectName || don.type}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {don.amount} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dernières inscriptions */}
            {data.enrollments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                  Inscriptions
                </h3>
                <div className="space-y-2">
                  {data.enrollments.slice(0, 3).map((enroll) => (
                    <div
                      key={enroll.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {enroll.activityTitle}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        enroll.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : enroll.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {enroll.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.donations.length === 0 && data.enrollments.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune activité récente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statut de cotisation */}
      {data.currentMembership && (
        <div className="mt-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Statut de cotisation</h3>
              <p className="text-white/80 text-sm">
                Type: {data.currentMembership.type} |
                Valide jusqu'au {new Date(data.currentMembership.endDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold ${
              data.currentMembership.status === 'ACTIVE'
                ? 'bg-green-500'
                : data.currentMembership.status === 'EXPIRED'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}>
              {data.currentMembership.status}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/membre/profil"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-gray-900 dark:text-white font-medium">Modifier mon profil</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mettre à jour mes informations
          </p>
        </Link>

        <Link
          href="/activites"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-gray-900 dark:text-white font-medium">Découvrir les activités</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            S'inscrire à de nouvelles activités
          </p>
        </Link>

        <Link
          href="/dons"
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-gray-900 dark:text-white font-medium">Faire un don</div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Soutenir nos projets
          </p>
        </Link>
      </div>
    </div>
  )
}
