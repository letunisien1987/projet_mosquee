/**
 * Service de contenu
 * Toutes les fonctions de gestion de contenu utilisent Prisma
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export type ItemType = 'EVENT' | 'ACTIVITY'

export interface OfferingFilters {
  published?: boolean
  featured?: boolean
  category?: string
  managerId?: string
  managerEmail?: string
}

export interface OrganizerInfo {
  name: string | null
  email: string | null
  phone: string | null
  firstName?: string | null
  lastName?: string | null
  showName?: boolean
  showEmail?: boolean
  showPhone?: boolean
}

// ============================================================================
// ÉVÉNEMENTS
// ============================================================================

/**
 * Récupérer tous les événements
 */
export async function getEvents(filters: OfferingFilters = {}) {
  const where: Prisma.EventWhereInput = {}

  if (filters.published !== undefined) {
    where.published = filters.published
  }
  if (filters.featured !== undefined) {
    where.featured = filters.featured
  }
  if (filters.category) {
    where.category = filters.category
  }
  if (filters.managerId) {
    where.managerId = filters.managerId
  }
  if (filters.managerEmail) {
    where.managerEmail = filters.managerEmail
  }

  return prisma.event.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      _count: {
        select: { registrations: true }
      }
    }
  })
}

/**
 * Récupérer les événements publiés pour le public
 */
export async function getPublishedEvents() {
  return getEvents({ published: true })
}

/**
 * Récupérer les événements à venir
 */
export async function getUpcomingEvents(limit?: number) {
  return prisma.event.findMany({
    where: {
      published: true,
      date: { gte: new Date() }
    },
    orderBy: { date: 'asc' },
    take: limit,
    include: {
      manager: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

/**
 * Récupérer un événement par ID
 */
export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      registrations: true,
      _count: {
        select: { registrations: true }
      }
    }
  })
}

/**
 * Récupérer un événement par slug
 */
export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      _count: {
        select: { registrations: true }
      }
    }
  })
}

/**
 * Créer un événement
 */
export async function createEvent(data: Prisma.EventUncheckedCreateInput) {
  return prisma.event.create({
    data,
    include: {
      manager: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

/**
 * Mettre à jour un événement
 */
export async function updateEvent(id: string, data: Prisma.EventUncheckedUpdateInput) {
  return prisma.event.update({
    where: { id },
    data,
    include: {
      manager: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

/**
 * Supprimer un événement
 */
export async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } })
}

/**
 * Compter les inscriptions à un événement
 */
export async function getEventRegistrationCount(eventId: string): Promise<number> {
  return prisma.eventRegistration.count({
    where: { eventId }
  })
}

/**
 * Vérifier la disponibilité d'un événement
 */
export async function checkEventAvailability(eventId: string): Promise<{
  available: boolean
  remainingSpots: number | null
  totalSpots: number | null
}> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      maxCapacity: true,
      _count: { select: { registrations: true } }
    }
  })

  if (!event) {
    return { available: false, remainingSpots: null, totalSpots: null }
  }

  if (!event.maxCapacity) {
    return { available: true, remainingSpots: null, totalSpots: null }
  }

  const remainingSpots = event.maxCapacity - event._count.registrations
  return {
    available: remainingSpots > 0,
    remainingSpots,
    totalSpots: event.maxCapacity
  }
}

// ============================================================================
// ACTIVITÉS
// ============================================================================

/**
 * Récupérer toutes les activités
 */
