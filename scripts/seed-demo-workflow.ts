/**
 * Script de création de données demo via workflows standard
 *
 * Ce script utilise les APIs et fonctions métier au lieu d'insérer
 * directement dans la base de données.
 *
 * Usage: npx tsx scripts/seed-demo-workflow.ts
 * Prérequis: Next.js doit tourner sur http://localhost:3000
 */

import { prisma } from '../lib/prisma'
import {
  createEvent,
  createActivity,
  createProject,
  createTeamMember,
} from '../lib/content'

const BASE_URL = process.env.SEED_BASE_URL || 'http://localhost:3000'

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_SUFFIX = '.demo@mosquee.ch'

// Délai entre les requêtes API (ms) pour éviter le rate limiting
const API_DELAY = 200

// ============================================================================
// HELPERS
// ============================================================================

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiCall(
  endpoint: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      return { ok: false, error: json.error || `HTTP ${res.status}` }
    }

    return { ok: true, data: json }
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : 'Erreur réseau' }
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function futureDate(daysFromNow: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

// ============================================================================
// DONNÉES DEMO
// ============================================================================

const EVENTS_DATA = [
  {
    title: 'Iftar Communautaire 2025',
    description: 'Rejoignez-nous pour un iftar convivial pendant le mois sacré du Ramadan.',
    category: 'religieux',
    date: futureDate(30),
    startTime: '19:30',
    endTime: '22:00',
    location: 'Salle principale de la mosquée',
    price: 15,
    paymentType: 'ONE_TIME',
    maxCapacity: 100,
    published: true,
    featured: true,
    registrationRequired: true,
    requiresApproval: false,
  },
  {
    title: 'Conférence: La Spiritualité au Quotidien',
    description: 'Une conférence inspirante sur comment maintenir une connexion spirituelle dans notre vie moderne.',
    category: 'education',
    date: futureDate(14),
    startTime: '14:00',
    endTime: '16:30',
    location: 'Salle de conférence',
    price: 0,
    paymentType: 'FREE',
    maxCapacity: 80,
    published: true,
    featured: false,
    registrationRequired: true,
    requiresApproval: false,
  },
  {
    title: 'Sortie Familiale au Parc',
    description: 'Une journée en plein air pour les familles de la communauté. Pique-nique et activités pour enfants.',
    category: 'communaute',
    date: futureDate(45),
    startTime: '10:00',
    endTime: '17:00',
    location: 'Parc de la Suze, Bienne',
    price: 10,
    paymentType: 'ONE_TIME',
    maxCapacity: 150,
    published: true,
    featured: true,
    registrationRequired: true,
    requiresApproval: false,
  },
  {
    title: 'Collecte pour les Familles Démunies',
    description: 'Événement de collecte de dons et de denrées alimentaires pour les familles dans le besoin.',
    category: 'charite',
    date: futureDate(7),
    startTime: '09:00',
    endTime: '18:00',
    location: 'Entrée de la mosquée',
    price: 0,
    paymentType: 'FREE',
    maxCapacity: null,
    published: true,
    featured: false,
    registrationRequired: false,
    requiresApproval: false,
  },
  {
    title: 'Cours Intensif de Tajweed',
    description: 'Formation intensive de 3 jours pour améliorer votre récitation du Coran.',
    category: 'education',
    date: futureDate(60),
    startTime: '09:00',
    endTime: '12:00',
    location: 'Salle d\'étude',
    price: 50,
    paymentType: 'ONE_TIME',
    maxCapacity: 20,
    published: true,
    featured: false,
    registrationRequired: true,
    requiresApproval: true,
  },
]

const ACTIVITIES_DATA = [
  {
    title: 'Cours de Coran pour Adultes',
    description: 'Apprentissage de la lecture et mémorisation du Coran pour adultes débutants et intermédiaires.',
    category: 'coran',
    schedule: 'Samedi 10h-12h',
    price: 30,
    paymentType: 'SUBSCRIPTION',
    maxParticipants: 25,
    active: true,
    enrollmentOpen: true,
    requiresApproval: false,
    instructorName: 'Sheikh Mohamed',
    level: 'Tous niveaux',
  },
  {
    title: 'Cours d\'Arabe pour Enfants',
    description: 'Initiation à la langue arabe pour les enfants de 6 à 12 ans.',
    category: 'arabe',
    schedule: 'Mercredi 14h-16h, Samedi 14h-16h',
    price: 40,
    paymentType: 'SUBSCRIPTION',
    maxParticipants: 20,
    active: true,
    enrollmentOpen: true,
    requiresApproval: false,
    instructorName: 'Mme Fatima',
    level: 'Débutant',
    ageGroup: '6-12 ans',
  },
  {
    title: 'École du Dimanche',
    description: 'Éducation islamique complète pour les enfants: Coran, arabe, histoire islamique et bonnes manières.',
    category: 'ecole',
    schedule: 'Dimanche 9h-12h',
    price: 50,
    paymentType: 'SUBSCRIPTION',
    maxParticipants: 40,
    active: true,
    enrollmentOpen: true,
    requiresApproval: false,
    instructorName: 'Équipe pédagogique',
    level: 'Tous niveaux',
    ageGroup: '5-15 ans',
  },
  {
    title: 'Cercle d\'Étude Féminin',
    description: 'Séances d\'étude et de discussion pour les femmes sur différents sujets islamiques.',
    category: 'halaqat',
    schedule: 'Jeudi 10h-12h',
    price: 0,
    paymentType: 'FREE',
    maxParticipants: 30,
    active: true,
    enrollmentOpen: true,
    requiresApproval: false,
    instructorName: 'Sœur Aisha',
  },
  {
    title: 'Cours de Tajweed Avancé',
    description: 'Perfectionnement des règles de Tajweed pour une récitation parfaite du Coran.',
    category: 'tajweed',
    schedule: 'Vendredi 18h-20h',
    price: 35,
    paymentType: 'SUBSCRIPTION',
    maxParticipants: 15,
    active: true,
    enrollmentOpen: true,
    requiresApproval: true,
    instructorName: 'Sheikh Ahmed',
    level: 'Avancé',
  },
  {
    title: 'Programme de Mémorisation (Hifz)',
    description: 'Programme intensif de mémorisation du Coran avec suivi personnalisé.',
    category: 'hifz',
    schedule: 'Tous les jours 7h-9h',
    price: 100,
    paymentType: 'SUBSCRIPTION',
    maxParticipants: 10,
    active: true,
    enrollmentOpen: false,
    requiresApproval: true,
    instructorName: 'Hafiz Youssef',
    level: 'Intermédiaire/Avancé',
  },
  {
    title: 'Cours d\'Arabe pour Adultes',
    description: 'Apprentissage de la langue arabe moderne standard pour adultes.',
    category: 'arabe',
    schedule: 'Lundi et Mercredi 19h-21h',
    price: 45,
    paymentType: 'SUBSCRIPTION',
    maxParticipants: 20,
    active: true,
    enrollmentOpen: true,
    requiresApproval: false,
    instructorName: 'M. Hassan',
    level: 'Débutant à Intermédiaire',
  },
]

const PROJECTS_DATA = [
  {
    title: 'Rénovation de la Mosquée',
    slug: 'renovation-mosquee',
    description: 'Travaux de rénovation et d\'embellissement de notre lieu de culte.',
    goalAmount: 50000,
    currentAmount: 35000,
    active: true,
    priority: 1,
  },
  {
    title: 'Bibliothèque Islamique',
    slug: 'bibliotheque-islamique',
    description: 'Création d\'une bibliothèque avec des ouvrages islamiques en français, arabe et autres langues.',
    goalAmount: 10000,
    currentAmount: 4500,
    active: true,
    priority: 2,
  },
  {
    title: 'Aide aux Familles Démunies',
    slug: 'aide-familles',
    description: 'Fonds permanent pour soutenir les familles de notre communauté dans le besoin.',
    goalAmount: 20000,
    currentAmount: 12000,
    active: true,
    priority: 1,
  },
  {
    title: 'Équipement Scolaire',
    slug: 'equipement-scolaire',
    description: 'Matériel pédagogique pour l\'école du dimanche et les cours de langue.',
    goalAmount: 5000,
    currentAmount: 3200,
    active: true,
    priority: 3,
  },
  {
    title: 'Fonds Zakat',
    slug: 'fonds-zakat',
    description: 'Distribution de la Zakat aux personnes éligibles de notre communauté.',
    goalAmount: 30000,
    currentAmount: 18000,
    active: true,
    priority: 2,
  },
]

const TEAM_MEMBERS_DATA = [
  {
    name: 'Sheikh Mohamed Al-Amin',
    role: 'Imam Principal',
    bio: 'Diplômé de l\'Université Al-Azhar, le Sheikh Mohamed guide notre communauté depuis 10 ans.',
    email: 'imam@mosquee.ch',
    phone: '+41 32 123 45 67',
    active: true,
    displayOrder: 1,
  },
  {
    name: 'Ahmed Benali',
    role: 'Président de l\'Association',
    bio: 'Fondateur et président de l\'association, Ahmed œuvre pour le bien de la communauté depuis 2005.',
    email: 'president@mosquee.ch',
    active: true,
    displayOrder: 2,
  },
  {
    name: 'Fatima Zahra',
    role: 'Responsable Éducation',
    bio: 'Enseignante passionnée, Fatima coordonne tous les programmes éducatifs de la mosquée.',
    email: 'education@mosquee.ch',
    active: true,
    displayOrder: 3,
  },
  {
    name: 'Youssef Ibrahim',
    role: 'Trésorier',
    bio: 'Expert-comptable de formation, Youssef gère les finances de l\'association avec transparence.',
    email: 'tresorier@mosquee.ch',
    active: true,
    displayOrder: 4,
  },
  {
    name: 'Khadija Mansour',
    role: 'Responsable Section Féminine',
    bio: 'Khadija organise les activités et cercles d\'étude pour les femmes de la communauté.',
    email: 'femmes@mosquee.ch',
    active: true,
    displayOrder: 5,
  },
  {
    name: 'Omar Hassan',
    role: 'Responsable Jeunesse',
    bio: 'Omar anime les programmes pour les jeunes et organise des activités sportives et culturelles.',
    email: 'jeunesse@mosquee.ch',
    active: true,
    displayOrder: 6,
  },
]

const MEMBERS_DATA = [
  { firstName: 'Ahmed', lastName: 'Demo', email: 'ahmed' + DEMO_SUFFIX, password: 'Demo2024!' },
  { firstName: 'Fatima', lastName: 'Demo', email: 'fatima' + DEMO_SUFFIX, password: 'Demo2024!' },
  { firstName: 'Mohamed', lastName: 'Demo', email: 'mohamed' + DEMO_SUFFIX, password: 'Demo2024!' },
  { firstName: 'Aisha', lastName: 'Demo', email: 'aisha' + DEMO_SUFFIX, password: 'Demo2024!' },
  { firstName: 'Omar', lastName: 'Demo', email: 'omar' + DEMO_SUFFIX, password: 'Demo2024!' },
]

const DONATION_TYPES = ['ZAKAT', 'SADAQA', 'PROJECT'] as const

// ============================================================================
// FONCTIONS DE CRÉATION
// ============================================================================

async function cleanDemoData() {
  log('🧹', 'Nettoyage des données demo existantes...')

  // Supprimer les utilisateurs demo (cascade sur les inscriptions, dons, etc.)
  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { contains: DEMO_SUFFIX } },
  })
  log('  ', `${deletedUsers.count} utilisateur(s) demo supprimé(s)`)

  // Supprimer les événements demo
  const deletedEvents = await prisma.event.deleteMany({
    where: { slug: { contains: 'demo' } },
  })
  log('  ', `${deletedEvents.count} événement(s) demo supprimé(s)`)

  // Supprimer les activités demo
  const deletedActivities = await prisma.activity.deleteMany({
    where: { slug: { contains: 'demo' } },
  })
  log('  ', `${deletedActivities.count} activité(s) demo supprimé(s)`)

  // Supprimer les projets demo
  const deletedProjects = await prisma.project.deleteMany({
    where: { slug: { contains: 'demo' } },
  })
  log('  ', `${deletedProjects.count} projet(s) demo supprimé(s)`)

  // Supprimer les membres d'équipe demo
  const deletedTeam = await prisma.teamMember.deleteMany({
    where: { email: { contains: 'demo' } },
  })
  log('  ', `${deletedTeam.count} membre(s) d'équipe demo supprimé(s)`)

  // Supprimer les dons demo
  const deletedDonations = await prisma.donation.deleteMany({
    where: { email: { contains: DEMO_SUFFIX } },
  })
  log('  ', `${deletedDonations.count} don(s) demo supprimé(s)`)
}

