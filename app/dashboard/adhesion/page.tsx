import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  CreditCard,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  PENDING: {
    label: 'En attente de validation',
    description: 'Votre demande est en cours d\'examen par notre équipe',
    icon: Clock,
    color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    step: 1,
  },
  APPROVED: {
    label: 'Demande approuvée',
    description: 'Votre demande a été approuvée ! Vérifiez votre email pour le lien de paiement',
    icon: CheckCircle,
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
    step: 2,
  },
  PAYMENT_SENT: {
    label: 'Lien de paiement envoyé',
    description: 'Le lien de paiement a été envoyé à votre adresse email',
    icon: Mail,
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
    iconColor: 'text-purple-600 dark:text-purple-400',
    step: 3,
  },
  COMPLETED: {
    label: 'Paiement effectué',
    description: 'Votre cotisation a été payée avec succès. Vous êtes maintenant membre actif !',
    icon: CheckCircle,
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400',
    step: 4,
  },
  REJECTED: {
    label: 'Demande refusée',
    description: 'Votre demande n\'a pas été approuvée',
    icon: XCircle,
    color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
    step: 0,
  },
  EXPIRED: {
    label: 'Lien de paiement expiré',
    description: 'Le lien de paiement a expiré (validité: 7 jours). Contactez-nous pour un nouveau lien',
    icon: AlertTriangle,
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200',
    iconColor: 'text-orange-600 dark:text-orange-400',
    step: 0,
  },
}

export default async function AdhesionPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  // Récupérer la demande d'adhésion la plus récente
  const membershipRequest = session.user.email ? await prisma.membershipRequest.findFirst({
    where: { email: session.user.email },
    orderBy: { createdAt: 'desc' },
  }) : null

  // Récupérer la cotisation active si elle existe
  const activeMembership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusConfig = membershipRequest
    ? STATUS_CONFIG[membershipRequest.status as keyof typeof STATUS_CONFIG]
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Suivi de votre adhésion
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez l&apos;état de votre demande d&apos;adhésion à la mosquée
        </p>
      </div>

      {activeMembership ? (
        // Membre actif
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Vous êtes membre actif !</h2>
              <p className="text-green-100">
                Votre cotisation est active jusqu&apos;au {new Date(activeMembership.endDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/cotisation"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold"
          >
            Voir ma cotisation
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      ) : membershipRequest ? (
        <>
          {/* Statut actuel */}
          {statusConfig && (
            <div className={`rounded-xl shadow-sm border p-6 mb-8 ${statusConfig.color}`}>
              <div className="flex items-start gap-4">
                <statusConfig.icon className={`h-8 w-8 ${statusConfig.iconColor} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {statusConfig.label}
                  </h3>
                  <p className="text-sm opacity-90 mb-4">
                    {statusConfig.description}
                  </p>

                  {/* Informations supplémentaires selon le statut */}
                  {membershipRequest.status === 'APPROVED' && membershipRequest.paymentExpiresAt && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Le lien de paiement expire le{' '}
                          <strong>
                            {new Date(membershipRequest.paymentExpiresAt).toLocaleDateString('fr-FR')}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {membershipRequest.status === 'REJECTED' && membershipRequest.rejectionReason && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mt-4">
                      <div className="text-sm">
                        <strong>Raison:</strong> {membershipRequest.rejectionReason}
                      </div>
                    </div>
                  )}

                  {membershipRequest.status === 'PAYMENT_SENT' && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mt-4">
                      <p className="text-sm">
                        Vérifiez votre boîte email <strong>{membershipRequest.email}</strong> pour accéder au lien de paiement sécurisé.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline du processus */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Processus d&apos;adhésion
            </h3>

            <div className="space-y-6">
              {/* Étape 1: Soumission */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    membershipRequest.status !== 'PENDING' && membershipRequest.status !== 'REJECTED'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  {membershipRequest.status !== 'COMPLETED' && membershipRequest.status !== 'REJECTED' && (
                    <div className="w-0.5 h-12 bg-gray-300 dark:bg-gray-600 my-1"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Demande soumise</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Le {new Date(membershipRequest.createdAt).toLocaleDateString('fr-FR')} à{' '}
                    {new Date(membershipRequest.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Étape 2: Validation */}
              {membershipRequest.status !== 'PENDING' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      membershipRequest.status === 'APPROVED' || membershipRequest.status === 'PAYMENT_SENT' || membershipRequest.status === 'COMPLETED'
                        ? 'bg-green-500 text-white'
                        : membershipRequest.status === 'REJECTED'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {membershipRequest.status === 'REJECTED' ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </div>
                    {membershipRequest.status !== 'REJECTED' && (
                      <div className="w-0.5 h-12 bg-gray-300 dark:bg-gray-600 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {membershipRequest.status === 'REJECTED' ? 'Demande refusée' : 'Demande approuvée'}
                    </h4>
                    {membershipRequest.reviewedAt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Le {new Date(membershipRequest.reviewedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(membershipRequest.reviewedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Étape 3: Paiement */}
              {(membershipRequest.status === 'PAYMENT_SENT' || membershipRequest.status === 'COMPLETED') && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      membershipRequest.status === 'COMPLETED'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    {membershipRequest.status !== 'COMPLETED' && (
                      <div className="w-0.5 h-12 bg-gray-300 dark:bg-gray-600 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Lien de paiement envoyé</h4>
                    {membershipRequest.paymentLinkSentAt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Le {new Date(membershipRequest.paymentLinkSentAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Étape 4: Confirmation */}
              {membershipRequest.status === 'COMPLETED' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500 text-white">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Paiement confirmé</h4>
                    {membershipRequest.paidAt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Le {new Date(membershipRequest.paidAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Détails de la demande */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de votre demande
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Type de membership</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">
                  {membershipRequest.membershipType === 'ACTIF' ? 'Membre Actif' : 'Membre Passif'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Email</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">
                  {membershipRequest.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Téléphone</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">
                  {membershipRequest.phone}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Ville</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">
                  {membershipRequest.city}
                </dd>
              </div>
            </dl>
          </div>
        </>
      ) : (
        // Aucune demande
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune demande d&apos;adhésion
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n&apos;avez pas encore soumis de demande d&apos;adhésion à la mosquée
          </p>
          <Link
            href="/devenir-membre"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold"
          >
            Devenir Membre
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </div>
  )
}