export async function getActivities(filters: OfferingFilters = {}) {
  const where: Prisma.ActivityWhereInput = {}

  if (filters.published !== undefined) {
    where.active = filters.published
  }
  if (filters.category) {
    where.category = filters.category
  }
  if (filters.managerId) {
    where.managerId = filters.managerId
  }
  if (filters.managerEmail) {
    where.managerEmail = filters.managerEmail
  }

  return prisma.activity.findMany({
    where,
    orderBy: { title: 'asc' },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

/**
 * Récupérer les activités actives pour le public
 */
export async function getActiveActivities() {
  return getActivities({ published: true })
}

/**
 * Récupérer une activité par ID
 */
export async function getActivityById(id: string) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      enrollments: true,
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

/**
 * Récupérer une activité par slug
 */
export async function getActivityBySlug(slug: string) {
  return prisma.activity.findUnique({
    where: { slug },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

/**
 * Créer une activité
 */
export async function createActivity(data: Prisma.ActivityUncheckedCreateInput) {
  return prisma.activity.create({
    data,
    include: {
      manager: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

/**
 * Mettre à jour une activité
 */
export async function updateActivity(id: string, data: Prisma.ActivityUncheckedUpdateInput) {
  return prisma.activity.update({
    where: { id },
    data,
    include: {
      manager: {
        select: { firstName: true, lastName: true, email: true }
      }
    }
  })
}

/**
 * Supprimer une activité
 */
export async function deleteActivity(id: string) {
  return prisma.activity.delete({ where: { id } })
}

// ============================================================================
// PROJETS (DONS)
// ============================================================================

/**
 * Récupérer tous les projets
 */
export async function getProjects(activeOnly = true) {
  return prisma.project.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { donations: true } }
    }
  })
}

/**
 * Récupérer un projet par ID
 */
export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      donations: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: { select: { donations: true } }
    }
  })
}

/**
 * Récupérer un projet par slug
 */
export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      _count: { select: { donations: true } }
    }
  })
}

/**
 * Créer un projet
 */
export async function createProject(data: Prisma.ProjectCreateInput) {
  return prisma.project.create({ data })
}

/**
 * Mettre à jour un projet
 */
export async function updateProject(id: string, data: Prisma.ProjectUpdateInput) {
  return prisma.project.update({ where: { id }, data })
}

/**
 * Supprimer un projet
 */
export async function deleteProject(id: string) {
  return prisma.project.delete({ where: { id } })
}

// ============================================================================
// ÉQUIPE
// ============================================================================

/**
 * Récupérer tous les membres de l'équipe
 */
export async function getTeamMembers(activeOnly = true) {
  return prisma.teamMember.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: {
      user: {
        select: { id: true, email: true }
      }
    }
  })
}

/**
 * Récupérer un membre par ID
 */
export async function getTeamMemberById(id: string) {
  return prisma.teamMember.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true }
      }
    }
  })
}

/**
 * Créer un membre d'équipe
 */
export async function createTeamMember(data: Prisma.TeamMemberCreateInput) {
  return prisma.teamMember.create({ data })
}

/**
 * Mettre à jour un membre d'équipe
 */
export async function updateTeamMember(id: string, data: Prisma.TeamMemberUpdateInput) {
  return prisma.teamMember.update({ where: { id }, data })
}

/**
 * Supprimer un membre d'équipe
 */
export async function deleteTeamMember(id: string) {
  return prisma.teamMember.delete({ where: { id } })
}

// ============================================================================
// MESSAGES JUMUA
// ============================================================================

/**
 * Récupérer les messages Jumua actifs
 */
export async function getActiveJumuaMessages() {
  const now = new Date()

  return prisma.jumuaMessage.findMany({
    where: {
      isActive: true,
      OR: [
        { validFrom: null, validUntil: null },
        { validFrom: { lte: now }, validUntil: null },
        { validFrom: null, validUntil: { gte: now } },
        { validFrom: { lte: now }, validUntil: { gte: now } },
      ]
    },
    orderBy: { displayOrder: 'asc' }
  })
}

/**
 * Récupérer tous les messages Jumua
 */
export async function getAllJumuaMessages() {
  return prisma.jumuaMessage.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }]
  })
}

/**
 * Créer un message Jumua
 */
export async function createJumuaMessage(data: Prisma.JumuaMessageCreateInput) {
  return prisma.jumuaMessage.create({ data })
}

/**
 * Mettre à jour un message Jumua
 */
export async function updateJumuaMessage(id: string, data: Prisma.JumuaMessageUpdateInput) {
  return prisma.jumuaMessage.update({ where: { id }, data })
}

/**
 * Supprimer un message Jumua
 */
export async function deleteJumuaMessage(id: string) {
  return prisma.jumuaMessage.delete({ where: { id } })
}

/**
 * Récupérer un message Jumua par ID
 */
export async function getJumuaMessageById(id: string) {
  return prisma.jumuaMessage.findUnique({ where: { id } })
}

