import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Heart, Calendar, Download, TrendingUp, FileText } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DonsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  // Récupérer TOUS les dons liés à cet utilisateur :
  // 1. Dons avec userId (quand l'utilisateur était connecté)
  // 2. Dons avec email (dons faits AVANT la création du compte)
  const donations = await prisma.donation.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email || '' },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: donations.reduce((sum, d) => sum + d.amount, 0),
    count: donations.length,
    thisYear: donations
      .filter(d => new Date(d.createdAt).getFullYear() === new Date().getFullYear())
      .reduce((sum, d) => sum + d.amount, 0),
    lastDonation: donations.length > 0 ? donations[0].createdAt : null,
  }

  const donationsByType = donations.reduce((acc, don) => {
    acc[don.type] = (acc[don.type] || 0) + don.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mes Dons
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez l&apos;historique de vos contributions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {stats.total.toFixed(2)} CHF
          </h3>
          <p className="text-green-100 text-sm">
            Total des dons
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.count}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Nombre de dons
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.thisYear.toFixed(2)} CHF
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Cette année
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {stats.lastDonation ? new Date(stats.lastDonation).toLocaleDateString('fr-FR') : '-'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Dernier don
          </p>
        </div>
      </div>

      {/* Répartition par type */}
      {Object.keys(donationsByType).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par type
          </h2>
          <div className="space-y-3">
            {Object.entries(donationsByType).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {type}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {amount.toFixed(2)} CHF
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form action="/api/membre/dons/export" method="POST" className="flex-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            <Download className="h-5 w-5" />
            Télécharger le reçu fiscal (PDF)
          </button>
        </form>
        <Link
          href="/dons"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          <Heart className="h-5 w-5" />
          Faire un nouveau don
        </Link>
      </div>

      {/* Liste des dons */}
      {donations.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email de reçu
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(donation.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {donation.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {donation.projectName || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {donation.amount.toFixed(2)} CHF
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        donation.receiptSent
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {donation.receiptSent ? '✓ Email envoyé' : '⏳ En attente'}
                      </span>
                      {donation.receiptSent && donation.receiptSentAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(donation.receiptSentAt).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun don enregistré
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n&apos;avez pas encore fait de don
          </p>
          <Link
            href="/dons"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            <Heart className="h-5 w-5" />
            Faire un don
          </Link>
        </div>
      )}
    </div>
  )
}
