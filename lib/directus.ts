import { createDirectus, rest, staticToken, readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk'

// Configuration Directus
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055'
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || ''

// Types pour les collections Directus

// Type de base pour les éléments unifiés (événements et activités)
export type ItemType = 'EVENT' | 'ACTIVITY'
export type EventCategory = 'religieux' | 'communaute' | 'education' | 'charite'
export type ActivityCategory = 'coran' | 'arabe' | 'ecole' | 'tajweed' | 'hifz' | 'halaqat' | 'autre'

// Interface unifiée pour événements ET activités
export interface DirectusOffering {
  id: string
  item_type: ItemType // Discriminateur principal
  title: string
  slug: string
  description?: string
  content?: string

  // Catégories (selon item_type)
  category: EventCategory // Catégorie générale
  activity_category?: ActivityCategory // Catégorie spécifique activité

  // Champs pour ÉVÉNEMENTS
  date?: string
  start_time?: string
  end_time?: string
  location?: string
  image?: string
  attendees?: string
  registration_deadline?: string
  featured: boolean

  // Champs pour ACTIVITÉS
  level?: string
  age_group?: string
  schedule?: string // Horaire récurrent (ex: "Samedi 10h-12h")
  instructor?: string | DirectusTeamMember
  enrollment_open?: boolean // Inscriptions ouvertes

  // Champs communs
  registration_required: boolean
  max_capacity?: number // Capacité max (ex-max_participants pour activités)
  requires_approval: boolean
  published: boolean // Pour événements = published, pour activités = active
  manager_id?: string
  manager_email?: string

  // Paiement (commun)
  price?: number
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscription_interval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  stripe_price_id?: string

  // Restrictions (commun)
  restrictions?: {
    enabled: boolean
    participation_type?: 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
    allowed_gender?: 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'
    min_age?: number | null
    max_age?: number | null
  }

  // Remboursement
  allow_refund?: boolean
  cancellation_deadline_days?: number

  // Tarification avancée
  pricing?: {
    adult_price: number
    child_price: number
    child_free_until_age: number
    group_discount: {
      enabled: boolean
      from_persons: number
      discount_percent: number
    }
    family_max_price: number | null
    early_bird: {
      enabled: boolean
      until_date: string | null
      discount_percent: number
    }
  }

  date_created?: string
  date_updated?: string
}

// Alias pour compatibilité avec le code existant
// Note: DirectusEvent représente tous les items de la collection "events" (événements ET activités)
export interface DirectusEvent extends DirectusOffering {
  item_type: ItemType // Peut être 'EVENT' ou 'ACTIVITY'
}

export interface DirectusActivity {
  id: string
  title: string
  slug: string
  category: ActivityCategory
  description?: string
  content?: string
  level?: string
  age_group?: string
  schedule?: string
  instructor?: string | DirectusTeamMember
  max_participants?: number
  requires_approval: boolean
  price?: number
  active: boolean
  enrollment_open: boolean
  manager_id?: string
  manager_email?: string
  restrictions?: {
    enabled: boolean
    participation_type?: 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
    allowed_gender?: 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'
    min_age?: number | null
    max_age?: number | null
  }
  date_created?: string
  date_updated?: string
}

// Helper pour convertir une DirectusOffering en DirectusActivity (compatibilité)
export function offeringToActivity(offering: DirectusOffering): DirectusActivity | null {
  if (offering.item_type !== 'ACTIVITY') return null
  return {
    id: offering.id,
    title: offering.title,
    slug: offering.slug,
    category: offering.activity_category || 'autre',
    description: offering.description,
    content: offering.content,
    level: offering.level,
    age_group: offering.age_group,
    schedule: offering.schedule,
    instructor: offering.instructor,
    max_participants: offering.max_capacity,
    requires_approval: offering.requires_approval,
    price: offering.price,
    active: offering.published,
    enrollment_open: offering.enrollment_open ?? true,
    manager_id: offering.manager_id,
    manager_email: offering.manager_email,
    restrictions: offering.restrictions,
    date_created: offering.date_created,
    date_updated: offering.date_updated,
  }
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
  raisenow_code?: string // Code RaiseNow unique (ex: zsmgy)
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

export interface DirectusUserProfile {
  id: string
  user_id: string // UUID de l'utilisateur dans Prisma
  city?: string
  postal_code?: string
  country?: string
  date_of_birth?: string
  profile_picture?: string // UUID de l'image Directus
  bio?: string
  preferred_language: 'fr' | 'ar'
  notification_email: boolean
  notification_sms: boolean
  newsletter: boolean
  date_created?: string
  date_updated?: string
}

export interface DirectusNotification {
  id: string
  user_id: string // UUID de l'utilisateur
  type: 'EVENT' | 'COURSE' | 'DONATION' | 'SYSTEM' | 'REMINDER'
  title: string
  message: string
  link?: string
  read: boolean
  date_created?: string
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
  user_profiles: DirectusUserProfile[]
  notifications: DirectusNotification[]
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
 * Récupère un événement par son slug
 */
export async function getEventBySlug(slug: string) {
  try {
    const events = await directusClient.request(
      readItems('events', {
        filter: { slug: { _eq: slug } },
        limit: 1,
        fields: ['*']
      })
    )
    return events.length > 0 ? events[0] : null
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'événement par slug ${slug}:`, error)
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
        fields: ['*'] // Charger tous les champs (instructor est un champ texte simple)
      })
    )

    return activities
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error)
    return []
  }
}