// ============================================================================
// OFFERINGS (Vue unifiée Événements + Activités)
// ============================================================================

/**
 * Interface unifiée pour les offres (événements + activités)
 */
export interface Offering {
  id: string
  itemType: ItemType
  title: string
  slug?: string
  description?: string | null
  content?: string | null
  category?: string | null
  activityCategory?: string | null
  date?: Date | null
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  image?: string | null
  price?: number | null
  paymentType?: string | null
  published?: boolean
  featured?: boolean
  maxCapacity?: number | null
  registrationRequired?: boolean
  requiresApproval?: boolean
  managerId?: string | null
  managerEmail?: string | null
  restrictions?: Record<string, any> | null
  pricing?: Record<string, any> | null
  schedule?: string | null
  instructor?: string | null
  level?: string | null
  ageGroup?: string | null
  enrollmentOpen?: boolean
  registrationDeadline?: Date | null
  subscriptionInterval?: string | null
  // Champs remboursement
  allowRefund?: boolean
  cancellationDeadlineDays?: number | null
  // Champs contact organisateur
  showOrganizerName?: boolean
  showOrganizerEmail?: boolean
  showOrganizerPhone?: boolean
}

/**
 * Récupérer toutes les offres (événements + activités)
 */
export async function getAllOfferings(itemType?: ItemType): Promise<Offering[]> {
  const offerings: Offering[] = []

  // Récupérer les événements
  if (!itemType || itemType === 'EVENT') {
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        manager: {
          select: { id: true, email: true }
        }
      }
    })

    for (const event of events) {
      offerings.push({
        id: event.id,
        itemType: 'EVENT',
        title: event.title,
        slug: event.slug || undefined,
        description: event.description,
        category: event.category,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        image: event.imageUrl,
        price: event.price ? Number(event.price) : null,
        paymentType: event.paymentType,
        published: event.published,
        featured: event.featured,
        maxCapacity: event.maxCapacity,
        registrationRequired: event.registrationRequired,
        requiresApproval: event.requiresApproval,
        managerId: event.managerId,
        managerEmail: event.managerEmail,
        restrictions: event.restrictions as Record<string, any> | null,
        pricing: event.pricing as Record<string, any> | null,
      })
    }
  }

  // Récupérer les activités
  if (!itemType || itemType === 'ACTIVITY') {
    const activities = await prisma.activity.findMany({
      orderBy: { title: 'asc' },
      include: {
        manager: {
          select: { id: true, email: true }
        }
      }
    })

    for (const activity of activities) {
      offerings.push({
        id: activity.id,
        itemType: 'ACTIVITY',
        title: activity.title,
        slug: activity.slug || undefined,
        description: activity.description,
        category: activity.category,
        price: activity.price ? Number(activity.price) : null,
        paymentType: activity.paymentType,
        published: activity.active,
        maxCapacity: activity.maxParticipants,
        requiresApproval: activity.requiresApproval,
        managerId: activity.managerId,
        managerEmail: activity.managerEmail,
        restrictions: activity.restrictions as Record<string, any> | null,
        pricing: activity.pricing as Record<string, any> | null,
        schedule: activity.schedule,
        instructor: activity.instructorName,
        level: activity.level,
        ageGroup: activity.ageGroup,
        enrollmentOpen: activity.enrollmentOpen,
      })
    }
  }

  return offerings
}

/**
 * Récupérer une offre par ID
 */
