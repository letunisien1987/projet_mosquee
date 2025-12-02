'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, CreditCard, Heart, Calendar, BookOpen, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { NotificationType } from '@prisma/client'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: Date
}

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

// Map notification types to icons and colors
const notificationConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  EVENT_CONFIRMATION: { icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  EVENT_REMINDER: { icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  EVENT_CANCELLED: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  EVENT_WAITLIST_SPOT_AVAILABLE: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  ENROLLMENT_CONFIRMATION: { icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  ENROLLMENT_APPROVED: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  ENROLLMENT_REJECTED: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  PAYMENT_PENDING: { icon: CreditCard, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  PAYMENT_CONFIRMED: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  PAYMENT_FAILED: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  MEMBERSHIP_PENDING_PAYMENT: { icon: CreditCard, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  MEMBERSHIP_CONFIRMED: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  MEMBERSHIP_REFUNDED: { icon: CreditCard, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  MEMBERSHIP_EXPIRING_SOON: { icon: Bell, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  DONATION_CONFIRMED: { icon: Heart, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  SYSTEM: { icon: Bell, color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900/20' },
  REMINDER: { icon: Bell, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
}

// Get action button text based on notification type
function getActionButton(type: NotificationType, link?: string | null) {
  if (!link) return null

  switch (type) {
    case 'MEMBERSHIP_PENDING_PAYMENT':
      return { text: 'Payer cotisation', variant: 'danger' as const }
    case 'PAYMENT_PENDING':
      return { text: 'Effectuer le paiement', variant: 'danger' as const }
    case 'MEMBERSHIP_EXPIRING_SOON':
      return { text: 'Renouveler', variant: 'primary' as const }
    case 'EVENT_WAITLIST_SPOT_AVAILABLE':
      return { text: 'S\'inscrire maintenant', variant: 'success' as const }
    case 'ENROLLMENT_APPROVED':
      return { text: 'Voir détails', variant: 'primary' as const }
    case 'DONATION_CONFIRMED':
      return { text: 'Voir reçu', variant: 'primary' as const }
    default:
      return { text: 'Voir plus', variant: 'primary' as const }
  }
}

export default function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false)

  const config = notificationConfig[notification.type]
  const Icon = config.icon
  const actionButton = getActionButton(notification.type, notification.link)

  const handleMarkAsRead = async () => {
    if (!onMarkAsRead || notification.read) return
    setIsMarkingAsRead(true)
    try {
      await onMarkAsRead(notification.id)
    } finally {
      setIsMarkingAsRead(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(notification.id)
    } catch (error) {
      setIsDeleting(false)
    }
  }

  const timeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInMinutes = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInDays === 1) return 'Hier'
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        notification.read
          ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : `${config.bgColor} border-current`
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p
              className={`text-sm font-medium ${
                notification.read
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {notification.title}
            </p>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(notification.createdAt)}
            </span>

            <div className="flex items-center gap-2">
              {!notification.read && onMarkAsRead && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={isMarkingAsRead}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Marquer comme lu
                </button>
              )}

              {actionButton && notification.link && (
                <Link
                  href={notification.link}
                  onClick={handleMarkAsRead}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    actionButton.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : actionButton.variant === 'success'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {actionButton.text}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
