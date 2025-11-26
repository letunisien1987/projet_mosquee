'use client'

import { useEffect, useState } from 'react'
import { EnrollmentStatus } from '@prisma/client'
import { BookOpen, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Enrollment {
  id: string
  activityId: string
  activityTitle: string
  status: EnrollmentStatus
  notes: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
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
      })
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: EnrollmentStatus) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchEnrollments()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch =
      enrollment.activityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment.user &&
        (enrollment.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enrollment.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))) ||
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
    }
    return badges[status]
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <BookOpen className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-3xl font-bold mt-2">{stats.pending}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Approuvés</p>
              <p className="text-3xl font-bold mt-2">{stats.approved}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rejetés</p>
              <p className="text-3xl font-bold mt-2">{stats.rejected}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500" />
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
                placeholder="Rechercher par activité ou nom..."
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
                            {enrollment.notes}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enrollment.user ? (
                          <div>
                            <div className="text-sm">
                              {enrollment.user.firstName} {enrollment.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {enrollment.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(enrollment.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {enrollment.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(enrollment.id, 'APPROVED')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Approuver
                            </button>
                            <button
                              onClick={() => updateStatus(enrollment.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Rejeter
                            </button>
                          </div>
                        )}
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
        Affichage de {filteredEnrollments.length} inscription{filteredEnrollments.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