export async function getOfferingById(id: string): Promise<Offering | null> {
  // Chercher d'abord dans les événements
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, email: true }
      }
    }
  })

  if (event) {
    return {
      id: event.id,
      itemType: 'EVENT',
      title: event.title,
      slug: event.slug || undefined,
      description: event.description,
      content: event.content,
      category: event.category,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      image: event.imageUrl,
      price: event.price ? Number(event.price) : null,
      paymentType: event.paymentType,
      subscriptionInterval: event.subscriptionInterval,
      published: event.published,
      featured: event.featured,
      maxCapacity: event.maxCapacity,
      registrationRequired: event.registrationRequired,
      requiresApproval: event.requiresApproval,
      registrationDeadline: event.registrationDeadline,
      managerId: event.managerId,
      managerEmail: event.managerEmail,
      restrictions: event.restrictions as Record<string, any> | null,
      pricing: event.pricing as Record<string, any> | null,
      allowRefund: event.allowRefund,
      cancellationDeadlineDays: event.cancellationDeadlineDays,
      showOrganizerName: event.showOrganizerName,
      showOrganizerEmail: event.showOrganizerEmail,
      showOrganizerPhone: event.showOrganizerPhone,
    }
  }

  // Sinon chercher dans les activités
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, email: true }
      }
    }
  })

  if (activity) {
    return {
      id: activity.id,
      itemType: 'ACTIVITY',
      title: activity.title,
      slug: activity.slug || undefined,
      description: activity.description,
      content: activity.content,
      category: activity.category,
      price: activity.price ? Number(activity.price) : null,
      paymentType: activity.paymentType,
      subscriptionInterval: activity.subscriptionInterval,
      published: activity.active,
      maxCapacity: activity.maxParticipants,
      requiresApproval: activity.requiresApproval,
      managerId: activity.managerId,
      managerEmail: activity.managerEmail,
      restrictions: activity.restrictions as Record<string, any> | null,
      pricing: activity.pricing as Record<string, any> | null,
      schedule: activity.schedule,
      instructor: activity.instructorName,
      level: activity.level,
      ageGroup: activity.ageGroup,
      enrollmentOpen: activity.enrollmentOpen,
      allowRefund: activity.allowRefund,
      cancellationDeadlineDays: activity.cancellationDeadlineDays,
      showOrganizerName: activity.showOrganizerName,
      showOrganizerEmail: activity.showOrganizerEmail,
      showOrganizerPhone: activity.showOrganizerPhone,
    }
  }

  return null
}

/**
 * Récupérer les offres d'un manager
 */
export async function getOfferingsByManager(managerIdOrEmail: string, itemType?: ItemType): Promise<Offering[]> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: managerIdOrEmail },
        { email: managerIdOrEmail }
      ]
    },
    select: { id: true, email: true }
  })

  if (!user) return []

  const offerings: Offering[] = []

  // Récupérer les événements du manager
  if (!itemType || itemType === 'EVENT') {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { managerId: user.id },
          { managerEmail: user.email }
        ]
      },
      orderBy: { date: 'desc' },
      include: {
        manager: {
          select: { id: true, email: true }
        }
      }
    })

    for (const event of events) {
      offerings.push({
        id: event.id,
        itemType: 'EVENT',
        title: event.title,
        slug: event.slug || undefined,
        description: event.description,
        category: event.category,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        image: event.imageUrl,
        price: event.price ? Number(event.price) : null,
        paymentType: event.paymentType,
        published: event.published,
        featured: event.featured,
        maxCapacity: event.maxCapacity,
        registrationRequired: event.registrationRequired,
        requiresApproval: event.requiresApproval,
        managerId: event.managerId,
        managerEmail: event.managerEmail,
        restrictions: event.restrictions as Record<string, any> | null,
        pricing: event.pricing as Record<string, any> | null,
      })
    }
  }

  // Récupérer les activités du manager
  if (!itemType || itemType === 'ACTIVITY') {
    const activities = await prisma.activity.findMany({
      where: {
        OR: [
          { managerId: user.id },
          { managerEmail: user.email }
        ]
      },
      orderBy: { title: 'asc' },
      include: {
        manager: {
          select: { id: true, email: true }
        }
      }
    })

    for (const activity of activities) {
      offerings.push({
        id: activity.id,
        itemType: 'ACTIVITY',
        title: activity.title,
        slug: activity.slug || undefined,
        description: activity.description,
        category: activity.category,
        price: activity.price ? Number(activity.price) : null,
        paymentType: activity.paymentType,
        published: activity.active,
        maxCapacity: activity.maxParticipants,
        requiresApproval: activity.requiresApproval,
        managerId: activity.managerId,
        managerEmail: activity.managerEmail,
        restrictions: activity.restrictions as Record<string, any> | null,
        pricing: activity.pricing as Record<string, any> | null,
        schedule: activity.schedule,
        instructor: activity.instructorName,
        level: activity.level,
        ageGroup: activity.ageGroup,
        enrollmentOpen: activity.enrollmentOpen,
      })
    }
  }

  return offerings
}

