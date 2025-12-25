'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type MembershipRequest = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  membershipType: string
  desiredStartDate: string
  status: string
  createdAt: string
  reviewedAt: string | null
  paymentLinkSentAt: string | null
  paymentExpiresAt: string | null
  paidAt: string | null
  motivation: string | null
  address: string
  city: string
  postalCode: string
  country: string
  rejectionReason: string | null
}

export default function DemandesAdhesionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [requests, setRequests] = useState<MembershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    } else if (status === 'authenticated') {
      fetchRequests()
    }
  }, [status, filter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const url =
        filter === 'ALL'
          ? '/api/admin/membership-requests'
          : `/api/admin/membership-requests?status=${filter}`

      const res = await fetch(url)
      const data = await res.json()

      if (res.ok) {
        setRequests(data)
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/membership-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
      })

      if (res.ok) {
        fetchRequests()
        setShowApproveModal(false)
        setSelectedRequest(null)
        alert('Demande approuvee ! Un email avec le lien de paiement a ete envoye.')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur approbation:', error)
      alert('Erreur lors de l\'approbation')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Veuillez fournir une raison de refus')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/membership-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      if (res.ok) {
        fetchRequests()
        setShowRejectModal(false)
        setSelectedRequest(null)
        setRejectionReason('')
        alert('Demande refusee. Un email a ete envoye au demandeur.')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur refus:', error)
      alert('Erreur lors du refus')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Approuve', className: 'bg-blue-100 text-blue-800' },
      PAYMENT_SENT: { label: 'Paiement envoye', className: 'bg-purple-100 text-purple-800' },
      COMPLETED: { label: 'Complete', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Refuse', className: 'bg-red-100 text-red-800' },
      EXPIRED: { label: 'Expire', className: 'bg-gray-100 text-gray-800' },
    }

    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const filteredRequests = requests
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Demandes d'adhesion</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gerer les demandes de membership</p>
      </div>

      {/* Statistiques */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-700 dark:text-yellow-400">En attente</div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{pendingCount}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-400">Completes</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-300">{completedCount}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-700 dark:text-blue-400">Taux de conversion</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {requests.length > 0 ? Math.round((completedCount / requests.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'ALL', label: 'Tous' },
            { value: 'PENDING', label: 'En attente' },
            { value: 'APPROVED', label: 'Approuves' },
            { value: 'COMPLETED', label: 'Completes' },
            { value: 'REJECTED', label: 'Refuses' },
            { value: 'EXPIRED', label: 'Expires' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Demandeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date demande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune demande trouvee
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {request.firstName} {request.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.email}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{request.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          request.membershipType === 'ACTIF'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {request.membershipType === 'ACTIF' ? 'Actif' : 'Passif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowApproveModal(true)
                          }}
                          disabled={request.status !== 'PENDING'}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowRejectModal(true)
                          }}
                          disabled={request.status !== 'PENDING'}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approbation */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Approuver la demande</h2>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {selectedRequest.firstName} {selectedRequest.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedRequest.membershipType}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedRequest.email}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Telephone:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedRequest.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Adresse:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {selectedRequest.address}, {selectedRequest.postalCode} {selectedRequest.city},{' '}
                    {selectedRequest.country}
                  </span>
                </div>
                {selectedRequest.motivation && (
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Motivation:</span>
                    <p className="mt-1 text-gray-900 dark:text-white">{selectedRequest.motivation}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Action:</strong> Un email sera automatiquement envoye avec un lien de
                paiement valide 7 jours. Le demandeur pourra finaliser son adhesion en payant 120
                CHF.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedRequest(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? 'Traitement...' : 'Confirmer l\'approbation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Refus */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Refuser la demande</h2>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedRequest.firstName} {selectedRequest.lastName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Raison du refus (minimum 10 caracteres) *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Expliquez diplomatiquement la raison du refus..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Cette raison sera envoyee par email au demandeur. Soyez diplomatique.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedRequest(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={processing || rejectionReason.trim().length < 10}
              >
                {processing ? 'Traitement...' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
