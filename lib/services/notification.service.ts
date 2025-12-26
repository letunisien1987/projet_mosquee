/**
 * Service centralisé pour la gestion des notifications
 *
 * Utilise Prisma uniquement (pas de Directus).
 * Fournit des méthodes pour créer, lire et gérer les notifications utilisateur.
 */

import { prisma } from '@/lib/prisma'
import { NotificationType, Notification } from '@prisma/client'

// =============================================================================
// TYPES
// =============================================================================

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  sendEmail?: boolean
}

export interface NotificationWithCount {
  notifications: Notification[]
  unreadCount: number
  totalCount: number
}

export interface NotificationFilters {
  unreadOnly?: boolean
  type?: NotificationType
  limit?: number
  offset?: number
}

// =============================================================================
// CRÉATION DE NOTIFICATIONS
// =============================================================================

/**
 * Créer une notification pour un utilisateur
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      emailSent: input.sendEmail || false,
    },
  })

  return notification
}

/**
 * Créer plusieurs notifications en lot (bulk)
 */
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<number> {
  const result = await prisma.notification.createMany({
    data: inputs.map(input => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      emailSent: input.sendEmail || false,
    })),
  })

  return result.count
}

// =============================================================================
// LECTURE DES NOTIFICATIONS
// =============================================================================

/**
 * Récupérer les notifications d'un utilisateur avec filtres
 */
export async function getUserNotifications(
  userId: string,
  filters: NotificationFilters = {}
): Promise<NotificationWithCount> {
  const { unreadOnly = false, type, limit = 20, offset = 0 } = filters

  const where = {
    userId,
    ...(unreadOnly ? { read: false } : {}),
    ...(type ? { type } : {}),
  }

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
    prisma.notification.count({ where: { userId } }),
  ])

  return { notifications, unreadCount, totalCount }
}

/**
 * Récupérer une notification par ID
 */
export async function getNotificationById(
  id: string
): Promise<Notification | null> {
  return prisma.notification.findUnique({
    where: { id },
  })
}

/**
 * Vérifier si une notification appartient à un utilisateur
 */
export async function isNotificationOwner(
  notificationId: string,
  userId: string
): Promise<boolean> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  })

  return notification?.userId === userId
}

// =============================================================================
// MISE À JOUR DES NOTIFICATIONS
// =============================================================================

/**
 * Marquer une notification comme lue
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * Marquer toutes les notifications d'un utilisateur comme lues
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: { read: true },
  })

  return result.count
}

/**
 * Marquer une notification comme ayant reçu un email
 */
export async function markEmailSent(notificationId: string): Promise<Notification> {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { emailSent: true },
  })
}

// =============================================================================
// SUPPRESSION DES NOTIFICATIONS
// =============================================================================

/**
 * Supprimer une notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await prisma.notification.delete({
    where: { id: notificationId },
  })
}

/**
 * Supprimer toutes les notifications lues d'un utilisateur
 */
export async function deleteReadNotifications(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      read: true,
    },
  })

  return result.count
}

/**
 * Supprimer les notifications plus anciennes qu'une date
 */
export async function deleteOldNotifications(
  olderThan: Date
): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: olderThan },
      read: true, // Seulement les notifications déjà lues
    },
  })

  return result.count
}

// =============================================================================
// HELPERS POUR CRÉER DES NOTIFICATIONS TYPÉES
// =============================================================================

/**
 * Notifier un utilisateur d'une confirmation d'événement
 */
export async function notifyEventConfirmation(
  userId: string,
  eventTitle: string,
  eventId: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'EVENT_CONFIRMATION',
    title: 'Inscription confirmée',
    message: `Votre inscription à "${eventTitle}" a été confirmée.`,
    link: `/dashboard/evenements`,
  })
}

/**
 * Notifier un responsable d'une nouvelle inscription
 */
export async function notifyNewRegistration(
  managerId: string,
  participantName: string,
  eventTitle: string,
  eventId: string
): Promise<Notification> {
  return createNotification({
    userId: managerId,
    type: 'EVENT_REGISTRATION_NEW',
    title: 'Nouvelle inscription',
    message: `${participantName} s'est inscrit(e) à "${eventTitle}".`,
    link: `/dashboard/admin/inscriptions-evenements`,
  })
}

