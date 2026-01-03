'use client'

import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ReactNode } from 'react'

export interface GradientConfig {
  gradient: string    // 'from-red-600 to-red-700'
  color: string       // 'bg-red-500'
  textColor: string   // 'text-red-600'
  label?: string      // 'Religieux'
}

interface RegistrationLayoutProps {
  title: string
  description?: string
  content?: string  // Contenu détaillé (HTML ou texte)
  backHref: string
  backLabel: string
  gradientConfig: GradientConfig
  showCategoryBadge?: boolean
  children: ReactNode
}

export function RegistrationLayout({
  title,
  description,
  content,
  backHref,
  backLabel,
  gradientConfig,
  showCategoryBadge = false,
  children
}: RegistrationLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${gradientConfig.gradient} text-white py-12`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex items-start justify-between">
            <div>
              {showCategoryBadge && gradientConfig.label && (
                <span className={`${gradientConfig.color} text-white text-xs px-3 py-1 rounded-full mb-3 inline-block`}>
                  {gradientConfig.label}
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
              {description && <p className="text-white/90">{description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu détaillé (si présent) */}
      {content && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4">Détails</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {children}
        </div>
      </div>
    </div>
  )
}

// Loading state
export function RegistrationLoading({ accentColor = 'text-red-600' }: { accentColor?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className={`h-8 w-8 animate-spin ${accentColor}`} />
    </div>
  )
}

// Not found state
interface RegistrationNotFoundProps {
  message: string
  backHref: string
  backLabel: string
  accentColor?: string
}

export function RegistrationNotFound({
  message,
  backHref,
  backLabel,
  accentColor = 'text-red-600'
}: RegistrationNotFoundProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{message}</h2>
        <Link href={backHref} className={`${accentColor} hover:underline`}>
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