/**
 * Récupère une activité par son ID
 */
export async function getActivityById(id: string): Promise<DirectusActivity | null> {
  try {
    const activity = await directusClient.request(
      readItem('activities', id, {
        fields: ['*']
      })
    )

    return activity as DirectusActivity
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error)
    return null
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
          is_active: { _eq: true },
          _and: [
            {
              _or: [
                { valid_from: { _null: true } },
                { valid_from: { _lte: today } }
              ]
            },
            {
              _or: [
                { valid_until: { _null: true } },
                { valid_until: { _gte: today } }
              ]
            }
          ]
        },
        sort: ['order'],
        limit: -1,
      })
    )

    // Sanitiser les messages pour éviter les objets vides
    return (messages as any[]).map(msg => {
      let cleanTimes: string[] | null = null
      if (msg.times) {
        if (Array.isArray(msg.times)) {
          const filtered = msg.times.filter((t: any) => typeof t === 'string' && t.trim() !== '')
          cleanTimes = filtered.length === 0 ? null : filtered
        }
      }
      return {
        ...msg,
        times: cleanTimes,
        image: msg.image && typeof msg.image === 'string' ? msg.image : null,
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des messages Joumou\'a:', error)
    return []
  }
}

/**
 * Helper pour construire les URLs d'images via le proxy API
 * Utilise /api/assets pour éviter les problèmes d'authentification côté client
 */
export function getDirectusImageUrl(imageId?: string): string | null {
  if (!imageId) return null
  return `/api/assets/${imageId}`
}

/**
 * Helper pour construire les URLs d'images avec transformations via le proxy API
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
  return `/api/assets/${imageId}${queryString ? `?${queryString}` : ''}`
}

// ==================== USER PROFILES ====================

/**
 * Récupère le profil d'un utilisateur par son user_id
 */
export async function getUserProfile(userId: string): Promise<DirectusUserProfile | null> {
  try {
    const profiles = await directusClient.request(
      readItems('user_profiles', {
        filter: { user_id: { _eq: userId } },
        limit: 1,
      })
    )

    return profiles[0] || null
  } catch (error) {
    console.error(`Erreur lors de la récupération du profil de l'utilisateur ${userId}:`, error)
    return null
  }
}

/**
 * Crée un profil utilisateur
 */
export async function createUserProfile(data: Omit<DirectusUserProfile, 'id' | 'date_created' | 'date_updated'>): Promise<DirectusUserProfile | null> {
  try {
    const profile = await directusClient.request(
      createItem('user_profiles', data)
    )

    return profile as DirectusUserProfile
  } catch (error) {
    console.error('Erreur lors de la création du profil utilisateur:', error)
    return null
  }
}

/**
 * Met à jour un profil utilisateur
 */