/**
 * Notifier un utilisateur qu'un paiement est en attente
 */
export async function notifyPaymentPending(
  userId: string,
  itemTitle: string,
  amount: number,
  paymentLink: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'PAYMENT_PENDING',
    title: 'Paiement en attente',
    message: `Paiement de ${amount} CHF en attente pour "${itemTitle}".`,
    link: paymentLink,
  })
}

/**
 * Notifier un utilisateur que son paiement a été confirmé
 */
export async function notifyPaymentConfirmed(
  userId: string,
  itemTitle: string,
  amount: number
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'PAYMENT_CONFIRMED',
    title: 'Paiement confirmé',
    message: `Paiement de ${amount} CHF confirmé pour "${itemTitle}".`,
    link: '/dashboard/dons',
  })
}

/**
 * Notifier un utilisateur d'une confirmation d'inscription à une activité
 */
export async function notifyEnrollmentConfirmation(
  userId: string,
  activityTitle: string,
  activityId: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'ENROLLMENT_CONFIRMATION',
    title: 'Inscription confirmée',
    message: `Votre inscription à l'activité "${activityTitle}" a été confirmée.`,
    link: `/dashboard/inscriptions`,
  })
}

/**
 * Notifier un utilisateur que son inscription a été approuvée
 */
export async function notifyEnrollmentApproved(
  userId: string,
  activityTitle: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'ENROLLMENT_APPROVED',
    title: 'Inscription approuvée',
    message: `Votre inscription à "${activityTitle}" a été approuvée par le responsable.`,
    link: '/dashboard/inscriptions',
  })
}

/**
 * Notifier un utilisateur que son inscription a été rejetée
 */
export async function notifyEnrollmentRejected(
  userId: string,
  activityTitle: string,
  reason?: string
): Promise<Notification> {
  const message = reason
    ? `Votre inscription à "${activityTitle}" a été refusée. Raison: ${reason}`
    : `Votre inscription à "${activityTitle}" a été refusée.`

  return createNotification({
    userId,
    type: 'ENROLLMENT_REJECTED',
    title: 'Inscription refusée',
    message,
    link: '/dashboard/inscriptions',
  })
}

/**
 * Notifier un utilisateur qu'une place s'est libérée sur la liste d'attente
 */
export async function notifyWaitlistSpotAvailable(
  userId: string,
  eventTitle: string,
  eventId: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'EVENT_WAITLIST_SPOT_AVAILABLE',
    title: 'Place disponible!',
    message: `Une place s'est libérée pour "${eventTitle}". Confirmez rapidement votre participation!`,
    link: `/evenements/${eventId}`,
  })
}

/**
 * Notifier un utilisateur que sa cotisation expire bientôt
 */
export async function notifyMembershipExpiringSoon(
  userId: string,
  expirationDate: Date
): Promise<Notification> {
  const formattedDate = expirationDate.toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return createNotification({
    userId,
    type: 'MEMBERSHIP_EXPIRING_SOON',
    title: 'Cotisation bientôt expirée',
    message: `Votre cotisation expire le ${formattedDate}. Renouvelez-la pour continuer à bénéficier des avantages membre.`,
    link: '/dashboard/cotisation',
  })
}

/**
 * Notifier un utilisateur de la confirmation de son don
 */
export async function notifyDonationConfirmed(
  userId: string,
  amount: number,
  projectName?: string
): Promise<Notification> {
  const message = projectName
    ? `Merci pour votre don de ${amount} CHF au projet "${projectName}".`
    : `Merci pour votre don de ${amount} CHF.`

  return createNotification({
    userId,
    type: 'DONATION_CONFIRMED',
    title: 'Don confirmé',
    message,
    link: '/dashboard/dons',
  })
}

// =============================================================================
// STATISTIQUES
// =============================================================================

/**
 * Obtenir les statistiques de notifications d'un utilisateur
 */
export async function getNotificationStats(userId: string) {
  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  return {
    total,
    unread,
    read: total - unread,
  }
}