/**
 * Créer une offre (événement ou activité)
 */
export async function createOffering(data: any): Promise<Offering | null> {
  // Accepter camelCase OU snake_case pour itemType
  const itemType = (data.itemType ?? data.item_type) as ItemType

  if (itemType === 'EVENT') {
    const event = await createEvent({
      title: data.title,
      slug: data.slug,
      description: data.description,
      category: data.category,
      date: data.date ? new Date(data.date) : new Date(),
      startTime: data.startTime ?? data.start_time,
      endTime: data.endTime ?? data.end_time,
      location: data.location,
      imageUrl: data.imageUrl ?? data.image,
      price: data.price,
      paymentType: data.paymentType ?? data.payment_type,
      published: data.published ?? false,
      featured: data.featured ?? false,
      maxCapacity: data.maxCapacity ?? data.max_capacity,
      registrationRequired: data.registrationRequired ?? data.registration_required ?? true,
      requiresApproval: data.requiresApproval ?? data.requires_approval ?? false,
      managerId: data.managerId ?? data.manager_id,
      managerEmail: data.managerEmail ?? data.manager_email,
      restrictions: data.restrictions,
      pricing: data.pricing,
      allowRefund: data.allowRefund ?? data.allow_refund,
      cancellationDeadlineDays: data.cancellationDeadlineDays ?? data.cancellation_deadline_days,
    })

    return getOfferingById(event.id)
  } else if (itemType === 'ACTIVITY') {
    const activity = await createActivity({
      title: data.title,
      slug: data.slug,
      description: data.description,
      category: data.activityCategory ?? data.activity_category ?? data.category,
      level: data.level,
      ageGroup: data.ageGroup ?? data.age_group,
      schedule: data.schedule,
      instructorName: data.instructorName ?? data.instructor,
      price: data.price,
      paymentType: data.paymentType ?? data.payment_type,
      active: data.published ?? true,
      enrollmentOpen: data.enrollmentOpen ?? data.enrollment_open ?? true,
      maxParticipants: data.maxCapacity ?? data.maxParticipants ?? data.max_capacity,
      requiresApproval: data.requiresApproval ?? data.requires_approval ?? false,
      managerId: data.managerId ?? data.manager_id,
      managerEmail: data.managerEmail ?? data.manager_email,
      restrictions: data.restrictions,
      pricing: data.pricing,
    })

    return getOfferingById(activity.id)
  }

  return null
}

/**
 * Mettre à jour une offre
 * Seuls les champs fournis (non-undefined) seront mis à jour
 */
