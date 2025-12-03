'use client'

import Link from 'next/link'
import { LucideIcon, Clock, Users, MapPin, Calendar, Tag, ArrowRight, CheckCircle, GraduationCap } from 'lucide-react'

// Configuration de couleurs pour les catégories
export interface CategoryColorConfig {
  color: string        // bg-red-500
  textColor: string    // text-red-600
  borderColor: string  // #ef4444
  label: string        // "Religieux"
}

// Types pour les informations affichées
export interface ItemInfo {
  icon: 'calendar' | 'clock' | 'location' | 'users' | 'instructor'
  label: string
  value: string
}

// Props du composant
export interface ItemCardProps {
  id: string
  title: string
  href: string
  description?: string
  categoryConfig: CategoryColorConfig
  icon?: LucideIcon
  infos: ItemInfo[]
  price?: {
    amount: number
    label?: string       // "Dès" ou vide
    suffix?: string      // "CHF"
  }
  badge?: {
    text: string
    variant: 'warning' | 'error' | 'success' | 'info'
  }
  status?: {
    type: 'available' | 'full' | 'past' | 'closed' | 'loading'
    availableSpots?: number
    requiresApproval?: boolean
  }
  buttonLabel?: string
  showCategoryBadge?: boolean
}

const iconComponents = {
  calendar: Calendar,
  clock: Clock,
  location: MapPin,
  users: Users,
  instructor: GraduationCap,
}

export function ItemCard({
  id,
  title,
  href,
  description,
  categoryConfig,
  icon: CustomIcon,
  infos,
  price,
  badge,
  status,
  buttonLabel = "S'inscrire",
  showCategoryBadge = true,
}: ItemCardProps) {

  const renderStatus = () => {
    if (!status) return null

    switch (status.type) {
      case 'loading':
        return (
          <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-center">
            Chargement...
          </div>
        )
      case 'full':
        return (
          <div className="space-y-2">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium text-center">
              Complet
            </div>
            <Link
              href={href}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Voir les détails
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      case 'past':
        return (
          <div className="space-y-2">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-center">
              Terminé
            </div>
            <Link
              href={href}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Voir les détails
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      case 'closed':
        return (
          <div className="bg-gray-200 text-gray-500 px-4 py-2.5 rounded-lg font-semibold text-center cursor-not-allowed">
            Inscriptions fermées
          </div>
        )
      case 'available':
      default:
        return (
          <div className="space-y-2">
            {status.availableSpots !== undefined && status.availableSpots !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Places restantes:
                </span>
                <span className={`font-semibold ${
                  status.availableSpots <= 5
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {status.availableSpots}
                </span>
              </div>
            )}
            {status.requiresApproval && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                Inscription soumise à approbation
              </p>
            )}
            <Link
              href={href}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
            >
              <CheckCircle className="h-4 w-4" />
              {buttonLabel}
            </Link>
          </div>
        )
    }
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-t-4 flex flex-col"
      style={{ borderTopColor: categoryConfig.borderColor }}
    >
      <div className="p-6 flex flex-col flex-1">
        {/* Header avec titre et badge catégorie */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {CustomIcon && (
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <CustomIcon className={`h-6 w-6 ${categoryConfig.textColor}`} />
              </div>
            )}
            <Link
              href={href}
              className={`text-xl font-bold pr-2 hover:${categoryConfig.textColor} transition-colors`}
            >
              {title}
            </Link>
          </div>
          {showCategoryBadge && (
            <span className={`${categoryConfig.color} text-white text-xs px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0`}>
              {categoryConfig.label}
            </span>
          )}
        </div>

        {/* Informations */}
        <div className="space-y-2 mb-4">
          {infos.map((info, index) => {
            const IconComponent = iconComponents[info.icon]
            return (
              <div key={index} className="flex items-start gap-2 text-sm">
                <IconComponent className={`h-4 w-4 ${categoryConfig.textColor} flex-shrink-0 mt-0.5`} />
                <div>
                  {info.label && <span className="font-medium">{info.label}: </span>}
                  <span className="text-gray-700 dark:text-gray-300">{info.value}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
            {description}
          </p>
        )}

        {/* Prix */}
        {price !== undefined && (
          <div className="flex items-center gap-2 text-sm mb-4">
            <Tag className={`h-4 w-4 ${categoryConfig.textColor}`} />
            <span className={`font-medium ${
              price.amount > 0
                ? `${categoryConfig.textColor}`
                : 'text-green-600 dark:text-green-400'
            }`}>
              {price.amount > 0
                ? `${price.label ? price.label + ' ' : ''}${price.amount} ${price.suffix || 'CHF'}`
                : 'Gratuit'}
            </span>
          </div>
        )}

        {/* Badge personnalisé */}
        {badge && (
          <div className={`text-xs px-2 py-1 rounded mb-4 inline-block ${
            badge.variant === 'warning' ? 'bg-amber-100 text-amber-700' :
            badge.variant === 'error' ? 'bg-red-100 text-red-700' :
            badge.variant === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {badge.text}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          {status ? renderStatus() : (
            <Link
              href={href}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Voir les détails
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// Configurations de couleurs prédéfinies pour les événements
export const eventCategoryColors: Record<string, CategoryColorConfig> = {
  religieux: {
    label: 'Religieux',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    borderColor: '#ef4444',
  },
  communaute: {
    label: 'Communauté',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: '#22c55e',
  },
  education: {
    label: 'Éducation',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: '#3b82f6',
  },
  charite: {
    label: 'Charité',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    borderColor: '#eab308',
  },
}

// Configurations de couleurs prédéfinies pour les activités
export const activityCategoryColors: Record<string, CategoryColorConfig> = {
  coran: {
    label: 'Cours de Coran',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    borderColor: '#10b981',
  },
  arabe: {
    label: "Cours d'Arabe",
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: '#3b82f6',
  },
  ecole: {
    label: 'École du Dimanche',
    color: 'bg-amber-500',
    textColor: 'text-amber-600',
    borderColor: '#f59e0b',
  },
  tajweed: {
    label: 'Tajweed',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: '#a855f7',
  },
  hifz: {
    label: 'Hifz',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: '#a855f7',
  },
  halaqat: {
    label: 'Halaqat',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: '#a855f7',
  },
  autre: {
    label: 'Autres',
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: '#a855f7',
  },
}