async function createEventsDemo(): Promise<Array<{ id: string; title: string }>> {
  log('📅', 'Création des événements demo...')
  const created: Array<{ id: string; title: string }> = []

  for (const eventData of EVENTS_DATA) {
    try {
      const slug = generateSlug(eventData.title) + '-demo'
      const event = await createEvent({
        title: eventData.title,
        slug,
        description: eventData.description,
        category: eventData.category,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        location: eventData.location,
        price: eventData.price,
        paymentType: eventData.paymentType,
        maxCapacity: eventData.maxCapacity,
        published: eventData.published,
        featured: eventData.featured,
        registrationRequired: eventData.registrationRequired,
        requiresApproval: eventData.requiresApproval,
      })
      created.push({ id: event.id, title: event.title })
      log('  ✅', `Événement: ${event.title}`)
    } catch (error) {
      log('  ❌', `Erreur événement ${eventData.title}: ${error}`)
    }
  }

  return created
}

async function createActivitiesDemo(): Promise<Array<{ id: string; title: string }>> {
  log('📚', 'Création des activités demo...')
  const created: Array<{ id: string; title: string }> = []

  for (const activityData of ACTIVITIES_DATA) {
    try {
      const slug = generateSlug(activityData.title) + '-demo'
      const activity = await createActivity({
        title: activityData.title,
        slug,
        description: activityData.description,
        category: activityData.category,
        schedule: activityData.schedule,
        price: activityData.price,
        paymentType: activityData.paymentType,
        maxParticipants: activityData.maxParticipants,
        active: activityData.active,
        enrollmentOpen: activityData.enrollmentOpen,
        requiresApproval: activityData.requiresApproval,
        instructorName: activityData.instructorName,
        level: activityData.level,
        ageGroup: activityData.ageGroup,
      })
      created.push({ id: activity.id, title: activity.title })
      log('  ✅', `Activité: ${activity.title}`)
    } catch (error) {
      log('  ❌', `Erreur activité ${activityData.title}: ${error}`)
    }
  }

  return created
}

