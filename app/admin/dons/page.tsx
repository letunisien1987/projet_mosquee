'use client'

import { useEffect, useState } from 'react'
import { DonationType } from '@prisma/client'
import { DollarSign, TrendingUp, Heart, Calendar, Search, Filter, Download, PieChart } from 'lucide-react'
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

interface ProjectStat {
  name: string
  amount: number
  percentage: number
  count: number
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
    membership: 0,
  })
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([])

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
        zakat: data
          .filter((d: Donation) => d.type === 'ZAKAT')
          .reduce((sum: number, d: Donation) => sum + d.amount, 0),
        sadaqa: data
          .filter((d: Donation) => d.type === 'SADAQA')
          .reduce((sum: number, d: Donation) => sum + d.amount, 0),
        zakatAlFitr: data
          .filter((d: Donation) => d.type === 'ZAKAT_AL_FITR')
          .reduce((sum: number, d: Donation) => sum + d.amount, 0),
        project: data
          .filter((d: Donation) => d.type === 'PROJECT')
          .reduce((sum: number, d: Donation) => sum + d.amount, 0),
        membership: data
          .filter((d: Donation) => d.type === 'MEMBERSHIP')
          .reduce((sum: number, d: Donation) => sum + d.amount, 0),
      })

      // Calculer les stats par projet
      const projectDonations = data.filter((d: Donation) => d.type === 'PROJECT' && d.projectName)
      const projectTotals = projectDonations.reduce((acc: any, d: Donation) => {
        const name = d.projectName || 'Non spécifié'
        if (!acc[name]) {
          acc[name] = { amount: 0, count: 0 }
        }
        acc[name].amount += d.amount
        acc[name].count += 1
        return acc
      }, {})

      const projectAmount = data
        .filter((d: Donation) => d.type === 'PROJECT')
        .reduce((sum: number, d: Donation) => sum + d.amount, 0)

      const projectStatsArray: ProjectStat[] = Object.entries(projectTotals).map(([name, stats]: [string, any]) => ({
        name,
        amount: stats.amount,
        count: stats.count,
        percentage: projectAmount > 0 ? (stats.amount / projectAmount) * 100 : 0,
      }))

      projectStatsArray.sort((a, b) => b.amount - a.amount)
      setProjectStats(projectStatsArray)
    } catch (error) {
      console.error('Erreur lors du chargement des dons:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Donateur', 'Email', 'Téléphone', 'Type', 'Projet', 'Montant', 'Message']
    const rows = filteredDonations.map((d) => [
      format(new Date(d.createdAt), 'dd/MM/yyyy'),
      d.anonymous ? 'Anonyme' : `${d.firstName} ${d.lastName}`,
      d.anonymous ? '' : d.email,
      d.anonymous ? '' : d.phone || '',
      getTypeLabel(d.type),
      d.projectName || '',
      d.amount.toFixed(2),
      d.message || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `dons_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
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

  const typeStats = [
    {
      type: 'ZAKAT',
      label: 'Zakat',
      amount: stats.zakat,
      percentage: stats.totalAmount > 0 ? (stats.zakat / stats.totalAmount) * 100 : 0,
      color: 'bg-green-500',
    },
    {
      type: 'SADAQA',
      label: 'Sadaqa',
      amount: stats.sadaqa,
      percentage: stats.totalAmount > 0 ? (stats.sadaqa / stats.totalAmount) * 100 : 0,
      color: 'bg-blue-500',
    },
    {
      type: 'ZAKAT_AL_FITR',
      label: 'Zakat al-Fitr',
      amount: stats.zakatAlFitr,
      percentage: stats.totalAmount > 0 ? (stats.zakatAlFitr / stats.totalAmount) * 100 : 0,
      color: 'bg-purple-500',
    },
    {
      type: 'PROJECT',
      label: 'Projets',
      amount: stats.project,
      percentage: stats.totalAmount > 0 ? (stats.project / stats.totalAmount) * 100 : 0,
      color: 'bg-yellow-500',
    },
    {
      type: 'MEMBERSHIP',
      label: 'Adhésions',
      amount: stats.membership,
      percentage: stats.totalAmount > 0 ? (stats.membership / stats.totalAmount) * 100 : 0,
      color: 'bg-gray-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Dons</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Nombre total de dons</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
            </div>
            <DollarSign className="h-16 w-16 text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Montant total collecté</p>
              <p className="text-4xl font-bold mt-2">{stats.totalAmount.toLocaleString('fr-FR')}€</p>
            </div>
            <TrendingUp className="h-16 w-16 text-green-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Montant moyen par don</p>
              <p className="text-4xl font-bold mt-2">
                {stats.total > 0 ? (stats.totalAmount / stats.total).toFixed(2) : '0'}€
              </p>
            </div>
            <Heart className="h-16 w-16 text-purple-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Répartition par type */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Répartition par Type de Don</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                <th className="text-right py-3 px-4 font-semibold text-sm">Montant</th>
                <th className="text-right py-3 px-4 font-semibold text-sm">Pourcentage</th>
                <th className="py-3 px-4">Visualisation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {typeStats.map((stat) => (
                <tr key={stat.type} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <span className="font-medium">{stat.label}</span>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                    {stat.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                  </td>
                  <td className="py-4 px-4 text-right font-semibold">
                    {stat.percentage.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${stat.color} transition-all duration-500`}
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 dark:border-gray-700 font-bold">
              <tr>
                <td className="py-3 px-4">TOTAL</td>
                <td className="py-3 px-4 text-right text-lg text-green-600 dark:text-green-400">
                  {stats.totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                </td>
                <td className="py-3 px-4 text-right">100%</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Répartition par projet */}
      {projectStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Répartition par Projet</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Nom du Projet</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Nb Dons</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Montant</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">% du Total Projets</th>
                  <th className="py-3 px-4">Visualisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {projectStats.map((project) => (
                  <tr key={project.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4">
                      <span className="font-medium">{project.name}</span>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                      {project.count}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                      {project.amount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      €
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">{project.percentage.toFixed(1)}%</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all duration-500"
                          style={{ width: `${project.percentage}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 dark:border-gray-700 font-bold">
                <tr>
                  <td className="py-3 px-4">TOTAL PROJETS</td>
                  <td className="py-3 px-4 text-right">
                    {projectStats.reduce((sum, p) => sum + p.count, 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-lg text-green-600 dark:text-green-400">
                    {stats.project.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                  </td>
                  <td className="py-3 px-4 text-right">100%</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

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
                          {donation.phone && <div className="text-gray-500 dark:text-gray-500">{donation.phone}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(
                          donation.type
                        )}`}
                      >
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