export async function updateUserProfile(profileId: string, data: Partial<DirectusUserProfile>): Promise<DirectusUserProfile | null> {
  try {
    const profile = await directusClient.request(
      updateItem('user_profiles', profileId, data)
    )

    return profile as DirectusUserProfile
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du profil ${profileId}:`, error)
    return null
  }
}

// ==================== NOTIFICATIONS ====================

/**
 * Récupère les notifications d'un utilisateur
 */
export async function getUserNotifications(userId: string, unreadOnly = false): Promise<DirectusNotification[]> {
  try {
    const filter: any = { user_id: { _eq: userId } }
    if (unreadOnly) {
      filter.read = { _eq: false }
    }

    const notifications = await directusClient.request(
      readItems('notifications', {
        filter,
        sort: ['-id'], // Trier par ID (plus récent en premier)
        limit: -1,
      })
    )

    return notifications
  } catch (error) {
    // Retourner un tableau vide si Directus n'est pas configuré ou a un problème de permissions
    console.warn(`Impossible de récupérer les notifications pour l'utilisateur ${userId}. Directus peut ne pas être configuré correctement.`)
    return []
  }
}

/**
 * Crée une notification
 */
export async function createNotification(data: Omit<DirectusNotification, 'id' | 'date_created'>): Promise<DirectusNotification | null> {
  try {
    const notification = await directusClient.request(
      createItem('notifications', { ...data, read: false })
    )

    return notification as DirectusNotification
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error)
    return null
  }
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    await directusClient.request(
      updateItem('notifications', notificationId, { read: true })
    )

    return true
  } catch (error) {
    console.error(`Erreur lors du marquage de la notification ${notificationId} comme lue:`, error)
    return false
  }
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const notifications = await getUserNotifications(userId, true)

    await Promise.all(
      notifications.map(notif => markNotificationAsRead(notif.id))
    )

    return true
  } catch (error) {
    console.error(`Erreur lors du marquage de toutes les notifications de l'utilisateur ${userId}:`, error)
    return false
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await directusClient.request(
      deleteItem('notifications', notificationId)
    )

    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression de la notification ${notificationId}:`, error)
    return false
  }
}

/**
 * Compte les notifications non lues d'un utilisateur
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const notifications = await getUserNotifications(userId, true)
    return notifications.length
  } catch (error) {
    console.warn(`Impossible de compter les notifications non lues pour l'utilisateur ${userId}.`)
    return 0
  }
}

// ==================== ACTIVITY MANAGERS ====================

/**
 * Récupère les activités gérées par un responsable
 */
export async function getActivitiesByManager(managerId: string): Promise<DirectusActivity[]> {
  try {
    const activities = await directusClient.request(
      readItems('activities', {
        filter: { manager_id: { _eq: managerId } },
        sort: ['category', 'title'],
        limit: -1,
        fields: ['*']
      })
    )

    return activities as DirectusActivity[]
  } catch (error) {
    console.error(`Erreur lors de la récupération des activités du responsable ${managerId}:`, error)
    return []
  }
}

/**
 * Assigne un responsable à une activité
 */
export async function assignActivityManager(
  activityId: string,
  managerId: string,
  managerEmail: string
): Promise<DirectusActivity | null> {
  try {
    const activity = await directusClient.request(
      updateItem('activities', activityId, {
        manager_id: managerId,
        manager_email: managerEmail,
      })
    )

    return activity as DirectusActivity
  } catch (error) {
    console.error(`Erreur lors de l'assignation du responsable à l'activité ${activityId}:`, error)
    return null
  }
}

/**
 * Retire le responsable d'une activité
 */
export async function removeActivityManager(activityId: string): Promise<boolean> {
  try {
    await directusClient.request(
      updateItem('activities', activityId, {
        manager_id: null,
        manager_email: null,
      })
    )

    return true
  } catch (error) {
    console.error(`Erreur lors du retrait du responsable de l'activité ${activityId}:`, error)
    return false
  }
}

/**
 * Vérifie si un utilisateur est responsable d'une activité
 */
export async function isActivityManager(activityId: string, userId: string): Promise<boolean> {
  try {
    const activity = await getActivityById(activityId)
    return activity?.manager_id === userId
  } catch (error) {
    return false
  }
}

// ==================== EVENT MANAGERS ====================

/**
 * Récupère les événements gérés par un responsable
 */
export async function getEventsByManager(managerId: string): Promise<DirectusEvent[]> {
  try {
    const events = await directusClient.request(
      readItems('events', {
        filter: { manager_id: { _eq: managerId } },
        sort: ['-date'],
        limit: -1,
        fields: ['*']
      })
    )

    return events as DirectusEvent[]
  } catch (error) {
    console.error(`Erreur lors de la récupération des événements du responsable ${managerId}:`, error)
    return []
  }
}

