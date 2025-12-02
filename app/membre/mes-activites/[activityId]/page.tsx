'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Mail,
  Search,
  Filter,
  CreditCard,
  User,
  Baby,
  Phone,
  Calendar,
  Send,
} from 'lucide-react'

interface Enrollment {
  id: string
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'CANCELLED'
  notes?: string
  requiresPayment: boolean
  paymentAmount?: number
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  child?: {
    id: string
    firstName: string
    lastName: string
    birthDate: string
  }
  payment?: {
    id: string
    amount: number
    status: string
    createdAt: string
  }
}

interface Activity {
  id: string
  title: string
  category: string
  description?: string
  schedule?: string
  instructor?: string
  price?: number
  requires_approval: boolean
  active: boolean
  enrollment_open: boolean
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-100' },
  APPROVED: { label: 'À payer', color: 'text-blue-700', bg: 'bg-blue-100' },
  ACTIVE: { label: 'Actif', color: 'text-green-700', bg: 'bg-green-100' },
  REJECTED: { label: 'Refusé', color: 'text-red-700', bg: 'bg-red-100' },
  CANCELLED: { label: 'Annulé', color: 'text-gray-700', bg: 'bg-gray-100' },
}

export default function ActivityManagementPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const params = useParams()
  const activityId = params.activityId as string

  const [activity, setActivity] = useState<Activity | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    active: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal pour envoyer un email
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailRecipients, setEmailRecipients] = useState<'all' | 'active' | 'pending' | 'approved'>('all')
  const [emailSending, setEmailSending] = useState(false)

  // Modal pour refuser
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectEnrollmentId, setRejectEnrollmentId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [sessionStatus, router])

  useEffect(() => {
    if (session?.user && activityId) {
      fetchActivity()
      fetchEnrollments()
    }
  }, [session, activityId, statusFilter])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/membre/mes-activites/${activityId}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data.activity)
        setStats(data.stats)
      } else if (res.status === 403) {
        setError('Vous n\'êtes pas responsable de cette activité')
      } else {
        setError('Activité non trouvée')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const fetchEnrollments = async () => {
    try {
      const url = `/api/membre/mes-activites/${activityId}/enrollments${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments)
      }
    } catch (err) {
      console.error('Erreur chargement inscriptions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (enrollmentId: string, action: 'approve' | 'reject' | 'cancel', reason?: string) => {
    setActionLoading(enrollmentId)
    try {
      const res = await fetch(`/api/membre/mes-activites/${activityId}/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })

      if (res.ok) {
        // Rafraîchir les données
        fetchActivity()
        fetchEnrollments()
        setShowRejectModal(false)
        setRejectReason('')
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de l\'action')
      }
    } catch (err) {
      alert('Erreur de connexion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Veuillez remplir le sujet et le message')
      return
    }

    setEmailSending(true)
    try {
      const res = await fetch(`/api/membre/mes-activites/${activityId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
          recipients: emailRecipients,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setShowEmailModal(false)
        setEmailSubject('')
        setEmailMessage('')
      } else {
        alert(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (err) {
      alert('Erreur de connexion')
    } finally {
      setEmailSending(false)
    }
  }

  const filteredEnrollments = enrollments.filter((e) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    const userName = `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.toLowerCase()
    const userEmail = (e.user?.email || '').toLowerCase()
    const childName = `${e.child?.firstName || ''} ${e.child?.lastName || ''}`.toLowerCase()
    return userName.includes(search) || userEmail.includes(search) || childName.includes(search)
  })

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{error}</h2>
          <Link href="/membre/mes-activites" className="text-red-600 hover:underline">
            Retour à mes activités
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/membre/mes-activites"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{activity?.title}</h1>
              <p className="text-white/80">{activity?.schedule}</p>
            </div>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Mail className="h-5 w-5" />
              Envoyer un email
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl text-left transition-all ${
              statusFilter === 'all'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className={`text-sm ${statusFilter === 'all' ? 'text-white/80' : 'text-gray-500'}`}>
              Total
            </p>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`p-4 rounded-xl text-left transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className={`text-sm ${statusFilter === 'PENDING' ? 'text-white/80' : 'text-gray-500'}`}>
              En attente
            </p>
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`p-4 rounded-xl text-left transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className={`text-sm ${statusFilter === 'APPROVED' ? 'text-white/80' : 'text-gray-500'}`}>
              À payer
            </p>
          </button>

          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`p-4 rounded-xl text-left transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className={`text-sm ${statusFilter === 'ACTIVE' ? 'text-white/80' : 'text-gray-500'}`}>
              Actifs
            </p>
          </button>

          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`p-4 rounded-xl text-left transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold">{stats.rejected}</p>
            <p className={`text-sm ${statusFilter === 'REJECTED' ? 'text-white/80' : 'text-gray-500'}`}>
              Refusés
            </p>
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Liste des inscriptions */}
        {filteredEnrollments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune inscription</h3>
            <p className="text-gray-500">
              {statusFilter !== 'all'
                ? `Aucune inscription avec le statut "${statusLabels[statusFilter]?.label}"`
                : 'Aucune inscription pour cette activité'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Info participant */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {enrollment.child ? (
                          <Baby className="h-5 w-5 text-gray-500" />
                        ) : (
                          <User className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold">
                          {enrollment.child
                            ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
                            : `${enrollment.user?.firstName} ${enrollment.user?.lastName}`}
                        </h4>
                        {enrollment.child && (
                          <p className="text-sm text-gray-500">
                            Enfant de {enrollment.user?.firstName} {enrollment.user?.lastName}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusLabels[enrollment.status]?.bg
                        } ${statusLabels[enrollment.status]?.color}`}
                      >
                        {statusLabels[enrollment.status]?.label}
                      </span>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4" />
                        <span>{enrollment.user?.email}</span>
                      </div>
                      {enrollment.user?.phone && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span>{enrollment.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(enrollment.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {enrollment.requiresPayment && enrollment.paymentAmount && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <CreditCard className="h-4 w-4" />
                          <span>{enrollment.paymentAmount} CHF</span>
                        </div>
                      )}
                    </div>

                    {enrollment.notes && (
                      <p className="mt-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        Note: {enrollment.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {enrollment.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAction(enrollment.id, 'approve')}
                          disabled={actionLoading === enrollment.id}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === enrollment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approuver
                        </button>
                        <button
                          onClick={() => {
                            setRejectEnrollmentId(enrollment.id)
                            setShowRejectModal(true)
                          }}
                          disabled={actionLoading === enrollment.id}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Refuser
                        </button>
                      </>
                    )}

                    {enrollment.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAction(enrollment.id, 'cancel')}
                        disabled={actionLoading === enrollment.id}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-red-600" />
              Envoyer un email
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Destinataires</label>
                <select
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="all">Tous les inscrits ({stats.pending + stats.approved + stats.active})</option>
                  <option value="active">Participants actifs ({stats.active})</option>
                  <option value="pending">En attente ({stats.pending})</option>
                  <option value="approved">À payer ({stats.approved})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Ex: Rappel - Cours annulé demain"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Votre message..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {emailSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Refus */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Refuser l'inscription
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                Raison du refus (optionnel)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Ex: Places limitées, âge non compatible..."
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (rejectEnrollmentId) {
                    handleAction(rejectEnrollmentId, 'reject', rejectReason || undefined)
                  }
                }}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
