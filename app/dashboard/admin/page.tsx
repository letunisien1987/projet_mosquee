'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  DollarSign,
  BookOpen,
  MessageSquare,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Membres Actifs',
      value: stats?.activeMemberships || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Dons ce Mois',
      value: `${stats?.donationsThisMonth?.total?.toFixed(2) || 0} CHF`,
      subtitle: `${stats?.donationsThisMonth?.count || 0} dons`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Inscriptions en Attente',
      value: stats?.pendingEnrollments || 0,
      icon: BookOpen,
      color: 'bg-yellow-500',
    },
    {
      name: 'Messages Non Lus',
      value: stats?.unreadMessages || 0,
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Administration</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Vue d'ensemble de la gestion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold">Alertes</h2>
          </div>
          <div className="space-y-3">
            {stats?.expiringMemberships > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-sm font-semibold">Cotisations expirant bientot</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {stats.expiringMemberships} cotisation(s) expire(nt) dans les 30 prochains jours
                </p>
              </div>
            )}
            {stats?.pendingEnrollments > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-semibold">Inscriptions en attente</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {stats.pendingEnrollments} inscription(s) a traiter
                </p>
              </div>
            )}
            {stats?.unreadMessages > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm font-semibold">Nouveaux messages</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {stats.unreadMessages} message(s) non lu(s)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-bold">Dons - 6 Derniers Mois</h2>
          </div>
          <div className="space-y-2">
            {stats?.monthlyDonations?.map((month: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(month.month).toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <span className="font-semibold">
                  {parseFloat(month.total).toFixed(2)} CHF
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/admin/inscriptions-activites"
            className="bg-primary text-white rounded-lg p-4 text-center hover:bg-primary-dark transition-colors"
          >
            Gerer Inscriptions
          </Link>
          <Link
            href="/dashboard/admin/messages"
            className="bg-accent text-white rounded-lg p-4 text-center hover:opacity-90 transition-colors"
          >
            Lire Messages
          </Link>
          <Link
            href="/dashboard/admin/dons"
            className="bg-green-500 text-white rounded-lg p-4 text-center hover:bg-green-600 transition-colors"
          >
            Voir Dons
          </Link>
          <Link
            href="/dashboard/admin/services"
            className="bg-blue-500 text-white rounded-lg p-4 text-center hover:bg-blue-600 transition-colors"
          >
            Demandes Services
          </Link>
        </div>
      </div>
    </div>
  )
}