async function createProjectsDemo(): Promise<Array<{ id: string; title: string }>> {
  log('💰', 'Création des projets demo...')
  const created: Array<{ id: string; title: string }> = []

  for (const projectData of PROJECTS_DATA) {
    try {
      const slug = projectData.slug + '-demo'
      const project = await createProject({
        title: projectData.title,
        slug,
        description: projectData.description,
        goalAmount: projectData.goalAmount,
        currentAmount: projectData.currentAmount,
        active: projectData.active,
        featured: projectData.featured,
        priority: projectData.priority,
      })
      created.push({ id: project.id, title: project.title })
      log('  ✅', `Projet: ${project.title}`)
    } catch (error) {
      log('  ❌', `Erreur projet ${projectData.title}: ${error}`)
    }
  }

  return created
}

async function createTeamDemo() {
  log('👥', 'Création des membres d\'équipe demo...')
  let count = 0

  for (const memberData of TEAM_MEMBERS_DATA) {
    try {
      // Ajouter -demo à l'email pour identifier les données demo
      const email = memberData.email?.replace('@', '-demo@')
      await createTeamMember({
        name: memberData.name,
        role: memberData.role,
        bio: memberData.bio,
        email,
        phone: memberData.phone,
        active: memberData.active,
        displayOrder: memberData.displayOrder,
      })
      count++
      log('  ✅', `Membre: ${memberData.name}`)
    } catch (error) {
      log('  ❌', `Erreur membre ${memberData.name}: ${error}`)
    }
  }

  return count
}

