import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CreditCard, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const MEMBERSHIP_TYPES = {
  INDIVIDUAL: {
    name: 'Individuelle',
    price: 50,
    description: 'Cotisation pour une personne',
    benefits: [
      'Accès à toutes les activités de la mosquée',
      'Participation aux événements',
      'Réductions sur les cours',
      'Newsletter mensuelle',
    ],
  },
  FAMILY: {
    name: 'Familiale',
    price: 100,
    description: 'Cotisation pour toute la famille',
    benefits: [
      'Tous les avantages de la cotisation individuelle',
      'Valable pour tous les membres de la famille',
      'Priorité pour les inscriptions aux activités',
      'Réductions supplémentaires sur les événements',
    ],
  },
  STUDENT: {
    name: 'Étudiante',
    price: 30,
    description: 'Tarif réduit pour les étudiants',
    benefits: [
      'Accès à toutes les activités de la mosquée',
      'Participation aux événements',
      'Réductions importantes sur les cours',
      'Newsletter mensuelle',
    ],
  },
}

export default async function CotisationPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const currentMembership = memberships.find(m => m.status === 'ACTIVE')

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Cotisation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gérez votre adhésion à la mosquée
        </p>
      </div>

      {/* Statut actuel */}
      {currentMembership ? (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Cotisation Active</h2>
                <p className="text-green-100">
                  Type: {MEMBERSHIP_TYPES[currentMembership.type as keyof typeof MEMBERSHIP_TYPES]?.name || currentMembership.type}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-100">Valide jusqu'au</div>
              <div className="text-xl font-bold">
                {new Date(currentMembership.endDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-100">
            <Calendar className="h-4 w-4" />
            Membre depuis le {new Date(currentMembership.startDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-200 mb-1">
                Aucune cotisation active
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                Pour bénéficier de tous les avantages et soutenir notre mosquée, veuillez choisir un type de cotisation ci-dessous.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Types de cotisations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Types de cotisations disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(MEMBERSHIP_TYPES).map(([key, type]) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {type.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {type.description}
                </p>
                <div className="text-3xl font-bold text-primary mb-1">
                  {type.price} CHF
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  par an
                </p>
              </div>

              <div className="space-y-2 mb-6">
                {type.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <form action="/api/membre/cotisation/subscribe" method="POST">
                <input type="hidden" name="type" value={key} />
                <button
                  type="submit"
                  disabled={currentMembership?.type === key}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentMembership?.type === key
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {currentMembership?.type === key ? 'Cotisation active' : 'Choisir'}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Historique */}
      {memberships.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Historique des cotisations
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Paiement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {memberships.map((membership) => (
                    <tr key={membership.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {MEMBERSHIP_TYPES[membership.type as keyof typeof MEMBERSHIP_TYPES]?.name || membership.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(membership.startDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          au {new Date(membership.endDate).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {membership.amount.toFixed(2)} CHF
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          membership.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : membership.status === 'EXPIRED'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {membership.status === 'ACTIVE' && <CheckCircle className="h-3 w-3" />}
                          {membership.status === 'EXPIRED' && <XCircle className="h-3 w-3" />}
                          {membership.status === 'PENDING' && <Clock className="h-3 w-3" />}
                          {membership.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          membership.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {membership.paymentStatus}
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

      {/* Information */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Informations importantes
            </h3>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>• La cotisation est valable pour une année à partir de la date de paiement</li>
              <li>• Les paiements peuvent être effectués par virement bancaire ou en espèces à la mosquée</li>
              <li>• Les étudiants doivent présenter une carte d'étudiant valide</li>
              <li>• La cotisation familiale couvre tous les membres de la famille vivant sous le même toit</li>
              <li>• Pour toute question, contactez-nous à info@mosquee-alnour.ch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