export async function updateOffering(id: string, data: any): Promise<Offering | null> {
  const offering = await getOfferingById(id)
  if (!offering) return null

  // Helper pour filtrer les valeurs undefined
  const filterUndefined = (obj: Record<string, any>) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    )
  }

  if (offering.itemType === 'EVENT') {
    // Récupérer la valeur de registrationDeadline (camelCase ou snake_case)
    const deadlineVal = data.registrationDeadline ?? data.registration_deadline

    const updateData = filterUndefined({
      title: data.title,
      slug: data.slug,
      description: data.description,
      content: data.content,
      category: data.category,
      // date est requis dans le schéma, on ne le met à jour que s'il y a une valeur
      date: data.date ? new Date(data.date) : undefined,
      // Accepter camelCase OU snake_case pour tous les champs
      startTime: data.startTime ?? data.start_time,
      endTime: data.endTime ?? data.end_time,
      location: data.location,
      imageUrl: data.imageUrl ?? data.image,
      registrationDeadline: deadlineVal === null ? null : (deadlineVal ? new Date(deadlineVal) : undefined),
      price: data.price,
      paymentType: data.paymentType ?? data.payment_type,
      subscriptionInterval: data.subscriptionInterval ?? data.subscription_interval,
      published: data.published,
      featured: data.featured,
      maxCapacity: data.maxCapacity ?? data.max_capacity,
      registrationRequired: data.registrationRequired ?? data.registration_required,
      requiresApproval: data.requiresApproval ?? data.requires_approval,
      managerId: data.managerId ?? data.manager_id,
      managerEmail: data.managerEmail ?? data.manager_email,
      restrictions: data.restrictions,
      pricing: data.pricing,
      allowRefund: data.allowRefund ?? data.allow_refund,
      cancellationDeadlineDays: data.cancellationDeadlineDays ?? data.cancellation_deadline_days,
      // Champs contact organisateur
      showOrganizerName: data.showOrganizerName ?? data.show_organizer_name,
      showOrganizerEmail: data.showOrganizerEmail ?? data.show_organizer_email,
      showOrganizerPhone: data.showOrganizerPhone ?? data.show_organizer_phone,
    })

    if (Object.keys(updateData).length > 0) {
      await updateEvent(id, updateData)
    }
  } else if (offering.itemType === 'ACTIVITY') {
    const updateData = filterUndefined({
      title: data.title,
      slug: data.slug,
      description: data.description,
      content: data.content,
      // Accepter camelCase OU snake_case pour tous les champs
      category: data.activity_category ?? data.activityCategory ?? data.category,
      level: data.level,
      ageGroup: data.ageGroup ?? data.age_group,
      schedule: data.schedule,
      instructorName: data.instructorName ?? data.instructor,
      price: data.price,
      paymentType: data.paymentType ?? data.payment_type,
      subscriptionInterval: data.subscriptionInterval ?? data.subscription_interval,
      active: data.published ?? data.active,
      enrollmentOpen: data.enrollmentOpen ?? data.enrollment_open,
      maxParticipants: data.maxCapacity ?? data.maxParticipants ?? data.max_capacity,
      requiresApproval: data.requiresApproval ?? data.requires_approval,
      managerId: data.managerId ?? data.manager_id,
      managerEmail: data.managerEmail ?? data.manager_email,
      restrictions: data.restrictions,
      pricing: data.pricing,
      allowRefund: data.allowRefund ?? data.allow_refund,
      cancellationDeadlineDays: data.cancellationDeadlineDays ?? data.cancellation_deadline_days,
      // Champs contact organisateur
      showOrganizerName: data.showOrganizerName ?? data.show_organizer_name,
      showOrganizerEmail: data.showOrganizerEmail ?? data.show_organizer_email,
      showOrganizerPhone: data.showOrganizerPhone ?? data.show_organizer_phone,
    })

    if (Object.keys(updateData).length > 0) {
      await updateActivity(id, updateData)
    }
  }

  return getOfferingById(id)
}

/**
 * Supprimer une offre
 */
export async function deleteOffering(id: string): Promise<boolean> {
  const offering = await getOfferingById(id)
  if (!offering) return false

  if (offering.itemType === 'EVENT') {
    await deleteEvent(id)
  } else if (offering.itemType === 'ACTIVITY') {
    await deleteActivity(id)
  }

  return true
}

// ============================================================================
// ARTICLES
// ============================================================================

/**
 * Récupérer les articles publiés
 */
export async function getPublishedArticles(limit?: number) {
  return prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: {
      author: {
        select: { firstName: true, lastName: true }
      }
    }
  })
}

/**
 * Récupérer tous les articles
 */
export async function getAllArticles() {
  return prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    include: {
      author: {
        select: { firstName: true, lastName: true }
      }
    }
  })
}

/**
 * Récupérer un article par slug
 */
export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      author: {
        select: { firstName: true, lastName: true }
      }
    }
  })
}

/**
 * Créer un article
 */
export async function createArticle(data: Prisma.ArticleCreateInput) {
  return prisma.article.create({ data })
}

/**
 * Mettre à jour un article
 */
export async function updateArticle(id: string, data: Prisma.ArticleUpdateInput) {
  return prisma.article.update({ where: { id }, data })
}

/**
 * Supprimer un article
 */
export async function deleteArticle(id: string) {
  return prisma.article.delete({ where: { id } })
}

// ============================================================================
// GALERIES
// ============================================================================

/**
 * Récupérer les galeries publiées
 */
export async function getPublishedGalleries() {
  return prisma.gallery.findMany({
    where: { published: true },
    orderBy: { date: 'desc' },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' }
      }
    }
  })
}

/**
 * Récupérer toutes les galeries
 */