async function createMembersViaAPI(): Promise<Array<{ id: string; email: string; firstName: string; lastName: string }>> {
  log('👤', 'Création des utilisateurs demo via API...')
  const created: Array<{ id: string; email: string; firstName: string; lastName: string }> = []

  for (const member of MEMBERS_DATA) {
    const result = await apiCall('/api/auth/register', member)

    if (result.ok && result.data) {
      const userData = result.data as { user: { id: string } }
      created.push({
        id: userData.user.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      log('  ✅', `Utilisateur: ${member.firstName} ${member.lastName} (${member.email})`)
    } else {
      log('  ❌', `Erreur utilisateur ${member.email}: ${result.error}`)
    }

    await delay(API_DELAY)
  }

  return created
}

async function createEventRegistrationsViaAPI(
  events: Array<{ id: string; title: string }>,
  members: Array<{ email: string; firstName: string; lastName: string }>
) {
  log('🎫', 'Création des inscriptions événements via API...')
  let count = 0

  for (const event of events.slice(0, 3)) {
    // Prendre les 3 premiers événements
    const selectedMembers = members.slice(0, 3) // 3 membres par événement

    for (const member of selectedMembers) {
      const result = await apiCall('/api/event-registrations', {
        eventId: event.id,
        eventTitle: event.title,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: '+41791234567',
        attendees: Math.floor(Math.random() * 3) + 1,
        notes: 'Inscription demo automatique',
      })

      if (result.ok) {
        count++
        log('  ✅', `Inscription: ${member.firstName} → ${event.title}`)
      } else {
        log('  ❌', `Erreur inscription ${member.firstName} → ${event.title}: ${result.error}`)
      }

      await delay(API_DELAY)
    }
  }

  return count
}

async function createEnrollmentsViaAPI(
  activities: Array<{ id: string; title: string }>,
  members: Array<{ email: string; firstName: string; lastName: string }>
) {
  log('📝', 'Création des inscriptions activités via API...')
  let count = 0

  for (let i = 0; i < Math.min(activities.length, members.length); i++) {
    const activity = activities[i]
    const member = members[i]

    const result = await apiCall('/api/enrollments', {
      activityId: activity.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: '+41791234567',
      isForChild: false,
      notes: 'Inscription demo automatique',
    })

    if (result.ok) {
      count++
      log('  ✅', `Inscription: ${member.firstName} → ${activity.title}`)
    } else {
      log('  ❌', `Erreur inscription ${member.firstName} → ${activity.title}: ${result.error}`)
    }

    await delay(API_DELAY)
  }

  return count
}

async function createDonationsViaAPI(
  projects: Array<{ id: string; title: string }>
) {
  log('💳', 'Création des dons demo via API...')
  log('  ', '(Rate limit: 5 dons/minute - délai de 13s entre chaque don)')
  let count = 0

  // Limite à 5 dons pour respecter le rate limiting (5/minute)
  const maxDonations = 5

  for (let i = 0; i < maxDonations; i++) {
    const donationType = DONATION_TYPES[i % DONATION_TYPES.length]
    const project = projects.length > 0 && i % 2 === 1 ? projects[i % projects.length] : null
    const amount = Math.floor(Math.random() * 180) + 20 // 20-200 CHF

    const result = await apiCall('/api/donations', {
      firstName: `Donateur${i + 1}`,
      lastName: 'Demo',
      email: `donateur${i + 1}${DEMO_SUFFIX}`,
      amount,
      type: donationType,
      projectId: project?.id,
      projectName: project?.title,
      anonymous: i === 0,
      message: i % 2 === 0 ? 'Qu\'Allah accepte ce don.' : undefined,
    })

    if (result.ok) {
      count++
      log('  ✅', `Don: ${amount} CHF (${donationType})${project ? ` pour ${project.title}` : ''}`)
    } else {
      log('  ❌', `Erreur don ${i + 1}: ${result.error}`)
    }

    // Délai de 13 secondes entre chaque don pour respecter le rate limit (5/min = 12s)
    if (i < maxDonations - 1) {
      await delay(13000)
    }
  }

  return count
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 CRÉATION DE DONNÉES DEMO VIA WORKFLOWS STANDARD')
  console.log('='.repeat(60))
  console.log(`\n📍 Base URL: ${BASE_URL}\n`)

  // Vérifier que le serveur tourne
  try {
    const res = await fetch(`${BASE_URL}/api/prayer-times`)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    log('✅', 'Serveur Next.js accessible\n')
  } catch (error) {
    log('❌', `Serveur inaccessible sur ${BASE_URL}`)
    log('  ', 'Lancez d\'abord: npm run dev')
    process.exit(1)
  }

  // Phase 1: Nettoyage
  console.log('\n' + '-'.repeat(60))
  await cleanDemoData()

  // Phase 2: Création du contenu (via lib/content directement)
  console.log('\n' + '-'.repeat(60))
  const events = await createEventsDemo()
  const activities = await createActivitiesDemo()
  const projects = await createProjectsDemo()
  const teamCount = await createTeamDemo()

  // Phase 3: Création des utilisateurs (via API)
  console.log('\n' + '-'.repeat(60))
  const members = await createMembersViaAPI()

  // Phase 4: Inscriptions événements (via API)
  console.log('\n' + '-'.repeat(60))
  const eventRegCount = await createEventRegistrationsViaAPI(events, members)

  // Phase 5: Inscriptions activités (via API)
  console.log('\n' + '-'.repeat(60))
  const enrollmentCount = await createEnrollmentsViaAPI(activities, members)

  // Phase 6: Dons (via API)
  console.log('\n' + '-'.repeat(60))
  const donationCount = await createDonationsViaAPI(projects)

  // Rapport final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RAPPORT FINAL')
  console.log('='.repeat(60))
  console.log(`
  ✅ ${events.length} événements créés (lib/content)
  ✅ ${activities.length} activités créées (lib/content)
  ✅ ${projects.length} projets créés (lib/content)
  ✅ ${teamCount} membres d'équipe créés (lib/content)
  ✅ ${members.length} utilisateurs créés (API /api/auth/register)
  ✅ ${eventRegCount} inscriptions événements (API /api/event-registrations)
  ✅ ${enrollmentCount} inscriptions activités (API /api/enrollments)
  ✅ ${donationCount} dons créés (API /api/donations)
  `)
  console.log('='.repeat(60))
  console.log('✨ Données demo créées avec succès!')
  console.log('='.repeat(60) + '\n')

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  prisma.$disconnect()
  process.exit(1)
})
