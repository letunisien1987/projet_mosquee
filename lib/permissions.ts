import { AdminPermission, UserRole } from '@prisma/client'
import { prisma } from './prisma'

// Permissions par défaut pour chaque rôle
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  ADMIN: [
    // Accès complet
    'ADMIN_ACCESS',
    // Membres
    'VIEW_MEMBERS',
    'MANAGE_MEMBERS',
    'MANAGE_ROLES',
    // Événements
    'VIEW_EVENTS',
    'MANAGE_EVENTS',
    'VIEW_EVENT_REGISTRATIONS',
    'MANAGE_EVENT_REGISTRATIONS',
    // Activités
    'VIEW_ACTIVITIES',
    'MANAGE_ACTIVITIES',
    'VIEW_ENROLLMENTS',
    'MANAGE_ENROLLMENTS',
    // Financier
    'VIEW_DONATIONS',
    'MANAGE_DONATIONS',
    'VIEW_MEMBERSHIPS',
    'MANAGE_MEMBERSHIPS',
    // Communication
    'VIEW_MESSAGES',
    'MANAGE_MESSAGES',
    'VIEW_SERVICES',
    'MANAGE_SERVICES',
    // Configuration
    'VIEW_PRAYER_TIMES',
    'MANAGE_PRAYER_TIMES',
    'VIEW_SETTINGS',
    'MANAGE_SETTINGS',
  ],
  IMAM: [
    // Événements
    'VIEW_EVENTS',
    'MANAGE_EVENTS',
    'VIEW_EVENT_REGISTRATIONS',
    // Activités
    'VIEW_ACTIVITIES',
    'VIEW_ENROLLMENTS',
    // Communication
    'VIEW_MESSAGES',
    'VIEW_SERVICES',
    // Horaires
    'VIEW_PRAYER_TIMES',
    'MANAGE_PRAYER_TIMES',
  ],
  TEACHER: [
    // Activités uniquement
    'VIEW_ACTIVITIES',
    'VIEW_ENROLLMENTS',
  ],
  STAFF: [
    // Événements
    'VIEW_EVENTS',
    'VIEW_EVENT_REGISTRATIONS',
    'MANAGE_EVENT_REGISTRATIONS',
    // Activités
    'VIEW_ACTIVITIES',
    'VIEW_ENROLLMENTS',
    'MANAGE_ENROLLMENTS',
    // Communication
    'VIEW_MESSAGES',
    'MANAGE_MESSAGES',
    'VIEW_SERVICES',
    'MANAGE_SERVICES',
    // Membres (lecture seule)
    'VIEW_MEMBERS',
  ],
  MANAGER: [
    // Événements
    'VIEW_EVENTS',
    'MANAGE_EVENTS',
    'VIEW_EVENT_REGISTRATIONS',
    'MANAGE_EVENT_REGISTRATIONS',
    // Activités
    'VIEW_ACTIVITIES',
    'MANAGE_ACTIVITIES',
    'VIEW_ENROLLMENTS',
    'MANAGE_ENROLLMENTS',
  ],
  MEMBER: [
    // Aucun accès admin par défaut
  ],
}

// Catégories de permissions pour l'affichage dans l'interface
export const PERMISSION_CATEGORIES = {
  members: {
    label: 'Membres',
    permissions: ['VIEW_MEMBERS', 'MANAGE_MEMBERS', 'MANAGE_ROLES'],
  },
  events: {
    label: 'Événements',
    permissions: ['VIEW_EVENTS', 'MANAGE_EVENTS', 'VIEW_EVENT_REGISTRATIONS', 'MANAGE_EVENT_REGISTRATIONS'],
  },
  activities: {
    label: 'Activités',
    permissions: ['VIEW_ACTIVITIES', 'MANAGE_ACTIVITIES', 'VIEW_ENROLLMENTS', 'MANAGE_ENROLLMENTS'],
  },
  finance: {
    label: 'Finances',
    permissions: ['VIEW_DONATIONS', 'MANAGE_DONATIONS', 'VIEW_MEMBERSHIPS', 'MANAGE_MEMBERSHIPS'],
  },
  communication: {
    label: 'Communication',
    permissions: ['VIEW_MESSAGES', 'MANAGE_MESSAGES', 'VIEW_SERVICES', 'MANAGE_SERVICES'],
  },
  settings: {
    label: 'Configuration',
    permissions: ['VIEW_PRAYER_TIMES', 'MANAGE_PRAYER_TIMES', 'VIEW_SETTINGS', 'MANAGE_SETTINGS'],
  },
  admin: {
    label: 'Administration',
    permissions: ['ADMIN_ACCESS'],
  },
}

