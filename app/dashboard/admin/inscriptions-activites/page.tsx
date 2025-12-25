'use client'

import { useEffect, useState, useMemo } from 'react'
import { EnrollmentStatus } from '@prisma/client'
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Users,
  AlertCircle,
  UserCheck,
  X,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DataTable, ColumnDef, RowAction, BulkAction } from '@/components/admin/DataTable'

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

const statusConfig: Record<EnrollmentStatus, { color: string; icon: typeof Clock; label: string }> = {
  PENDING: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
    label: 'En attente',
  },
  APPROVED: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
    label: 'Approuve',
  },
  REJECTED: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    label: 'Rejete',
  },
  WAITING_LIST: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    icon: Users,
    label: "Liste d'attente",
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

const statusFilterOptions = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuve' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'WAITING_LIST', label: "Liste d'attente" },
  { value: 'INTERVIEW_REQUIRED', label: 'Entretien requis' },
  { value: 'REJECTED', label: 'Rejete' },
]

const statusEditOptions = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuve' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'WAITING_LIST', label: "Liste d'attente" },
  { value: 'INTERVIEW_REQUIRED', label: 'Entretien requis' },
  { value: 'REJECTED', label: 'Rejete' },
]

export default function InscriptionsActivitesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const stats = useMemo(() => {
    return {
      total: enrollments.length,
      pending: enrollments.filter((e) => e.status === 'PENDING').length,
      approved: enrollments.filter((e) => e.status === 'APPROVED').length,
      rejected: enrollments.filter((e) => e.status === 'REJECTED').length,
      waitingList: enrollments.filter((e) => e.status === 'WAITING_LIST').length,
      interviewRequired: enrollments.filter((e) => e.status === 'INTERVIEW_REQUIRED').length,
      active: enrollments.filter((e) => e.status === 'ACTIVE').length,
    }
  }, [enrollments])

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/admin/enrollments')

      if (response.status === 401) {
        window.location.href = '/connexion'
        return
      }

      if (!response.ok) {
        console.error('Erreur API:', response.status, response.statusText)
        setEnrollments([])
        return
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        console.error('Les donnees recues ne sont pas un tableau:', data)
        setEnrollments([])
        return
      }

      setEnrollments(data)
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
      setEnrollments([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEnrollments()
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
      console.error('Erreur lors de la mise a jour:', error)
    }
  }

  const bulkUpdateStatus = async (enrollments: Enrollment[], status: EnrollmentStatus) => {
    try {
      await Promise.all(
        enrollments.map((e) =>
          fetch(`/api/admin/enrollments/${e.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      )
      fetchEnrollments()
    } catch (error) {
      console.error('Erreur lors de la mise a jour en masse:', error)
    }
  }

  const sendEmail = (email: string, subject: string = '') => {
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`
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

  const columns: ColumnDef<Enrollment>[] = useMemo(
    () => [
      {
        id: 'activityTitle',
        header: 'Activite',
        accessorKey: 'activityTitle',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.activityTitle}</div>
            {row.notes && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Note: {row.notes.substring(0, 50)}
                {row.notes.length > 50 && '...'}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'inscrit',
        header: 'Inscrit',
        accessorFn: (row) =>
          row.child
            ? `${row.child.firstName} ${row.child.lastName}`
            : row.user
            ? `${row.user.firstName} ${row.user.lastName}`
            : '-',
        cell: ({ row }) =>
          row.child ? (
            <div>
              <div className="font-medium">
                {row.child.firstName} {row.child.lastName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {calculateAge(row.child.birthDate)} ans
              </div>
            </div>
          ) : row.user ? (
            <div>
              {row.user.firstName} {row.user.lastName}
            </div>
          ) : (
            <span className="text-gray-500">-</span>
          ),
      },
      {
        id: 'parent',
        header: 'Parent / Contact',
        accessorFn: (row) => (row.user ? `${row.user.firstName} ${row.user.lastName}` : '-'),
        cell: ({ row }) =>
          row.user ? (
            <div>
              <div>
                {row.user.firstName} {row.user.lastName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{row.user.email}</div>
              {row.user.phone && (
                <div className="text-sm text-gray-500 dark:text-gray-400">{row.user.phone}</div>
              )}
            </div>
          ) : (
            <span className="text-gray-500">-</span>
          ),
      },
      {
        id: 'status',
        header: 'Statut',
        accessorKey: 'status',
        filterType: 'select',
        filterOptions: statusFilterOptions,
        editable: true,
        editType: 'select',
        editOptions: statusEditOptions,
        onEdit: async (row, newValue) => {
          await updateStatus(row.id, newValue as EnrollmentStatus)
        },
        cell: ({ row }) => {
          const config = statusConfig[row.status]
          const StatusIcon = config.icon
          return (
            <span
              className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${config.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
          )
        },
      },
      {
        id: 'createdAt',
        header: 'Date',
        accessorKey: 'createdAt',
        cell: ({ value }) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(value), 'dd MMM yyyy', { locale: fr })}
          </span>
        ),
      },
    ],
    []
  )

  const rowActions: RowAction<Enrollment>[] = useMemo(
    () => [
      {
        id: 'view',
        label: 'Voir les details',
        icon: Eye,
        onClick: (row) => openDetailsModal(row),
        variant: 'primary',
      },
      {
        id: 'email',
        label: 'Envoyer un email',
        icon: Mail,
        onClick: (row) => {
          if (row.user) {
            sendEmail(row.user.email, `Inscription - ${row.activityTitle}`)
          }
        },
        condition: (row) => !!row.user,
      },
    ],
    []
  )

  const bulkActions: BulkAction<Enrollment>[] = useMemo(
    () => [
      {
        id: 'approve',
        label: 'Approuver',
        icon: CheckCircle,
        onClick: (rows) => bulkUpdateStatus(rows, 'APPROVED'),
        variant: 'success',
        confirmMessage: 'Approuver les inscriptions selectionnees ?',
      },
      {
        id: 'activate',
        label: 'Activer',
        icon: UserCheck,
        onClick: (rows) => bulkUpdateStatus(rows, 'ACTIVE'),
        variant: 'primary',
        confirmMessage: 'Activer les inscriptions selectionnees ?',
      },
      {
        id: 'waitingList',
        label: "Liste d'attente",
        icon: Users,
        onClick: (rows) => bulkUpdateStatus(rows, 'WAITING_LIST'),
        variant: 'warning',
        confirmMessage: 'Mettre en liste d\'attente ?',
      },
      {
        id: 'reject',
        label: 'Rejeter',
        icon: XCircle,
        onClick: (rows) => bulkUpdateStatus(rows, 'REJECTED'),
        variant: 'danger',
        confirmMessage: 'Rejeter les inscriptions selectionnees ?',
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inscriptions Activites</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gestion des inscriptions aux cours et activites</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Approuves</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Liste attente</p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">Rejetes</p>
              <p className="text-2xl font-bold mt-1">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={enrollments}
        columns={columns}
        rowActions={rowActions}
        bulkActions={bulkActions}
        getRowId={(row) => row.id}
        loading={loading}
        title="Inscriptions aux activites"
        subtitle={`${stats.pending} inscription(s) en attente de traitement`}
        enableSelection={true}
        enablePagination={true}
        enableSearch={true}
        enableColumnVisibility={true}
        enableExport={true}
        enableRowNumbers={true}
        pageSize={25}
        searchPlaceholder="Rechercher par activite, nom, email..."
        emptyMessage="Aucune inscription trouvee"
        headerActions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Modal Details */}
      {showDetailsModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Details de l'inscription</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Activite</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedEnrollment.activityTitle}</p>
                </div>

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

                <div>
                  <h3 className="text-lg font-semibold mb-2">Statut actuel</h3>
                  {(() => {
                    const config = statusConfig[selectedEnrollment.status]
                    const StatusIcon = config.icon
                    return (
                      <span
                        className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    )
                  })()}
                </div>

                {selectedEnrollment.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes du parent</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedEnrollment.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes internes (admin uniquement)</h3>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ajoutez des notes privees visibles uniquement par les admins..."
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

                <div>
                  <h3 className="text-lg font-semibold mb-2">Dates</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cree le: {format(new Date(selectedEnrollment.createdAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Modifie le:{' '}
                    {format(new Date(selectedEnrollment.updatedAt), 'dd MMMM yyyy a HH:mm', { locale: fr })}
                  </p>
                </div>

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

                  {selectedEnrollment.status === 'PENDING' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Raison du refus (si rejete)</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="Ex: Activite complete, age non adapte..."
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
