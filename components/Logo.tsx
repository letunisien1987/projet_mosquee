'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  LOGO_VARIANTS,
  LOGO_LOCATIONS,
  type LogoVariant,
  type LogoLocation,
} from '@/lib/logos'

// Mapping des locations entre le format TypeScript et le format Prisma
const LOCATION_MAP: Record<LogoLocation, string> = {
  'header': 'HEADER',
  'footer': 'FOOTER',
  'dashboard': 'DASHBOARD',
  'dashboard-mobile': 'DASHBOARD_MOBILE',
  'email-header': 'EMAIL_HEADER',
  'email-footer': 'EMAIL_FOOTER',
  'og-image': 'OG_IMAGE',
}

interface DbLogoConfig {
  location: string
  className: string | null
  logo: {
    id: string
    name: string
    type: string
    colorVariant: string
    filePath: string
    mimeType: string
    width: number | null
    height: number | null
  }
}

// Cache global pour les configs de logos
let logoConfigsCache: Record<string, DbLogoConfig> = {}
let cachePromise: Promise<Record<string, DbLogoConfig>> | null = null
let cacheLoaded = false
let cacheTimestamp = 0
const CACHE_TTL = 30000 // 30 secondes

async function fetchLogoConfigs(): Promise<Record<string, DbLogoConfig>> {
  const now = Date.now()

  // Invalider le cache apres 30 secondes pour prendre en compte les changements
  if (cacheLoaded && (now - cacheTimestamp) > CACHE_TTL) {
    cacheLoaded = false
    cachePromise = null
  }

  if (cacheLoaded) return logoConfigsCache

  if (cachePromise) return cachePromise

  cachePromise = fetch('/api/logos')
    .then(res => res.json())
    .then(data => {
      logoConfigsCache = data.configs || {}
      cacheLoaded = true
      cacheTimestamp = Date.now()
      return logoConfigsCache
    })
    .catch(() => {
      logoConfigsCache = {}
      cacheLoaded = true
      cacheTimestamp = Date.now()
      return logoConfigsCache
    })

  return cachePromise
}

// Fonction pour forcer le rechargement du cache
export function invalidateLogoCache() {
  cacheLoaded = false
  cachePromise = null
  cacheTimestamp = 0
}

interface LogoProps {
  /** Emplacement predefini (utilise la config par defaut) */
  location?: LogoLocation
  /** Variante specifique du logo */
  variant?: LogoVariant
  /** Classes CSS personnalisees */
  className?: string
  /** Largeur personnalisee */
  width?: number
  /** Hauteur personnalisee */
  height?: number
  /** Chargement prioritaire (above-the-fold) */
  priority?: boolean
  /** Utiliser la version SVG si disponible */
  useSvg?: boolean
  /** Alt text personnalise */
  alt?: string
  /** Forcer l'utilisation de la config statique (pas de DB) */
  useStaticConfig?: boolean
}

/**
 * Composant Logo centralise
 *
 * @example
 * // Par emplacement (recommande)
 * <Logo location="header" />
 * <Logo location="footer" />
 *
 * @example
 * // Par variante
 * <Logo variant="primary-white" />
 * <Logo variant="icon-color" className="h-6 w-6" />
 *
 * @example
 * // Avec overrides
 * <Logo location="header" className="h-12 w-auto" priority />
 */
export function Logo({
  location,
  variant,
  className,
  width,
  height,
  priority,
  useSvg = false,
  alt,
  useStaticConfig = false,
}: LogoProps) {
  const [dbConfig, setDbConfig] = useState<DbLogoConfig | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Charger la config DB si un emplacement est specifie
  useEffect(() => {
    if (!location || useStaticConfig) {
      setLoaded(true)
      return
    }

    const dbLocation = LOCATION_MAP[location]
    if (!dbLocation) {
      setLoaded(true)
      return
    }

    fetchLogoConfigs().then(configs => {
      if (configs[dbLocation]) {
        setDbConfig(configs[dbLocation])
      }
      setLoaded(true)
    })
  }, [location, useStaticConfig])

  // Si on a une config DB, l'utiliser
  if (dbConfig && loaded) {
    const finalClassName = className ?? dbConfig.className ?? ''
    const finalPriority = priority ?? false
    const finalWidth = width ?? dbConfig.logo.width ?? 200
    const finalHeight = height ?? dbConfig.logo.height ?? 60
    const finalAlt = alt ?? dbConfig.logo.name ?? 'Logo'
    const isSvg = dbConfig.logo.mimeType === 'image/svg+xml'

    return (
      <Image
        src={dbConfig.logo.filePath}
        alt={finalAlt}
        width={finalWidth}
        height={finalHeight}
        className={finalClassName}
        priority={finalPriority}
        unoptimized={isSvg}
      />
    )
  }

  // Fallback sur la config statique
  const locationConfig = location ? LOGO_LOCATIONS[location] : undefined
  const resolvedVariant = variant || locationConfig?.variant || 'primary-color'
  const logoConfig = LOGO_VARIANTS[resolvedVariant]

  // Appliquer les valeurs par defaut ou les overrides
  const finalClassName = className ?? locationConfig?.className ?? ''
  const finalPriority = priority ?? locationConfig?.priority ?? false
  const finalWidth = width ?? logoConfig.width
  const finalHeight = height ?? logoConfig.height
  const finalAlt = alt ?? logoConfig.alt

  // Utiliser SVG si demande et disponible
  const src = useSvg && logoConfig.srcSvg ? logoConfig.srcSvg : logoConfig.src

  return (
    <Image
      src={src}
      alt={finalAlt}
      width={finalWidth}
      height={finalHeight}
      className={finalClassName}
      priority={finalPriority}
    />
  )
}

/**
 * Version du logo pour les emails (retourne une balise img simple)
 * Car Next/Image ne fonctionne pas dans les emails
 */
export function EmailLogo({
  variant = 'email',
  width,
  height,
  alt,
  baseUrl,
}: {
  variant?: LogoVariant
  width?: number
  height?: number
  alt?: string
  baseUrl?: string
}) {
  const logoConfig = LOGO_VARIANTS[variant]
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || ''
  const src = `${base}${logoConfig.src}`

  return `<img src="${src}" alt="${alt || logoConfig.alt}" width="${width || logoConfig.width}" height="${height || logoConfig.height}" style="display: block; max-width: 100%; height: auto;" />`
}