/**
 * Assigne un responsable à un événement
 */
export async function assignEventManager(
  eventId: string,
  managerId: string,
  managerEmail: string
): Promise<DirectusEvent | null> {
  try {
    const event = await directusClient.request(
      updateItem('events', eventId, {
        manager_id: managerId,
        manager_email: managerEmail,
      })
    )

    return event as DirectusEvent
  } catch (error) {
    console.error(`Erreur lors de l'assignation du responsable à l'événement ${eventId}:`, error)
    return null
  }
}

/**
 * Retire le responsable d'un événement
 */
export async function removeEventManager(eventId: string): Promise<boolean> {
  try {
    await directusClient.request(
      updateItem('events', eventId, {
        manager_id: null,
        manager_email: null,
      })
    )

    return true
  } catch (error) {
    console.error(`Erreur lors du retrait du responsable de l'événement ${eventId}:`, error)
    return false
  }
}

/**
 * Vérifie si un utilisateur est responsable d'un événement
 */
export async function isEventManager(eventId: string, userId: string): Promise<boolean> {
  try {
    const event = await getEventById(eventId)
    return event?.manager_id === userId
  } catch (error) {
    return false
  }
}

/**
 * Assigne un responsable par défaut à toutes les activités sans responsable
 */
export async function assignDefaultManagerToActivities(managerId: string, managerEmail: string): Promise<number> {
  try {
    const activities = await directusClient.request(
      readItems('activities', {
        filter: {
          _or: [
            { manager_id: { _null: true } },
            { manager_id: { _eq: '' } }
          ]
        },
        limit: -1,
      })
    )

    let count = 0
    for (const activity of activities) {
      await directusClient.request(
        updateItem('activities', activity.id, {
          manager_id: managerId,
          manager_email: managerEmail,
        })
      )
      count++
    }

    return count
  } catch (error) {
    console.error('Erreur lors de l\'assignation du responsable par défaut aux activités:', error)
    return 0
  }
}

/**
 * Assigne un responsable par défaut à tous les événements sans responsable
 */
export async function assignDefaultManagerToEvents(managerId: string, managerEmail: string): Promise<number> {
  try {
    const events = await directusClient.request(
      readItems('events', {
        filter: {
          _or: [
            { manager_id: { _null: true } },
            { manager_id: { _eq: '' } }
          ]
        },
        limit: -1,
      })
    )

    let count = 0
    for (const event of events) {
      await directusClient.request(
        updateItem('events', event.id, {
          manager_id: managerId,
          manager_email: managerEmail,
        })
      )
      count++
    }

    return count
  } catch (error) {
    console.error('Erreur lors de l\'assignation du responsable par défaut aux événements:', error)
    return 0
  }
}

// ==================== CRUD ACTIVITIES ====================

/**
 * Crée une nouvelle activité
 */
export async function createActivity(data: Omit<DirectusActivity, 'id' | 'date_created' | 'date_updated'>): Promise<DirectusActivity | null> {
  try {
    const activity = await directusClient.request(
      createItem('activities', data)
    )
    return activity as DirectusActivity
  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error)
    return null
  }
}

/**
 * Met à jour une activité
 */
export async function updateActivity(id: string, data: Partial<DirectusActivity>): Promise<DirectusActivity | null> {
  try {
    const activity = await directusClient.request(
      updateItem('activities', id, data)
    )
    return activity as DirectusActivity
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'activité ${id}:`, error)
    return null
  }
}

/**
 * Supprime une activité
 */
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    await directusClient.request(
      deleteItem('activities', id)
    )
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'activité ${id}:`, error)
    return false
  }
}

// ==================== CRUD EVENTS ====================

/**
 * Crée un nouvel événement
 * @throws {Error} Si la création échoue (l'erreur est propagée pour être gérée par l'appelant)
 */
export async function createEvent(data: Omit<DirectusEvent, 'id' | 'date_created' | 'date_updated'>): Promise<DirectusEvent> {
  try {
    const event = await directusClient.request(
      createItem('events', data)
    )
    return event as DirectusEvent
  } catch (error: unknown) {
    console.error('Erreur lors de la création de l\'événement:', error)
    // Propager l'erreur avec plus de contexte
    const err = error as { errors?: Array<{ message?: string }>; message?: string }
    if (err.errors && Array.isArray(err.errors)) {
      const messages = err.errors.map(e => e.message).filter(Boolean).join(', ')
      throw new Error(`Directus: ${messages || 'Erreur inconnue'}`)
    }
    throw new Error(err.message || 'Impossible de créer l\'événement dans Directus')
  }
}