// Labels français pour les permissions
export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  VIEW_MEMBERS: 'Voir les membres',
  MANAGE_MEMBERS: 'Gérer les membres',
  MANAGE_ROLES: 'Gérer les rôles',
  VIEW_EVENTS: 'Voir les événements',
  MANAGE_EVENTS: 'Gérer les événements',
  VIEW_EVENT_REGISTRATIONS: 'Voir les inscriptions événements',
  MANAGE_EVENT_REGISTRATIONS: 'Gérer les inscriptions événements',
  VIEW_ACTIVITIES: 'Voir les activités',
  MANAGE_ACTIVITIES: 'Gérer les activités',
  VIEW_ENROLLMENTS: 'Voir les inscriptions activités',
  MANAGE_ENROLLMENTS: 'Gérer les inscriptions activités',
  VIEW_DONATIONS: 'Voir les dons',
  MANAGE_DONATIONS: 'Gérer les dons',
  VIEW_MEMBERSHIPS: 'Voir les cotisations',
  MANAGE_MEMBERSHIPS: 'Gérer les cotisations',
  VIEW_MESSAGES: 'Voir les messages',
  MANAGE_MESSAGES: 'Gérer les messages',
  VIEW_SERVICES: 'Voir les services',
  MANAGE_SERVICES: 'Gérer les services',
  VIEW_PRAYER_TIMES: 'Voir les horaires',
  MANAGE_PRAYER_TIMES: 'Gérer les horaires',
  VIEW_SETTINGS: 'Voir les paramètres',
  MANAGE_SETTINGS: 'Gérer les paramètres',
  ADMIN_ACCESS: 'Accès administrateur complet',
}

// Labels français pour les rôles
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  IMAM: 'Imam',
  TEACHER: 'Enseignant',
  STAFF: 'Personnel',
  MANAGER: 'Gestionnaire',
  MEMBER: 'Membre',
}

// Vérifier si un rôle a une permission
export async function hasPermission(role: UserRole, permission: AdminPermission): Promise<boolean> {
  // L'admin a toujours toutes les permissions
  if (role === 'ADMIN') {
    return true
  }

  // Vérifier dans la base de données
  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      role_permission: {
        role,
        permission,
      },
    },
  })

  // Si pas de configuration personnalisée, utiliser les permissions par défaut
  if (rolePermission === null) {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role },
    })

    // Si aucune permission n'est configurée pour ce rôle, utiliser les valeurs par défaut
    if (rolePermissions.length === 0) {
      return DEFAULT_ROLE_PERMISSIONS[role]?.includes(permission) || false
    }

    return false
  }

  return true
}

// Obtenir toutes les permissions d'un rôle
export async function getRolePermissions(role: UserRole): Promise<AdminPermission[]> {
  // L'admin a toujours toutes les permissions
  if (role === 'ADMIN') {
    return Object.values(AdminPermission) as AdminPermission[]
  }

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role },
    select: { permission: true },
  })

  // Si aucune permission n'est configurée, utiliser les valeurs par défaut
  if (rolePermissions.length === 0) {
    return DEFAULT_ROLE_PERMISSIONS[role] || []
  }

  return rolePermissions.map(rp => rp.permission)
}

