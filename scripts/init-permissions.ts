import { PrismaClient, UserRole, AdminPermission } from '@prisma/client'

const prisma = new PrismaClient()

// Permissions par défaut pour chaque rôle
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
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

async function initializePermissions() {
  console.log('🔧 Initialisation des permissions par défaut...\n')

  for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    if (role === 'ADMIN') {
      console.log(`⚠️  ${role}: Les admins ont toujours toutes les permissions (non stocké en DB)`)
      continue
    }

    if (permissions.length === 0) {
      console.log(`ℹ️  ${role}: Aucune permission (pas d'accès admin)`)
      continue
    }

    // Vérifier si des permissions existent déjà
    const existingCount = await prisma.rolePermission.count({
      where: { role: role as UserRole },
    })

    if (existingCount > 0) {
      console.log(`✓ ${role}: ${existingCount} permissions déjà configurées`)
      continue
    }

    // Créer les permissions
    await prisma.rolePermission.createMany({
      data: permissions.map(permission => ({
        role: role as UserRole,
        permission,
      })),
    })

    console.log(`✅ ${role}: ${permissions.length} permissions créées`)
  }

  console.log('\n✨ Initialisation terminée!')
}

async function showCurrentPermissions() {
  console.log('\n📋 Permissions actuelles par rôle:\n')

  const roles = ['IMAM', 'TEACHER', 'STAFF', 'MANAGER'] as UserRole[]

  for (const role of roles) {
    const permissions = await prisma.rolePermission.findMany({
      where: { role },
      select: { permission: true },
    })

    if (permissions.length === 0) {
      console.log(`${role}: (utilise les permissions par défaut)`)
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || []
      defaultPerms.forEach(p => console.log(`  - ${p}`))
    } else {
      console.log(`${role}: ${permissions.length} permissions`)
      permissions.forEach(p => console.log(`  - ${p.permission}`))
    }
    console.log('')
  }
}

async function main() {
  try {
    await initializePermissions()
    await showCurrentPermissions()
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