/**
 * Met à jour un événement
 */
export async function updateEvent(id: string, data: Partial<DirectusEvent>): Promise<DirectusEvent | null> {
  try {
    const event = await directusClient.request(
      updateItem('events', id, data)
    )
    return event as DirectusEvent
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'événement ${id}:`, error)
    return null
  }
}

/**
 * Supprime un événement
 */
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await directusClient.request(
      deleteItem('events', id)
    )
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'événement ${id}:`, error)
    return false
  }
}

// ==================== CRUD JUMUA MESSAGES ====================

/**
 * Récupère un message Jumua par son ID
 */
export async function getJumuaMessageById(id: string): Promise<DirectusJumuaMessage | null> {
  try {
    const message = await directusClient.request(
      readItem('jumua_messages', id)
    )
    return message as DirectusJumuaMessage
  } catch (error) {
    console.error(`Erreur lors de la récupération du message Jumua ${id}:`, error)
    return null
  }
}

/**
 * Récupère tous les messages Jumua (actifs et inactifs)
 */
export async function getAllJumuaMessages(): Promise<DirectusJumuaMessage[]> {
  try {
    const messages = await directusClient.request(
      readItems('jumua_messages', {
        sort: ['order'],
        limit: -1,
      })
    )
    return messages as DirectusJumuaMessage[]
  } catch (error) {
    console.error('Erreur lors de la récupération des messages Jumua:', error)
    return []
  }
}

/**
 * Récupère les messages Jumua actifs (pour l'affichage public)
 * Filtre par is_active et par validité de date
 */
export async function getActiveJumuaMessages(): Promise<DirectusJumuaMessage[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const messages = await directusClient.request(
      readItems('jumua_messages', {
        filter: {
          is_active: { _eq: true },
          _and: [
            {
              _or: [
                { valid_from: { _null: true } },
                { valid_from: { _lte: today } }
              ]
            },
            {
              _or: [
                { valid_until: { _null: true } },
                { valid_until: { _gte: today } }
              ]
            }
          ]
        },
        sort: ['order'],
        limit: -1,
      })
    )
    return messages as DirectusJumuaMessage[]
  } catch (error) {
    console.error('Erreur lors de la récupération des messages Jumua actifs:', error)
    return []
  }
}

/**
 * Crée un nouveau message Jumua
 */
export async function createJumuaMessage(data: Omit<DirectusJumuaMessage, 'id' | 'date_created' | 'date_updated'>): Promise<DirectusJumuaMessage | null> {
  try {
    const message = await directusClient.request(
      createItem('jumua_messages', data)
    )
    return message as DirectusJumuaMessage
  } catch (error) {
    console.error('Erreur lors de la création du message Jumua:', error)
    return null
  }
}

/**
 * Met à jour un message Jumua
 */
