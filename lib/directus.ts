import { createDirectus, rest, staticToken, readItems, readItem } from '@directus/sdk'

// Configuration Directus
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

// Types pour les collections Directus
export interface DirectusEvent {
  id: string
  title: string
  slug: string
  description?: string
  content?: string
  category: 'religieux' | 'communaute' | 'education' | 'charite'
  date: string
  start_time: string
  end_time: string
  location?: string
  image?: string
  attendees?: string
  registration_required: boolean
  max_capacity?: number
  requires_approval: boolean
  registration_deadline?: string
  featured: boolean
  published: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusActivity {
  id: string
  title: string
  slug: string
  category: 'coran' | 'arabe' | 'ecole' | 'tajweed' | 'hifz' | 'halaqat' | 'autre'
  description?: string
  content?: string
  level?: string
  age_group?: string
  schedule?: string
  instructor?: string | DirectusTeamMember // ID ou objet complet
  max_participants?: number
  requires_approval: boolean
  price?: number
  active: boolean
  enrollment_open: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusArticle {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  category?: 'announcement' | 'news' | 'religious' | 'community'
  image?: string
  author?: string | DirectusTeamMember // ID ou objet complet
  published_at: string
  featured: boolean
  published: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusProject {
  id: string
  title: string
  slug: string
  description?: string
  content?: string
  goal_amount: number
  current_amount: number
  image?: string
  start_date?: string
  end_date?: string
  priority: number
  active: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusTeamMember {
  id: string
  name: string
  role: 'imam' | 'president' | 'vice_president' | 'treasurer' | 'secretary' | 'teacher' | 'board_member'
  bio?: string
  photo?: string
  email?: string
  phone?: string
  order: number
  active: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusMosqueSettings {
  id: string
  name: string
  description?: string
  address_street?: string
  address_city?: string
  address_postal_code?: string
  address_country?: string
  contact_email?: string
  contact_phone?: string
  contact_phone2?: string
  bank_iban?: string
  bank_bic?: string
  bank_account_holder?: string
  twint?: string
  social_facebook?: string
  social_instagram?: string
  social_youtube?: string
  social_twitter?: string
  opening_hours?: string
  capacity?: number
  logo?: string
  date_updated?: string
}

export interface DirectusGallery {
  id: string
  title: string
  description?: string
  images?: any[] // TODO: typer correctement les images
  category?: 'events' | 'mosque' | 'activities' | 'community'
  date?: string
  published: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusJumuaMessage {
  id: string
  title: string
  message: string
  image?: string
  times?: string[]
  is_active: boolean
  order: number
  valid_from?: string
  valid_until?: string
  date_created?: string
  date_updated?: string
}

// Schema complet pour le typage du client
interface DirectusSchema {
  events: DirectusEvent[]
  activities: DirectusActivity[]
  articles: DirectusArticle[]
  projects: DirectusProject[]
  team_members: DirectusTeamMember[]
  mosque_settings: DirectusMosqueSettings[]
  galleries: DirectusGallery[]
  jumua_messages: DirectusJumuaMessage[]
}

// Client Directus avec authentification
export const directusClient = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest())

// Helper functions pour remplacer les fonctions Sanity

/**
 * Récupère tous les événements publiés
 */
export async function getEvents(published = true) {
  try {
    const filter = published ? { published: { _eq: true } } : {}

    const events = await directusClient.request(
      readItems('events', {
        filter,
        sort: ['-date'],
        limit: -1, // Tous les événements
      })
    )

    return events
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return []
  }
}

/**
 * Récupère un événement par son ID
 */
export async function getEventById(id: string) {
  try {
    const event = await directusClient.request(
      readItem('events', id)
    )
    return event
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'événement ${id}:`, error)
    return null
  }
}

/**
 * Récupère toutes les activités actives
 */
export async function getActivities() {
  try {
    const activities = await directusClient.request(
      readItems('activities', {
        filter: { active: { _eq: true } },
        sort: ['category'],
        limit: -1,
        fields: [
          '*',
          { instructor: ['id', 'name', 'role'] } // Charger les données de l'instructeur
        ]
      })
    )

    return activities
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error)
    return []
  }
}

/**
 * Récupère tous les articles publiés
 */
export async function getArticles() {
  try {
    const articles = await directusClient.request(
      readItems('articles', {
        filter: { published: { _eq: true } },
        sort: ['-published_at'],
        limit: -1,
        fields: [
          '*',
          { author: ['id', 'name', 'role'] }
        ]
      })
    )

    return articles
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error)
    return []
  }
}

/**
 * Récupère tous les membres de l'équipe actifs
 */
export async function getTeamMembers() {
  try {
    const members = await directusClient.request(
      readItems('team_members', {
        filter: { active: { _eq: true } },
        sort: ['order'],
        limit: -1,
      })
    )

    return members
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error)
    return []
  }
}

/**
 * Récupère tous les projets actifs
 */
export async function getProjects() {
  try {
    const projects = await directusClient.request(
      readItems('projects', {
        filter: { active: { _eq: true } },
        sort: ['priority'],
        limit: -1,
      })
    )

    return projects
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    return []
  }
}

/**
 * Récupère les paramètres de la mosquée (singleton)
 */
export async function getMosqueSettings() {
  try {
    const settings = await directusClient.request(
      readItems('mosque_settings', {
        limit: 1,
      })
    )

    return settings[0] || null
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return null
  }
}

/**
 * Récupère les galeries publiées
 */
export async function getGalleries() {
  try {
    const galleries = await directusClient.request(
      readItems('galleries', {
        filter: { published: { _eq: true } },
        sort: ['-date'],
        limit: -1,
      })
    )

    return galleries
  } catch (error) {
    console.error('Erreur lors de la récupération des galeries:', error)
    return []
  }
}

/**
 * Récupère les messages Joumou'a actifs et valides
 */
export async function getJumuaMessages() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const messages = await directusClient.request(
      readItems('jumua_messages', {
        filter: {
          is_active: { _eq: true }
        },
        sort: ['order'],
        limit: -1,
      })
    )

    return messages
  } catch (error) {
    console.error('Erreur lors de la récupération des messages Joumou\'a:', error)
    return []
  }
}

/**
 * Helper pour construire les URLs d'images Directus
 */
export function getDirectusImageUrl(imageId?: string): string | null {
  if (!imageId) return null
  return `${DIRECTUS_URL}/assets/${imageId}`
}

/**
 * Helper pour construire les URLs d'images avec transformations
 */
export function getDirectusImageUrlWithTransform(
  imageId?: string,
  options: {
    width?: number
    height?: number
    fit?: 'cover' | 'contain' | 'inside' | 'outside'
    quality?: number
  } = {}
): string | null {
  if (!imageId) return null

  const params = new URLSearchParams()
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.fit) params.set('fit', options.fit)
  if (options.quality) params.set('quality', options.quality.toString())

  const queryString = params.toString()
  return `${DIRECTUS_URL}/assets/${imageId}${queryString ? `?${queryString}` : ''}`
}