export async function getAllGalleries() {
  return prisma.gallery.findMany({
    orderBy: { date: 'desc' },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' }
      },
      _count: { select: { images: true } }
    }
  })
}

/**
 * Récupérer une galerie par ID
 */
export async function getGalleryById(id: string) {
  return prisma.gallery.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { displayOrder: 'asc' }
      }
    }
  })
}

/**
 * Créer une galerie
 */
export async function createGallery(data: Prisma.GalleryCreateInput) {
  return prisma.gallery.create({
    data,
    include: { images: true }
  })
}

/**
 * Mettre à jour une galerie
 */
export async function updateGallery(id: string, data: Prisma.GalleryUpdateInput) {
  return prisma.gallery.update({
    where: { id },
    data,
    include: { images: true }
  })
}

/**
 * Supprimer une galerie
 */
export async function deleteGallery(id: string) {
  return prisma.gallery.delete({ where: { id } })
}

/**
 * Ajouter une image à une galerie
 */
export async function addGalleryImage(galleryId: string, imageUrl: string, caption?: string) {
  const maxOrder = await prisma.galleryImage.aggregate({
    where: { galleryId },
    _max: { displayOrder: true }
  })

  return prisma.galleryImage.create({
    data: {
      galleryId,
      imageUrl,
      caption,
      displayOrder: (maxOrder._max.displayOrder || 0) + 1
    }
  })
}

/**
 * Supprimer une image de galerie
 */
export async function deleteGalleryImage(id: string) {
  return prisma.galleryImage.delete({ where: { id } })
}

/**
 * Récupérer les événements d'un manager par son ID utilisateur
 */
export async function getEventsByManager(managerIdOrEmail: string) {
  // Chercher d'abord par ID, sinon par email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: managerIdOrEmail },
        { email: managerIdOrEmail }
      ]
    },
    select: { id: true, email: true }
  })

  if (!user) return []

  return prisma.event.findMany({
    where: {
      OR: [
        { managerId: user.id },
        { managerEmail: user.email }
      ]
    },
    orderBy: { date: 'desc' },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      _count: {
        select: { registrations: true }
      }
    }
  })
}

/**
 * Récupérer les activités d'un manager par son ID utilisateur
 */
export async function getActivitiesByManager(managerIdOrEmail: string) {
  // Chercher d'abord par ID, sinon par email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: managerIdOrEmail },
        { email: managerIdOrEmail }
      ]
    },
    select: { id: true, email: true }
  })

  if (!user) return []

  return prisma.activity.findMany({
    where: {
      OR: [
        { managerId: user.id },
        { managerEmail: user.email }
      ]
    },
    orderBy: { title: 'asc' },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

/**
 * Retourne l'URL d'une image (Cloudinary ou autre)
 * Les images sont stockées dans Cloudinary
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // Si c'est une URL complète, la retourner
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return null
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Générer un slug unique
 */
export async function generateUniqueSlug(
  title: string,
  table: 'event' | 'activity' | 'project' | 'article'
): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  let slug = baseSlug
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let exists = false

    switch (table) {
      case 'event':
        exists = !!(await prisma.event.findUnique({ where: { slug } }))
        break
      case 'activity':
        exists = !!(await prisma.activity.findUnique({ where: { slug } }))
        break
      case 'project':
        exists = !!(await prisma.project.findUnique({ where: { slug } }))
        break
      case 'article':
        exists = !!(await prisma.article.findUnique({ where: { slug } }))
        break
    }

    if (!exists) break

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Récupérer les catégories d'événements utilisées
 */
export async function getEventCategories(): Promise<string[]> {
  const events = await prisma.event.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ['category']
  })
  return events.map(e => e.category).filter(Boolean) as string[]
}

/**
 * Récupérer les catégories d'activités utilisées
 */
export async function getActivityCategories(): Promise<string[]> {
  const activities = await prisma.activity.findMany({
    where: { active: true },
    select: { category: true },
    distinct: ['category']
  })
  return activities.map(a => a.category).filter(Boolean) as string[]
}

// ============================================================================
// BATCH FETCHING - getOfferingsByIds
// ============================================================================

/**
 * Interface pour les données d'offering retournées par getOfferingsByIds
 */
