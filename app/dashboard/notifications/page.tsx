'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  CheckCircle,
  Calendar,
  CreditCard,
  BookOpen,
  AlertCircle,
  Check,
  CheckCheck
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

const getNotificationIcon = (type: string) => {
  if (type.includes('EVENT')) return <Calendar className="h-5 w-5" />
  if (type.includes('PAYMENT')) return <CreditCard className="h-5 w-5" />
  if (type.includes('ENROLLMENT')) return <BookOpen className="h-5 w-5" />
  return <Bell className="h-5 w-5" />
}

const getNotificationColor = (type: string) => {
  if (type.includes('CONFIRMED') || type.includes('APPROVED')) return 'text-green-600 bg-green-100 dark:bg-green-900/20'
  if (type.includes('PENDING')) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
  if (type.includes('CANCELLED') || type.includes('REJECTED') || type.includes('FAILED')) return 'text-red-600 bg-red-100 dark:bg-red-900/20'
  return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins <= 1 ? "À l'instant" : `Il y a ${diffMins} min`
    }
    return `Il y a ${diffHours}h`
  }
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`

  return date.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export default function NotificationsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadNotifications()
    }
  }, [status, filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (filter === 'unread') params.append('unreadOnly', 'true')
      params.append('limit', '50')

      const res = await fetch(`/api/membre/notifications?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/membre/notifications/${id}/read`, {
        method: 'POST',
      })

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/membre/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      })

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadNotifications}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Notifications
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes vos notifications sont lues'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <CheckCheck className="h-5 w-5" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unread'
              ? 'Vous avez lu toutes vos notifications'
              : 'Vous recevrez des notifications pour vos inscriptions et paiements'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all ${
                notification.read
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-primary/50 bg-primary/5 dark:bg-primary/10'
              }`}
            >
              <div className="p-4 flex items-start gap-4">
                <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium ${notification.read ? 'text-gray-900 dark:text-white' : 'text-primary'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Voir détails
                      </Link>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Marquer comme lu
                      </button>
                    )}
                    {notification.read && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Lu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
