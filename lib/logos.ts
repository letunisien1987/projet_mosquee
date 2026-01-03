/**
 * Configuration centralisee des logos
 * Utilisation: import { LOGO_VARIANTS, LOGO_LOCATIONS } from '@/lib/logos'
 */

// Types pour les variantes de logo
export type LogoVariant =
  | 'primary-color'
  | 'primary-white'
  | 'primary-dark'
  | 'horizontal-color'
  | 'horizontal-white'
  | 'horizontal-dark'
  | 'icon-color'
  | 'icon-white'
  | 'icon-dark'
  | 'email'

// Types pour les emplacements
export type LogoLocation =
  | 'header'
  | 'footer'
  | 'dashboard'
  | 'dashboard-mobile'
  | 'email-header'
  | 'email-footer'
  | 'og-image'

// Configuration d'un logo
export interface LogoConfig {
  src: string
  srcSvg?: string
  width: number
  height: number
  alt: string
}

// Configuration d'un emplacement
export interface LocationConfig {
  variant: LogoVariant
  className?: string
  priority?: boolean
}

// Toutes les variantes disponibles
export const LOGO_VARIANTS: Record<LogoVariant, LogoConfig> = {
  'primary-color': {
    src: '/logos/primary/logo-full-color.png',
    srcSvg: '/logos/primary/logo-full-color.svg',
    width: 200,
    height: 60,
    alt: 'Mosquee Madretsch',
  },
  'primary-white': {
    src: '/logos/primary/logo-white.png',
    srcSvg: '/logos/primary/logo-white.svg',
    width: 200,
    height: 60,
    alt: 'Mosquee Madretsch',
  },
  'primary-dark': {
    src: '/logos/primary/logo-dark.png',
    srcSvg: '/logos/primary/logo-dark.svg',
    width: 200,
    height: 60,
    alt: 'Mosquee Madretsch',
  },
  'horizontal-color': {
    src: '/logos/horizontal/logo-horizontal-color.png',
    width: 240,
    height: 48,
    alt: 'Mosquee Madretsch',
  },
  'horizontal-white': {
    src: '/logos/horizontal/logo-horizontal-white.png',
    width: 240,
    height: 48,
    alt: 'Mosquee Madretsch',
  },
  'horizontal-dark': {
    src: '/logos/horizontal/logo-horizontal-dark.png',
    width: 240,
    height: 48,
    alt: 'Mosquee Madretsch',
  },
  'icon-color': {
    src: '/logos/icon/icon-color.png',
    srcSvg: '/logos/icon/icon-color.svg',
    width: 64,
    height: 64,
    alt: 'Mosquee Madretsch',
  },
  'icon-white': {
    src: '/logos/icon/icon-white.png',
    srcSvg: '/logos/icon/icon-white.svg',
    width: 64,
    height: 64,
    alt: 'Mosquee Madretsch',
  },
  'icon-dark': {
    src: '/logos/icon/icon-dark.png',
    srcSvg: '/logos/icon/icon-dark.svg',
    width: 64,
    height: 64,
    alt: 'Mosquee Madretsch',
  },
  'email': {
    src: '/logos/email/logo-email.png',
    width: 200,
    height: 60,
    alt: 'Mosquee Madretsch',
  },
}

// Mapping emplacement -> variante par defaut
export const LOGO_LOCATIONS: Record<LogoLocation, LocationConfig> = {
  header: {
    variant: 'primary-color',
    className: 'h-10 w-auto',
    priority: true,
  },
  footer: {
    variant: 'primary-color',
    className: 'h-8 w-auto brightness-0 invert',
    priority: false,
  },
  dashboard: {
    variant: 'primary-color',
    className: 'h-8 w-auto',
    priority: true,
  },
  'dashboard-mobile': {
    variant: 'primary-color',
    className: 'h-8 w-auto',
    priority: true,
  },
  'email-header': {
    variant: 'email',
    className: '',
    priority: false,
  },
  'email-footer': {
    variant: 'email',
    className: '',
    priority: false,
  },
  'og-image': {
    variant: 'primary-color',
    className: '',
    priority: false,
  },
}

// Configuration des favicons
export const FAVICON_CONFIG = {
  ico: '/logos/favicon/favicon.ico',
  png16: '/logos/favicon/favicon-16x16.png',
  png32: '/logos/favicon/favicon-32x32.png',
  appleTouchIcon: '/logos/favicon/apple-touch-icon.png',
  androidChrome192: '/logos/favicon/android-chrome-192x192.png',
  androidChrome512: '/logos/favicon/android-chrome-512x512.png',
  webmanifest: '/logos/favicon/site.webmanifest',
}

// Helper pour obtenir l'URL absolue du logo (pour emails)
export function getLogoUrl(variant: LogoVariant, baseUrl?: string): string {
  const config = LOGO_VARIANTS[variant]
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://mosquee-madretsch.ch'
  return `${base}${config.src}`
}

// Helper pour obtenir la config d'un emplacement
export function getLocationConfig(location: LogoLocation): LocationConfig & LogoConfig {
  const locationConfig = LOGO_LOCATIONS[location]
  const logoConfig = LOGO_VARIANTS[locationConfig.variant]
  return { ...locationConfig, ...logoConfig }
}