// Définir les permissions d'un rôle
export async function setRolePermissions(role: UserRole, permissions: AdminPermission[]): Promise<void> {
  // On ne peut pas modifier les permissions de l'admin
  if (role === 'ADMIN') {
    throw new Error('Les permissions de l\'administrateur ne peuvent pas être modifiées')
  }

  // Supprimer toutes les permissions existantes pour ce rôle
  await prisma.rolePermission.deleteMany({
    where: { role },
  })

  // Ajouter les nouvelles permissions
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map(permission => ({
        role,
        permission,
      })),
    })
  }
}

// Initialiser les permissions par défaut pour tous les rôles
export async function initializeDefaultPermissions(): Promise<void> {
  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (role === 'ADMIN') continue // Skip admin, ils ont tout

    // Vérifier si des permissions existent déjà
    const existingCount = await prisma.rolePermission.count({
      where: { role: role as UserRole },
    })

    // Ne créer que si aucune permission n'existe
    if (existingCount === 0 && permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map(permission => ({
          role: role as UserRole,
          permission,
        })),
      })
    }
  }
}

// Mapping des routes admin vers les permissions requises
export const ROUTE_PERMISSIONS: Record<string, AdminPermission[]> = {
  '/admin': [], // Dashboard accessible à tous les rôles avec accès admin
  '/admin/membres': ['VIEW_MEMBERS'],
  '/admin/membres/nouveau': ['MANAGE_MEMBERS'],
  '/admin/evenements': ['VIEW_EVENTS'],
  '/admin/evenements-gestion': ['VIEW_EVENTS', 'VIEW_EVENT_REGISTRATIONS'],
  '/admin/activites': ['VIEW_ACTIVITIES'],
  '/admin/activites-gestion': ['VIEW_ACTIVITIES', 'VIEW_ENROLLMENTS'],
  '/admin/inscriptions': ['VIEW_ENROLLMENTS'],
  '/admin/demandes-adhesion': ['VIEW_MEMBERSHIPS'],
  '/admin/dons': ['VIEW_DONATIONS'],
  '/admin/cotisations': ['VIEW_MEMBERSHIPS'],
  '/admin/messages': ['VIEW_MESSAGES'],
  '/admin/services': ['VIEW_SERVICES'],
  '/admin/horaires': ['VIEW_PRAYER_TIMES'],
  '/admin/jumua': ['VIEW_PRAYER_TIMES'],
  '/admin/parametres': ['VIEW_SETTINGS'],
  '/admin/roles': ['MANAGE_ROLES'],
}

// Vérifier si un rôle peut accéder à une route
export async function canAccessRoute(role: UserRole, path: string): Promise<boolean> {
  // L'admin a accès à tout
  if (role === 'ADMIN') {
    return true
  }

  // Trouver la route correspondante (supporte les routes dynamiques)
  let matchedRoute = path
  for (const route of Object.keys(ROUTE_PERMISSIONS)) {
    if (path.startsWith(route)) {
      matchedRoute = route
      break
    }
  }

  const requiredPermissions = ROUTE_PERMISSIONS[matchedRoute]

  // Si pas de permissions définies, vérifier si le rôle a un accès admin de base
  if (!requiredPermissions || requiredPermissions.length === 0) {
    // Vérifier que le rôle a au moins une permission (donc accès admin)
    const permissions = await getRolePermissions(role)
    return permissions.length > 0
  }

  // Vérifier chaque permission requise
  for (const permission of requiredPermissions) {
    const has = await hasPermission(role, permission)
    if (!has) {
      return false
    }
  }

  return true
}

// Obtenir les routes accessibles pour un rôle
export async function getAccessibleRoutes(role: UserRole): Promise<string[]> {
  if (role === 'ADMIN') {
    return Object.keys(ROUTE_PERMISSIONS)
  }

  const permissions = await getRolePermissions(role)
  const accessibleRoutes: string[] = []

  for (const [route, requiredPerms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (requiredPerms.length === 0 || requiredPerms.every(p => permissions.includes(p))) {
      accessibleRoutes.push(route)
    }
  }

  return accessibleRoutes
}
