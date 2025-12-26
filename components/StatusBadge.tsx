'use client'

import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'approved'
  | 'rejected'
  | 'waiting'

export type BadgeSize = 'sm' | 'md' | 'lg'

interface StatusBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  size?: BadgeSize
  className?: string
  icon?: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  waiting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function StatusBadge({
  variant,
  children,
  size = 'md',
  className,
  icon
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}

// Helper function to map common status strings to variants
export function getStatusVariant(status: string): BadgeVariant {
  const statusLower = status.toLowerCase()

  const statusMap: Record<string, BadgeVariant> = {
    // English statuses
    'confirmed': 'confirmed',
    'approved': 'approved',
    'success': 'success',
    'active': 'success',
    'completed': 'success',
    'paid': 'success',
    'pending': 'pending',
    'pending_payment': 'warning',
    'pending_approval': 'warning',
    'waiting': 'waiting',
    'waiting_list': 'waiting',
    'cancelled': 'cancelled',
    'rejected': 'rejected',
    'error': 'error',
    'failed': 'error',
    'expired': 'error',
    'inactive': 'neutral',
    'draft': 'neutral',
    // French statuses
    'confirmé': 'confirmed',
    'approuvé': 'approved',
    'en attente': 'pending',
    'annulé': 'cancelled',
    'rejeté': 'rejected',
    'actif': 'success',
    'inactif': 'neutral',
    'payé': 'success',
    'liste d\'attente': 'waiting',
  }

  return statusMap[statusLower] || 'neutral'
}

// Helper to get French label for status
export function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    'CONFIRMED': 'Confirmé',
    'APPROVED': 'Approuvé',
    'PENDING': 'En attente',
    'PENDING_PAYMENT': 'Paiement en attente',
    'PENDING_APPROVAL': 'Approbation en attente',
    'WAITING_LIST': 'Liste d\'attente',
    'CANCELLED': 'Annulé',
    'REJECTED': 'Rejeté',
    'ACTIVE': 'Actif',
    'INACTIVE': 'Inactif',
    'PAID': 'Payé',
    'EXPIRED': 'Expiré',
    'COMPLETED': 'Terminé',
  }

  return labelMap[status] || status
}

export default StatusBadge
