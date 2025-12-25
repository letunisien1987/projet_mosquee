'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Calendar, BookOpen, Users, AlertCircle, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface PendingPaymentsData {
  memberships: Array<{
    id: string
    type: string
    amount: number
    createdAt: string
  }>
  events: Array<{
    id: string
    eventId: string
    eventTitle: string
    paymentAmount: number | null
    numberOfAdults: number
    numberOfChildren: number
    createdAt: string
  }>
  enrollments: Array<{
    id: string
    activityId: string | null
    activityTitle: string
    status: string
    requiresPayment: boolean
    paymentAmount: number | null
    paymentToken: string | null
    paymentExpiresAt: string | null
    createdAt: string
    child: { firstName: string; lastName: string } | null
  }>
  notifications: Array<{
    id: string
    type: string
    title: string
    message: string
  }>
}

function PaiementsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<PendingPaymentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [payingItem, setPayingItem] = useState<string | null>(null)

  // Récupérer le token de paiement si présent dans l'URL
  const paymentToken = searchParams.get('token')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
      return
    }

    if (status === 'authenticated') {
      fetchPendingPayments()
    }
  }, [status, router])

  // Si un token est présent, déclencher le paiement automatiquement
  useEffect(() => {
    if (paymentToken && data) {
      const enrollment = data.enrollments.find(e => e.paymentToken === paymentToken)
      if (enrollment) {
        handleActivityPayment(enrollment.id, paymentToken)
      }
    }
  }, [paymentToken, data])

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch('/api/membre/paiements')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Erreur chargement paiements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventPayment = async (eventId: string, registrationId: string) => {
    setPayingItem(registrationId)
    try {
      const response = await fetch('/api/stripe/create-event-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur paiement événement:', error)
      setPayingItem(null)
    }
  }

  const handleActivityPayment = async (enrollmentId: string, token?: string) => {
    setPayingItem(enrollmentId)
    try {
      const response = await fetch('/api/stripe/create-activity-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          ...(token ? { paymentToken: token } : {})
        })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors du paiement')
        setPayingItem(null)
      }
    } catch (error) {
      console.error('Erreur paiement activité:', error)
      setPayingItem(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Erreur de chargement
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Impossible de charger les paiements en attente
        </p>
      </div>
    )
  }

  // Filtrer les inscriptions aux activités avec paiement en attente
  const pendingActivityPayments = data.enrollments.filter(
    e => e.requiresPayment && e.status === 'APPROVED' && !e.paymentAmount
  )

  const totalPending =
    data.memberships.length + data.events.length + pendingActivityPayments.length

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Paiements en attente
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {totalPending === 0
            ? 'Tous vos paiements sont à jour'
            : `Vous avez ${totalPending} paiement${totalPending > 1 ? 's' : ''} en attente`}
        </p>
      </div>

      {totalPending === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun paiement en attente
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Tous vos paiements sont à jour
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retour au dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cotisations en attente */}
          {data.memberships.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cotisations ({data.memberships.length})
                </h2>
              </div>

              <div className="space-y-3">
                {data.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Cotisation{' '}
                        {membership.type === 'ACTIF'
                          ? 'Membre Actif'
                          : 'Membre Passif'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {membership.amount.toFixed(2)} CHF
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Créé le{' '}
                        {new Date(membership.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/cotisation"
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Payer maintenant
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Événements en attente */}
          {data.events.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Événements ({data.events.length})
                </h2>
              </div>

              <div className="space-y-3">
                {data.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {event.eventTitle}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event.paymentAmount?.toFixed(2)} CHF
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {event.numberOfAdults} adulte(s), {event.numberOfChildren} enfant(s)
                      </p>
                    </div>
                    <button
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      onClick={() => handleEventPayment(event.eventId, event.id)}
                      disabled={payingItem === event.id}
                    >
                      {payingItem === event.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        'Payer maintenant'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activités en attente de paiement */}
          {data.enrollments.filter(e => e.requiresPayment && e.paymentAmount).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Activités ({data.enrollments.filter(e => e.requiresPayment && e.paymentAmount).length})
                </h2>
              </div>

              <div className="space-y-3">
                {data.enrollments
                  .filter(e => e.requiresPayment && e.paymentAmount)
                  .map((enrollment) => {
                    const isExpired = enrollment.paymentExpiresAt
                      ? new Date(enrollment.paymentExpiresAt) < new Date()
                      : false
                    const participantName = enrollment.child
                      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
                      : null

                    return (
                      <div
                        key={enrollment.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isExpired
                            ? 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-700'
                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {enrollment.activityTitle}
                          </h3>
                          {participantName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Participant: {participantName}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {enrollment.paymentAmount?.toFixed(2)} CHF
                          </p>
                          {enrollment.paymentExpiresAt && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${
                              isExpired ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Clock className="h-3 w-3" />
                              {isExpired
                                ? 'Lien expiré'
                                : `Expire le ${new Date(enrollment.paymentExpiresAt).toLocaleDateString('fr-FR')}`
                              }
                            </p>
                          )}
                        </div>
                        {!isExpired ? (
                          <button
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            onClick={() => handleActivityPayment(enrollment.id, enrollment.paymentToken || undefined)}
                            disabled={payingItem === enrollment.id}
                          >
                            {payingItem === enrollment.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Redirection...
                              </>
                            ) : (
                              'Payer maintenant'
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Contactez-nous
                          </span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Activités en attente d'approbation */}
          {data.enrollments.filter(e => e.status === 'PENDING').length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  En attente d&apos;approbation ({data.enrollments.filter(e => e.status === 'PENDING').length})
                </h2>
              </div>

              <div className="space-y-3">
                {data.enrollments
                  .filter(e => e.status === 'PENDING')
                  .map((enrollment) => {
                    const participantName = enrollment.child
                      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
                      : null

                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {enrollment.activityTitle}
                          </h3>
                          {participantName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Participant: {participantName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Inscription le{' '}
                            {new Date(enrollment.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          En attente d&apos;approbation
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PaiementsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaiementsContent />
    </Suspense>
  )
}