export async function updateJumuaMessage(id: string, data: Partial<DirectusJumuaMessage>): Promise<DirectusJumuaMessage | null> {
  try {
    const message = await directusClient.request(
      updateItem('jumua_messages', id, data)
    )
    return message as DirectusJumuaMessage
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du message Jumua ${id}:`, error)
    return null
  }
}

/**
 * Supprime un message Jumua
 */
export async function deleteJumuaMessage(id: string): Promise<boolean> {
  try {
    await directusClient.request(
      deleteItem('jumua_messages', id)
    )
    return true
  } catch (error) {
    console.error(`Erreur lors de la suppression du message Jumua ${id}:`, error)
    return false
  }
}

/**
 * Récupère toutes les activités (actives et inactives) pour l'admin
 */
export async function getAllActivities(): Promise<DirectusActivity[]> {
  try {
    const activities = await directusClient.request(
      readItems('activities', {
        sort: ['category', 'title'],
        limit: -1,
        fields: ['*']
      })
    )
    return activities as DirectusActivity[]
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les activités:', error)
    return []
  }
}

/**
 * Récupère tous les événements (publiés et non publiés) pour l'admin
 */
export async function getAllEvents(): Promise<DirectusEvent[]> {
  try {
    const events = await directusClient.request(
      readItems('events', {
        sort: ['-date'],
        limit: -1,
        fields: ['*']
      })
    )
    return events as DirectusEvent[]
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les événements:', error)
    return []
  }
}

// ==================== OFFERINGS UNIFIÉES (ÉVÉNEMENTS + ACTIVITÉS) ====================

/**
 * Récupère toutes les offres (événements + activités) pour l'admin
 */
export async function getAllOfferings(itemType?: ItemType): Promise<DirectusOffering[]> {
  try {
    const results: DirectusOffering[] = []

    // Récupérer les événements si pas de filtre ou filtre EVENT
    if (!itemType || itemType === 'EVENT') {
      const events = await directusClient.request(
        readItems('events', {
          sort: ['-date'], // Trier par date d'événement
          limit: -1,
          fields: ['*']
        })
      )
      // Ajouter item_type pour les événements
      results.push(...(events as any[]).map(e => ({
        ...e,
        item_type: 'EVENT' as const
      })))
    }

    // Récupérer les activités si pas de filtre ou filtre ACTIVITY
    if (!itemType || itemType === 'ACTIVITY') {
      const activities = await directusClient.request(
        readItems('activities', {
          sort: ['-id'], // Trier par ID (plus récent en premier)
          limit: -1,
          fields: ['*']
        })
      )
      // Ajouter item_type pour les activités
      // Mapper les champs spécifiques aux activités
      results.push(...(activities as any[]).map(a => ({
        ...a,
        item_type: 'ACTIVITY' as const,
        // Mapper max_participants vers max_capacity pour uniformité
        max_capacity: a.max_participants || a.max_capacity,
        // Mapper active vers published pour uniformité
        published: a.active ?? a.published ?? false
      })))
    }

    return results as DirectusOffering[]
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error)
    return []
  }
}

/**
 * Récupère les offres filtrées par type avec options
 */
export async function getOfferings(options: {
  itemType?: ItemType
  published?: boolean
  managerId?: string
}): Promise<DirectusOffering[]> {
  try {
    const filter: any = {}

    if (options.itemType) {
      filter.item_type = { _eq: options.itemType }
    }

    if (options.published !== undefined) {
      filter.published = { _eq: options.published }
    }

    if (options.managerId) {
      filter.manager_id = { _eq: options.managerId }
    }

    const offerings = await directusClient.request(
      readItems('events', {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        sort: options.itemType === 'ACTIVITY' ? ['category', 'title'] : ['-date'],
        limit: -1,
        fields: ['*']
      })
    )

    return (offerings as any[]).map(o => ({
      ...o,
      item_type: o.item_type || 'EVENT'
    })) as DirectusOffering[]
  } catch (error) {
    console.error('Erreur lors de la récupération des offres filtrées:', error)
    return []
  }
}

/**
 * Récupère une offre par son ID (cherche dans events puis activities)
 */
export async function getOfferingById(id: string): Promise<DirectusOffering | null> {
  try {
    // Essayer d'abord dans events
    try {
      const event = await directusClient.request(
        readItem('events', id, { fields: ['*'] })
      )
      return { ...event, item_type: 'EVENT' as const } as unknown as DirectusOffering
    } catch {
      // Si pas trouvé dans events, chercher dans activities
      const activity = await directusClient.request(
        readItem('activities', id, { fields: ['*'] })
      )
      return { ...activity, item_type: 'ACTIVITY' as const } as unknown as DirectusOffering
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'offre ${id}:`, error)
    return null
  }
}

/**
 * Récupère une offre par son slug
 */
export async function getOfferingBySlug(slug: string): Promise<DirectusOffering | null> {
  try {
    const offerings = await directusClient.request(
      readItems('events', {
        filter: { slug: { _eq: slug } },
        limit: 1,
        fields: ['*']
      })
    )

    if (offerings.length === 0) return null

    return {
      ...offerings[0],
      item_type: (offerings[0] as any).item_type || 'EVENT'
    } as DirectusOffering
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'offre par slug ${slug}:`, error)
    return null
  }
}

/**
 * Crée une nouvelle offre (événement ou activité)
 */
