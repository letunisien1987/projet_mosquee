import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Calendar, CheckCircle, XCircle, AlertCircle, Clock, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const MEMBERSHIP_TYPES = {
  ACTIF: {
    name: 'Membre Actif',
    price: 120,
    description: 'Membre avec droit de vote',
    icon: UserCheck,
    benefits: [
      'Droit de vote aux assemblées générales',
      'Accès à toutes les activités de la mosquée',
      'Participation aux événements',
      'Réductions sur les cours',
      'Newsletter et informations privilégiées',
      'Participation aux décisions de la mosquée',
    ],
  },
  PASSIF: {
    name: 'Membre Passif',
    price: 120,
    description: 'Membre sans droit de vote',
    icon: Users,
    benefits: [
      'Accès à toutes les activités de la mosquée',
      'Participation aux événements',
      'Réductions sur les cours',
      'Newsletter et informations privilégiées',
      'Soutien à la communauté',
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

  // Récupérer les demandes d'adhésion
  const membershipRequests = await prisma.membershipRequest.findMany({
    where: { email: session.user.email },
    orderBy: { createdAt: 'desc' },
  })

  const currentMembership = memberships.find(m => m.status === 'ACTIVE')
  const pendingRequest = membershipRequests.find(r => r.status === 'PENDING')
  const approvedRequest = membershipRequests.find(r => r.status === 'APPROVED')

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
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Cotisation Active</h2>
                <p className="text-red-100">
                  Type: {MEMBERSHIP_TYPES[currentMembership.type as keyof typeof MEMBERSHIP_TYPES]?.name || currentMembership.type}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-100">Valide jusqu'au</div>
              <div className="text-xl font-bold">
                {new Date(currentMembership.endDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-100">
            <Calendar className="h-4 w-4" />
            Membre depuis le {new Date(currentMembership.startDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      ) : pendingRequest ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                Demande en attente
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
                Votre demande d'adhésion ({MEMBERSHIP_TYPES[pendingRequest.membershipType as keyof typeof MEMBERSHIP_TYPES]?.name}) est en cours d'examen par notre équipe.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Soumise le {new Date(pendingRequest.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      ) : approvedRequest ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Demande approuvée
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                Votre demande d'adhésion a été approuvée ! Veuillez vérifier votre email pour le lien de paiement.
              </p>
              {approvedRequest.paymentExpiresAt && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Le lien de paiement expire le {new Date(approvedRequest.paymentExpiresAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-200 mb-1">
                Aucune cotisation active
              </h3>
              <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
                Pour bénéficier de tous les avantages et soutenir notre mosquée, veuillez soumettre une demande d'adhésion.
              </p>
              <Link
                href="/devenir-membre"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Devenir Membre
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Types de cotisations */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Types d'adhésion disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(MEMBERSHIP_TYPES).map(([key, type]) => {
            const Icon = type.icon
            return (
              <div
                key={key}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {type.description}
                  </p>
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {type.price} CHF
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    par an
                  </p>
                </div>

                <div className="space-y-2">
                  {type.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Processus d'adhésion */}
      <div className="mb-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-red-200 dark:border-red-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Comment devenir membre ?
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              1
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Soumettre votre demande
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remplissez le formulaire de demande d'adhésion en ligne
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              2
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Approbation
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Votre demande sera examinée par notre équipe (sous 48-72h)
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              3
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Paiement
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recevez un lien de paiement sécurisé par email (valide 7 jours)
            </p>
          </div>
        </div>
      </div>

      {/* Historique */}
      {memberships.length > 0 && (
        <div className="mb-8">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dernière MAJ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {memberships.map((membership) => {
                    const MemberIcon = MEMBERSHIP_TYPES[membership.type as keyof typeof MEMBERSHIP_TYPES]?.icon || Users
                    return (
                      <tr key={membership.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MemberIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
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
                            {membership.status === 'ACTIVE' ? 'Actif' : membership.status === 'EXPIRED' ? 'Expiré' : membership.status === 'PENDING' ? 'En attente' : membership.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            membership.paymentStatus === 'PAID'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : membership.paymentStatus === 'REFUNDED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : membership.paymentStatus === 'FAILED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {membership.paymentStatus === 'REFUNDED' && <XCircle className="h-3 w-3" />}
                            {membership.paymentStatus === 'PAID' && <CheckCircle className="h-3 w-3" />}
                            {membership.paymentStatus === 'FAILED' && <XCircle className="h-3 w-3" />}
                            {membership.paymentStatus === 'PENDING' && <Clock className="h-3 w-3" />}
                            {membership.paymentStatus === 'REFUNDED' ? 'Remboursé' : membership.paymentStatus === 'PAID' ? 'Payé' : membership.paymentStatus === 'FAILED' ? 'Échoué' : membership.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(membership.updatedAt).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(membership.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Informations importantes
            </h3>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>• La cotisation annuelle est de 120 CHF pour les deux types de membres</li>
              <li>• La différence entre Actif et Passif réside dans le droit de vote aux assemblées</li>
              <li>• Toutes les demandes sont examinées sous 48-72 heures ouvrables</li>
              <li>• Le lien de paiement est valide 7 jours après approbation</li>
              <li>• La cotisation est valable pour une année à partir de la date de paiement</li>
              <li>• Le paiement s'effectue en ligne de manière sécurisée via Stripe</li>
              <li>• Pour toute question, contactez-nous à info@mosquee-madretsch.ch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
