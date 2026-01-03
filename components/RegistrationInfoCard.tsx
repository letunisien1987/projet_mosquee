'use client'

import { LucideIcon, Calendar, Clock, MapPin, Users, GraduationCap, CreditCard, Info } from 'lucide-react'
import { ReactNode } from 'react'

// Types pour les infos
export interface InfoItem {
  icon: 'calendar' | 'clock' | 'location' | 'users' | 'instructor' | 'price' | 'info'
  label: string
  value: string | ReactNode
  highlight?: boolean  // Pour mettre en avant (ex: places restantes faibles)
}

const iconComponents: Record<string, LucideIcon> = {
  calendar: Calendar,
  clock: Clock,
  location: MapPin,
  users: Users,
  instructor: GraduationCap,
  price: CreditCard,
  info: Info,
}

interface RegistrationInfoCardProps {
  title?: string
  infos: InfoItem[]
  price?: {
    amount: number
    suffix?: string
    interval?: string  // '/mois', '/semaine'
    isPaid: boolean
  }
  warningMessage?: string
  accentColor?: string  // 'text-red-600'
  children?: ReactNode  // Pour ajouter du contenu personnalisé
}

export function RegistrationInfoCard({
  title = 'Informations',
  infos,
  price,
  warningMessage,
  accentColor = 'text-red-600',
  children
}: RegistrationInfoCardProps) {
  return (
    <div className="md:col-span-1">
      <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
        <h3 className="font-bold text-lg mb-4">{title}</h3>

        <div className="space-y-4">
          {infos.map((info, index) => {
            const Icon = iconComponents[info.icon]
            return (
              <div key={index} className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${accentColor} mt-0.5`} />
                <div>
                  <p className="font-medium text-sm">{info.label}</p>
                  <p className={`text-sm ${info.highlight ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                    {info.value}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Prix */}
          {price && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tarif</span>
                <span className={`text-xl font-bold ${
                  price.isPaid
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {price.isPaid
                    ? `${price.amount} ${price.suffix || 'CHF'}${price.interval || ''}`
                    : 'Gratuit'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Message d'avertissement */}
          {warningMessage && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              {warningMessage}
            </div>
          )}

          {/* Contenu personnalisé */}
          {children}
        </div>
      </div>
    </div>
  )
}