export interface OfferingData {
  id: string
  itemType: 'EVENT' | 'ACTIVITY'
  title: string
  date?: string        // Pour les événements
  startTime?: string   // Pour les événements
  endTime?: string     // Pour les événements
  location?: string    // Pour les événements
  schedule?: string    // Pour les activités
}

/**
 * Récupère plusieurs offres par leurs IDs en batch (fix N+1 query problem)
 * Retourne un Map<id, offering> pour un accès O(1)
 */
export async function getOfferingsByIds(ids: string[]): Promise<Map<string, OfferingData>> {
  const result = new Map<string, OfferingData>()
  if (ids.length === 0) return result

  const uniqueIds = [...new Set(ids)]

  try {
    // Récupérer depuis events
    const events = await prisma.event.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true
      }
    })

    for (const event of events) {
      result.set(event.id, {
        id: event.id,
        itemType: 'EVENT',
        title: event.title,
        date: event.date?.toISOString().split('T')[0],
        startTime: event.startTime || undefined,
        endTime: event.endTime || undefined,
        location: event.location || undefined
      })
    }

    // Récupérer les IDs non trouvés dans activities
    const foundEventIds = new Set(events.map(e => e.id))
    const remainingIds = uniqueIds.filter(id => !foundEventIds.has(id))

    if (remainingIds.length > 0) {
      const activities = await prisma.activity.findMany({
        where: { id: { in: remainingIds } },
        select: {
          id: true,
          title: true,
          schedule: true
        }
      })

      for (const activity of activities) {
        result.set(activity.id, {
          id: activity.id,
          itemType: 'ACTIVITY',
          title: activity.title,
          schedule: activity.schedule || undefined
        })
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération batch des offres:', error)
  }

  return result
}

// ============================================================================
// GESTION DES MANAGERS (RESPONSABLES)
// ============================================================================

/**
 * Assigner un manager à un événement
 */
export async function assignEventManager(eventId: string, userId: string, email: string) {
  try {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        managerId: userId,
        managerEmail: email
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })
    return event
  } catch (error) {
    console.error('Erreur assignEventManager:', error)
    return null
  }
}

/**
 * Retirer le manager d'un événement
 */
export async function removeEventManager(eventId: string): Promise<boolean> {
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        managerId: null,
        managerEmail: null
      }
    })
    return true
  } catch (error) {
    console.error('Erreur removeEventManager:', error)
    return false
  }
}

/**
 * Assigner un manager à une activité
 */
export async function assignActivityManager(activityId: string, userId: string, email: string) {
  try {
    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        managerId: userId,
        managerEmail: email
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })
    return activity
  } catch (error) {
    console.error('Erreur assignActivityManager:', error)
    return null
  }
}

/**
 * Retirer le manager d'une activité
 */
export async function removeActivityManager(activityId: string): Promise<boolean> {
  try {
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        managerId: null,
        managerEmail: null
      }
    })
    return true
  } catch (error) {
    console.error('Erreur removeActivityManager:', error)
    return false
  }
}

/**
 * Assigner un manager par défaut à toutes les activités sans manager
 * Retourne le nombre d'activités mises à jour
 */
export async function assignDefaultManagerToActivities(userId: string, email: string): Promise<number> {
  try {
    const result = await prisma.activity.updateMany({
      where: {
        AND: [
          { managerId: null },
          { managerEmail: null }
        ]
      },
      data: {
        managerId: userId,
        managerEmail: email
      }
    })
    return result.count
  } catch (error) {
    console.error('Erreur assignDefaultManagerToActivities:', error)
    return 0
  }
}

/**
 * Assigner un manager par défaut à tous les événements sans manager
 * Retourne le nombre d'événements mis à jour
 */
export async function assignDefaultManagerToEvents(userId: string, email: string): Promise<number> {
  try {
    const result = await prisma.event.updateMany({
      where: {
        AND: [
          { managerId: null },
          { managerEmail: null }
        ]
      },
      data: {
        managerId: userId,
        managerEmail: email
      }
    })
    return result.count
  } catch (error) {
    console.error('Erreur assignDefaultManagerToEvents:', error)
    return 0
  }
}
