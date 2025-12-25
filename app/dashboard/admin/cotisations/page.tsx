'use client'

import { useEffect, useState } from 'react'
import { MembershipType, MembershipStatus } from '@prisma/client'
import { CreditCard, TrendingUp, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Membership {
  id: string
  type: MembershipType
  status: MembershipStatus
  amount: number
  startDate: string
  endDate: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function CotisationsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<MembershipType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'ALL'>('ALL')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    pending: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      const response = await fetch('/api/admin/memberships')
      const data = await response.json()
      setMemberships(data)

      setStats({
        total: data.length,
        active: data.filter((m: Membership) => m.status === 'ACTIVE').length,
        expired: data.filter((m: Membership) => m.status === 'EXPIRED').length,
        pending: data.filter((m: Membership) => m.status === 'PENDING').length,
        totalRevenue: data.reduce((sum: number, m: Membership) => sum + m.amount, 0),
      })
    } catch (error) {
      console.error('Erreur lors du chargement des cotisations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMemberships = memberships.filter((membership) => {
    const matchesSearch =
      membership.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'ALL' || membership.type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || membership.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: MembershipStatus) => {
    const badges = {
      ACTIVE: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        label: 'Actif',
      },
      EXPIRED: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        label: 'Expire',
      },
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock,
        label: 'En attente',
      },
    }
    return badges[status]
  }

  const getTypeLabel = (type: MembershipType) => {
    const labels: Record<MembershipType, string> = {
      ACTIF: 'Membre actif',
      PASSIF: 'Membre passif',
      INDIVIDUAL: 'Individuel',
      FAMILY: 'Famille',
      STUDENT: 'Etudiant',
      SENIOR: 'Senior',
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cotisations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gestion des cotisations membres</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <CreditCard className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actifs</p>
              <p className="text-3xl font-bold mt-2">{stats.active}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Expires</p>
              <p className="text-3xl font-bold mt-2">{stats.expired}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenu Total</p>
              <p className="text-3xl font-bold mt-2">{stats.totalRevenue.toFixed(2)} CHF</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500" />
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
                placeholder="Rechercher par nom ou email..."
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
              onChange={(e) => setTypeFilter(e.target.value as MembershipType | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous les types</option>
              <option value="ACTIF">Membre actif</option>
              <option value="PASSIF">Membre passif</option>
              <option value="INDIVIDUAL">Individuel</option>
              <option value="FAMILY">Famille</option>
              <option value="STUDENT">Etudiant</option>
              <option value="SENIOR">Senior</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="PENDING">En attente</option>
              <option value="EXPIRED">Expire</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des cotisations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Souscription
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMemberships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune cotisation trouvee
                  </td>
                </tr>
              ) : (
                filteredMemberships.map((membership) => {
                  const statusBadge = getStatusBadge(membership.status)
                  const StatusIcon = statusBadge.icon

                  return (
                    <tr key={membership.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {membership.user.firstName} {membership.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {membership.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">{getTypeLabel(membership.type)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold">{membership.amount.toFixed(2)} CHF</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div>{format(new Date(membership.startDate), 'dd MMM yyyy', { locale: fr })}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            au {format(new Date(membership.endDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(membership.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resume */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredMemberships.length} cotisation{filteredMemberships.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