export async function createOffering(
  data: Omit<DirectusOffering, 'id' | 'date_created' | 'date_updated'>
): Promise<DirectusOffering | null> {
  try {
    // Déterminer la collection en fonction du type
    const itemType = data.item_type || 'EVENT'
    const collection = itemType === 'ACTIVITY' ? 'activities' : 'events'

    // Préparer les données selon le type
    const offeringData = {
      ...data,
      item_type: itemType
    }

    const offering = await directusClient.request(
      createItem(collection, offeringData)
    )

    return offering as DirectusOffering
  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error)
    return null
  }
}

/**
 * Met à jour une offre
 */
export async function updateOffering(
  id: string,
  data: Partial<DirectusOffering>
): Promise<DirectusOffering | null> {
  try {
    // Essayer de mettre à jour dans events d'abord
    try {
      const offering = await directusClient.request(
        updateItem('events', id, data)
      )
      return { ...offering, item_type: 'EVENT' as const } as unknown as DirectusOffering
    } catch {
      // Si pas trouvé dans events, essayer activities
      const offering = await directusClient.request(
        updateItem('activities', id, data)
      )
      return { ...offering, item_type: 'ACTIVITY' as const } as unknown as DirectusOffering
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'offre ${id}:`, error)
    return null
  }
}

/**
 * Supprime une offre
 */
export async function deleteOffering(id: string): Promise<boolean> {
  try {
    // Essayer de supprimer dans events d'abord
    try {
      await directusClient.request(
        deleteItem('events', id)
      )
      return true
    } catch {
      // Si pas trouvé dans events, essayer activities
      await directusClient.request(
        deleteItem('activities', id)
      )
      return true
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'offre ${id}:`, error)
    return false
  }
}

/**
 * Récupère les offres par responsable (events + activities)
 */
export async function getOfferingsByManager(
  managerId: string,
  itemType?: ItemType
): Promise<DirectusOffering[]> {
  try {
    const results: DirectusOffering[] = []
    const filter = { manager_id: { _eq: managerId } }

    // Récupérer les événements si pas de filtre ou filtre EVENT
    if (!itemType || itemType === 'EVENT') {
      const events = await directusClient.request(
        readItems('events', {
          filter,
          sort: ['-date'], // Trier par date d'événement
          limit: -1,
          fields: ['*']
        })
      )
      results.push(...(events as any[]).map(e => ({
        ...e,
        item_type: 'EVENT' as const
      })))
    }

    // Récupérer les activités si pas de filtre ou filtre ACTIVITY
    if (!itemType || itemType === 'ACTIVITY') {
      const activities = await directusClient.request(
        readItems('activities', {
          filter,
          sort: ['-id'], // Trier par ID
          limit: -1,
          fields: ['*']
        })
      )
      results.push(...(activities as any[]).map(a => ({
        ...a,
        item_type: 'ACTIVITY' as const,
        // Mapper les champs pour uniformité
        max_capacity: a.max_participants || a.max_capacity,
        published: a.active ?? a.published ?? false
      })))
    }

    return results as DirectusOffering[]
  } catch (error) {
    console.error(`Erreur lors de la récupération des offres du responsable ${managerId}:`, error)
    return []
  }
}

/**
 * Assigne un responsable à une offre
 */
export async function assignOfferingManager(
  offeringId: string,
  managerId: string,
  managerEmail: string
): Promise<DirectusOffering | null> {
  return updateOffering(offeringId, {
    manager_id: managerId,
    manager_email: managerEmail,
  })
}

/**
 * Retire le responsable d'une offre
 */
export async function removeOfferingManager(offeringId: string): Promise<boolean> {
  try {
    // Essayer events d'abord
    try {
      await directusClient.request(
        updateItem('events', offeringId, {
          manager_id: null,
          manager_email: null,
        })
      )
      return true
    } catch {
      // Si pas trouvé dans events, essayer activities
      await directusClient.request(
        updateItem('activities', offeringId, {
          manager_id: null,
          manager_email: null,
        })
      )
      return true
    }
  } catch (error) {
    console.error(`Erreur lors du retrait du responsable de l'offre ${offeringId}:`, error)
    return false
  }
}

/**
 * Vérifie si un utilisateur est responsable d'une offre
 */
export async function isOfferingManager(offeringId: string, userId: string): Promise<boolean> {
  try {
    const offering = await getOfferingById(offeringId)
    return offering?.manager_id === userId
  } catch (error) {
    return false
  }
}
