'use client'

import { useEffect, useState } from 'react'
import { DonationType } from '@prisma/client'
import { DollarSign, TrendingUp, Heart, Calendar, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Donation {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  amount: number
  type: DonationType
  projectId: string | null
  projectName: string | null
  message: string | null
  anonymous: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export default function DonsPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<DonationType | 'ALL'>('ALL')
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    zakat: 0,
    sadaqa: 0,
    zakatAlFitr: 0,
    project: 0,
  })

  useEffect(() => {
    fetchDonations()
  }, [])

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/admin/donations')
      const data = await response.json()
      setDonations(data)

      // Calculer les stats
      const totalAmount = data.reduce((sum: number, d: Donation) => sum + d.amount, 0)
      setStats({
        total: data.length,
        totalAmount,
        zakat: data.filter((d: Donation) => d.type === 'ZAKAT').reduce((sum: number, d: Donation) => sum + d.amount, 0),
        sadaqa: data.filter((d: Donation) => d.type === 'SADAQA').reduce((sum: number, d: Donation) => sum + d.amount, 0),
        zakatAlFitr: data.filter((d: Donation) => d.type === 'ZAKAT_AL_FITR').reduce((sum: number, d: Donation) => sum + d.amount, 0),
        project: data.filter((d: Donation) => d.type === 'PROJECT').reduce((sum: number, d: Donation) => sum + d.amount, 0),
      })
    } catch (error) {
      console.error('Erreur lors du chargement des dons:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.projectName && donation.projectName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === 'ALL' || donation.type === typeFilter

    return matchesSearch && matchesType
  })

  const getTypeLabel = (type: DonationType) => {
    const labels = {
      ZAKAT: 'Zakat',
      SADAQA: 'Sadaqa',
      ZAKAT_AL_FITR: 'Zakat al-Fitr',
      PROJECT: 'Projet',
      MEMBERSHIP: 'Adhésion',
    }
    return labels[type]
  }

  const getTypeBadgeColor = (type: DonationType) => {
    const colors = {
      ZAKAT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      SADAQA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ZAKAT_AL_FITR: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      PROJECT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      MEMBERSHIP: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return colors[type] || colors.SADAQA
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Dons</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Montant Total</p>
              <p className="text-2xl font-bold mt-2">{stats.totalAmount.toFixed(2)}€</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Zakat</p>
            <p className="text-xl font-bold mt-2">{stats.zakat.toFixed(2)}€</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sadaqa</p>
            <p className="text-xl font-bold mt-2">{stats.sadaqa.toFixed(2)}€</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Projets</p>
            <p className="text-xl font-bold mt-2">{stats.project.toFixed(2)}€</p>
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
                placeholder="Rechercher par nom, email ou projet..."
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
              onChange={(e) => setTypeFilter(e.target.value as DonationType | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Tous les types</option>
              <option value="ZAKAT">Zakat</option>
              <option value="SADAQA">Sadaqa</option>
              <option value="ZAKAT_AL_FITR">Zakat al-Fitr</option>
              <option value="PROJECT">Projet</option>
              <option value="MEMBERSHIP">Adhésion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des dons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Donateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Projet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun don trouvé
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {donation.anonymous ? (
                          <span className="text-gray-500 dark:text-gray-400 italic">Anonyme</span>
                        ) : (
                          <>
                            {donation.firstName} {donation.lastName}
                          </>
                        )}
                      </div>
                      {donation.message && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                          {donation.message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!donation.anonymous && (
                        <div className="text-sm">
                          <div className="text-gray-600 dark:text-gray-400">{donation.email}</div>
                          {donation.phone && (
                            <div className="text-gray-500 dark:text-gray-500">{donation.phone}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(donation.type)}`}>
                        {getTypeLabel(donation.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {donation.projectName ? (
                        <span className="text-sm">{donation.projectName}</span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {donation.amount.toFixed(2)}€
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(donation.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredDonations.length} don{filteredDonations.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
