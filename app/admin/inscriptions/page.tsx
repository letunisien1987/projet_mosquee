'use client'

import { useEffect, useState } from 'react'
import { EnrollmentStatus } from '@prisma/client'
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Mail,
  FileText,
  Download,
  Users,
  AlertCircle,
  UserCheck,
  X,
  Edit2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Enrollment {
  id: string
  activityId: string
  activityIdOld: string | null
  activityTitle: string
  status: EnrollmentStatus
  notes: string | null
  internalNotes?: string | null
  rejectionReason?: string | null
  priority?: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  } | null
  child: {
    id: string
    firstName: string
    lastName: string
    birthDate: string
  } | null
}

export default function InscriptionsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'ALL'>('ALL')
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    waitingList: 0,
    interviewRequired: 0,
    active: 0,
  })

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/admin/enrollments')
      const data = await response.json()
      setEnrollments(data)

      // Calculer les stats
      setStats({
        total: data.length,
        pending: data.filter((e: Enrollment) => e.status === 'PENDING').length,
        approved: data.filter((e: Enrollment) => e.status === 'APPROVED').length,
        rejected: data.filter((e: Enrollment) => e.status === 'REJECTED').length,
        waitingList: data.filter((e: Enrollment) => e.status === 'WAITING_LIST').length,
        interviewRequired: data.filter((e: Enrollment) => e.status === 'INTERVIEW_REQUIRED').length,
        active: data.filter((e: Enrollment) => e.status === 'ACTIVE').length,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (
    id: string,
    status: EnrollmentStatus,
    extraData?: { internalNotes?: string; rejectionReason?: string }
  ) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extraData }),
      })

      if (response.ok) {
        fetchEnrollments()
        setShowDetailsModal(false)
        setInternalNote('')
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const exportToCSV = () => {
    const headers = ['Activité', 'Inscrit', 'Parent', 'Email', 'Téléphone', 'Statut', 'Date', 'Notes']
    const rows = filteredEnrollments.map((e) => [
      e.activityTitle,
      e.child ? `${e.child.firstName} ${e.child.lastName}` : e.user ? `${e.user.firstName} ${e.user.lastName}` : '-',
      e.user ? `${e.user.firstName} ${e.user.lastName}` : '-',
      e.user?.email || '-',
      e.user?.phone || '-',
      getStatusBadge(e.status).label,
      format(new Date(e.createdAt), 'dd/MM/yyyy'),
      e.notes || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `inscriptions_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const sendEmail = (email: string, subject: string = '') => {
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`
  }

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.activityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment.user &&
        (enrollment.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (enrollment.child &&
        (enrollment.child.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.child.lastName.toLowerCase().includes(searchTerm.toLowerCase())))

    const matchesStatus = statusFilter === 'ALL' || enrollment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: EnrollmentStatus) => {
    const badges = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock,
        label: 'En attente',
      },
      APPROVED: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        label: 'Approuvé',
      },
      REJECTED: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        label: 'Rejeté',
      },
      WAITING_LIST: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        icon: Users,
        label: 'Liste d\'attente',
      },
      INTERVIEW_REQUIRED: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        icon: AlertCircle,
        label: 'Entretien requis',
      },
      ACTIVE: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: UserCheck,
        label: 'Actif',
      },
    }
    return badges[status] || badges.PENDING
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const openDetailsModal = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setInternalNote(enrollment.internalNotes || '')
    setRejectionReason(enrollment.rejectionReason || '')
    setShowDetailsModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton export */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Inscriptions</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold mt-1">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Approuvés</p>
              <p className="text-2xl font-bold mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Actifs</p>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Liste d'attente</p>
              <p className="text-2xl font-bold mt-1">{stats.waitingList}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Entretien</p>
              <p className="text-2xl font-bold mt-1">{stats.interviewRequired}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rejetés</p>
              <p className="text-2xl font-bold mt-1">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par activité, nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EnrollmentStatus | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvé</option>
              <option value="ACTIVE">Actif</option>
              <option value="WAITING_LIST">Liste d'attente</option>
              <option value="INTERVIEW_REQUIRED">Entretien requis</option>
              <option value="REJECTED">Rejeté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des inscriptions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Inscrit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune inscription trouvée
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment) => {
                  const statusBadge = getStatusBadge(enrollment.status)
                  const StatusIcon = statusBadge.icon

                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{enrollment.activityTitle}</div>
                        {enrollment.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Note: {enrollment.notes.substring(0, 50)}
                            {enrollment.notes.length > 50 && '...'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.child ? (
                          <div>
                            <div className="text-sm font-medium">
                              {enrollment.child.firstName} {enrollment.child.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {calculateAge(enrollment.child.birthDate)} ans
                            </div>
                          </div>
                        ) : enrollment.user ? (
                          <div className="text-sm">
                            {enrollment.user.firstName} {enrollment.user.lastName}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {enrollment.user ? (
                          <div>
                            <div className="text-sm">
                              {enrollment.user.firstName} {enrollment.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {enrollment.user.email}
                            </div>
                            {enrollment.user.phone && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {enrollment.user.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(enrollment.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailsModal(enrollment)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {enrollment.user && (
                            <button
                              onClick={() =>
                                sendEmail(
                                  enrollment.user!.email,
                                  `Inscription - ${enrollment.activityTitle}`
                                )
                              }
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                              title="Envoyer un email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredEnrollments.length} inscription{filteredEnrollments.length > 1 ? 's' : ''} sur{' '}
        {stats.total}
      </div>

      {/* Modal Détails */}
      {showDetailsModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Détails de l'inscription</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Activité */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Activité</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedEnrollment.activityTitle}</p>
                </div>

                {/* Participant */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Participant</h3>
                  {selectedEnrollment.child ? (
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedEnrollment.child.firstName} {selectedEnrollment.child.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {calculateAge(selectedEnrollment.child.birthDate)} ans (
                        {format(new Date(selectedEnrollment.child.birthDate), 'dd/MM/yyyy')})
                      </p>
                    </div>
                  ) : selectedEnrollment.user ? (
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedEnrollment.user.firstName} {selectedEnrollment.user.lastName}
                    </p>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>

                {/* Parent */}
                {selectedEnrollment.user && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contact Parent</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedEnrollment.user.firstName} {selectedEnrollment.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEnrollment.user.email}</p>
                    {selectedEnrollment.user.phone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEnrollment.user.phone}</p>
                    )}
                  </div>
                )}

                {/* Statut */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Statut actuel</h3>
                  {(() => {
                    const statusBadge = getStatusBadge(selectedEnrollment.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <span
                        className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusBadge.label}
                      </span>
                    )
                  })()}
                </div>

                {/* Notes publiques */}
                {selectedEnrollment.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes du parent</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedEnrollment.notes}
                    </p>
                  </div>
                )}

                {/* Notes internes */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes internes (admin uniquement)</h3>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ajoutez des notes privées visibles uniquement par les admins..."
                  />
                  {internalNote !== selectedEnrollment.internalNotes && (
                    <button
                      onClick={() =>
                        updateStatus(selectedEnrollment.id, selectedEnrollment.status, {
                          internalNotes: internalNote,
                        })
                      }
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Sauvegarder les notes
                    </button>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Dates</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Créé le: {format(new Date(selectedEnrollment.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Modifié le:{' '}
                    {format(new Date(selectedEnrollment.updatedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>

                {/* Actions rapides */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Changer le statut</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedEnrollment.status !== 'APPROVED' && (
                      <button
                        onClick={() => updateStatus(selectedEnrollment.id, 'APPROVED')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approuver
                      </button>
                    )}
                    {selectedEnrollment.status !== 'ACTIVE' && (
                      <button
                        onClick={() => updateStatus(selectedEnrollment.id, 'ACTIVE')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <UserCheck className="h-4 w-4" />
                        Activer
                      </button>
                    )}
                    {selectedEnrollment.status !== 'WAITING_LIST' && (
                      <button
                        onClick={() => updateStatus(selectedEnrollment.id, 'WAITING_LIST')}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        Liste d'attente
                      </button>
                    )}
                    {selectedEnrollment.status !== 'INTERVIEW_REQUIRED' && (
                      <button
                        onClick={() => updateStatus(selectedEnrollment.id, 'INTERVIEW_REQUIRED')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Entretien requis
                      </button>
                    )}
                    {selectedEnrollment.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          if (rejectionReason.trim()) {
                            updateStatus(selectedEnrollment.id, 'REJECTED', {
                              rejectionReason: rejectionReason,
                            })
                          } else {
                            alert('Veuillez indiquer une raison de refus')
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeter
                      </button>
                    )}
                  </div>

                  {/* Champ raison de refus */}
                  {selectedEnrollment.status === 'PENDING' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Raison du refus (si rejeté)</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="Ex: Activité complète, âge non adapté..."
                      />
                    </div>
                  )}

                  {selectedEnrollment.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">Raison du refus:</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{selectedEnrollment.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
