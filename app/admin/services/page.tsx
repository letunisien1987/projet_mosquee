'use client'

import { useEffect, useState } from 'react'
import { ServiceType, ServiceStatus } from '@prisma/client'
import { FileText, CheckCircle, XCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ServiceRequest {
  id: string
  serviceType: ServiceType
  status: ServiceStatus
  firstName: string
  lastName: string
  email: string
  phone: string
  details: string
  requestDate: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export default function ServicesPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL')
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/service-requests')
      const data = await response.json()
      setRequests(data)

      // Calculer les stats
      setStats({
        total: data.length,
        pending: data.filter((r: ServiceRequest) => r.status === 'PENDING').length,
        approved: data.filter((r: ServiceRequest) => r.status === 'APPROVED').length,
        completed: data.filter((r: ServiceRequest) => r.status === 'COMPLETED').length,
        cancelled: data.filter((r: ServiceRequest) => r.status === 'CANCELLED').length,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: ServiceStatus) => {
    try {
      const response = await fetch(`/api/admin/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchRequests()
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'ALL' || request.serviceType === typeFilter
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: ServiceStatus) => {
    const badges = {
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock,
        label: 'En attente',
      },
      APPROVED: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: AlertCircle,
        label: 'Approuvé',
      },
      COMPLETED: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        label: 'Complété',
      },
      CANCELLED: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        label: 'Annulé',
      },
    }
    return badges[status]
  }

  const getTypeLabel = (type: ServiceType) => {
    const labels = {
      MARRIAGE: 'Mariage',
      FUNERAL: 'Funérailles',
      SHAHADA: 'Shahada',
      AQIQA: 'Aqiqa',
    }
    return labels[type]
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <FileText className="h-12 w-12 text-blue-500" />
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
            <AlertCircle className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Complétés</p>
              <p className="text-3xl font-bold mt-2">{stats.completed}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Annulés</p>
              <p className="text-3xl font-bold mt-2">{stats.cancelled}</p>
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
                placeholder="Rechercher par nom ou détails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ServiceType | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous les types</option>
              <option value="MARRIAGE">Mariage</option>
              <option value="FUNERAL">Funérailles</option>
              <option value="SHAHADA">Shahada</option>
              <option value="AQIQA">Aqiqa</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvé</option>
              <option value="COMPLETED">Complété</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type de service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Demandeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date souhaitée
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune demande trouvée
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const statusBadge = getStatusBadge(request.status)
                  const StatusIcon = statusBadge.icon

                  return (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium">{getTypeLabel(request.serviceType)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {request.firstName} {request.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">{request.email}</div>
                          <div className="text-gray-500 dark:text-gray-500">{request.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {request.requestDate ? (
                          format(new Date(request.requestDate), 'dd MMM yyyy', { locale: fr })
                        ) : (
                          <span className="text-gray-500">Non spécifiée</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de détail */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Demande de service - {getTypeLabel(selectedRequest.serviceType)}</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Demandeur</label>
                <p className="text-lg">
                  {selectedRequest.firstName} {selectedRequest.lastName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p>{selectedRequest.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                  <p>{selectedRequest.phone}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date souhaitée</label>
                <p>
                  {selectedRequest.requestDate
                    ? format(new Date(selectedRequest.requestDate), 'dd MMMM yyyy', { locale: fr })
                    : 'Non spécifiée'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Détails</label>
                <p className="mt-2 whitespace-pre-wrap">{selectedRequest.details}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut actuel</label>
                <div className="mt-2">
                  {(() => {
                    const statusBadge = getStatusBadge(selectedRequest.status)
                    const StatusIcon = statusBadge.icon
                    return (
                      <span className={`px-3 py-1 inline-flex items-center gap-1 text-sm font-semibold rounded-full ${statusBadge.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        {statusBadge.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de demande</label>
                <p>{format(new Date(selectedRequest.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2 flex-wrap">
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'APPROVED')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => updateStatus(selectedRequest.id, 'CANCELLED')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Annuler
                  </button>
                </>
              )}
              {selectedRequest.status === 'APPROVED' && (
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'COMPLETED')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Marquer comme complété
                </button>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Résumé */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
