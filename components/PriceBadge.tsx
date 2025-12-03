'use client'

import { CreditCard, RefreshCw, Gift, Users } from 'lucide-react'
import { PricingConfig, isPaidItem, getPricingSummary } from '@/lib/pricing'

interface PriceBadgeProps {
  price?: number | string | null
  paymentType?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | null
  subscriptionInterval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null
  pricing?: PricingConfig | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const intervalLabels: Record<string, string> = {
  WEEKLY: '/semaine',
  MONTHLY: '/mois',
  YEARLY: '/an',
}

export function PriceBadge({
  price,
  paymentType,
  subscriptionInterval,
  pricing,
  size = 'md',
  showLabel = true,
  className = '',
}: PriceBadgeProps) {
  const isPaid = isPaidItem(paymentType, price, pricing)
  const isSubscription = paymentType === 'SUBSCRIPTION'
  const priceSummary = getPricingSummary(pricing, price, paymentType, subscriptionInterval)

  // Tailles
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'h-3 w-3',
      price: 'text-sm font-bold',
      label: 'text-xs',
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'h-4 w-4',
      price: 'text-base font-bold',
      label: 'text-xs',
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'h-5 w-5',
      price: 'text-lg font-bold',
      label: 'text-sm',
    },
  }

  const sizes = sizeClasses[size]

  if (isPaid) {
    // Déterminer l'icône selon le type de tarification
    const hasFamilyPricing = pricing && (pricing.child_price !== undefined || pricing.family_max_price)

    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 ${sizes.container} ${className}`}
      >
        {isSubscription ? (
          <RefreshCw className={`${sizes.icon} text-red-600 dark:text-red-400`} />
        ) : hasFamilyPricing ? (
          <Users className={`${sizes.icon} text-red-600 dark:text-red-400`} />
        ) : (
          <CreditCard className={`${sizes.icon} text-red-600 dark:text-red-400`} />
        )}
        <span className={`${sizes.price} text-red-700 dark:text-red-300`}>
          {priceSummary}
        </span>
        {showLabel && !pricing && (
          <span className={`${sizes.label} text-red-600 dark:text-red-400 hidden sm:inline`}>
            {isSubscription ? 'Abonnement' : 'Payant'}
          </span>
        )}
      </div>
    )
  }

  // Gratuit
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 ${sizes.container} ${className}`}
    >
      <Gift className={`${sizes.icon} text-green-600 dark:text-green-400`} />
      <span className={`${sizes.price} text-green-700 dark:text-green-300`}>Gratuit</span>
    </div>
  )
}

// Version compacte pour les listes
export function PriceBadgeCompact({
  price,
  paymentType,
  subscriptionInterval,
  pricing,
}: Omit<PriceBadgeProps, 'size' | 'showLabel' | 'className'>) {
  return (
    <PriceBadge
      price={price}
      paymentType={paymentType}
      subscriptionInterval={subscriptionInterval}
      pricing={pricing}
      size="sm"
      showLabel={false}
    />
  )
}
