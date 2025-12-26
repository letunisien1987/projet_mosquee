import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminPermission, UserRole } from '@prisma/client'
import {
  getRolePermissions,
  setRolePermissions,
  ROLE_LABELS,
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
  DEFAULT_ROLE_PERMISSIONS,
  initializeDefaultPermissions,
} from '@/lib/permissions'

// GET - Obtenir tous les rôles et leurs permissions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Initialiser les permissions par défaut si nécessaire
    await initializeDefaultPermissions()

    // Obtenir les permissions pour chaque rôle (sauf MEMBER)
    const roles = ['ADMIN', 'IMAM', 'TEACHER', 'STAFF', 'MANAGER', 'TRESORIER'] as UserRole[]
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => ({
        role,
        label: ROLE_LABELS[role],
        permissions: await getRolePermissions(role),
        isProtected: role === 'ADMIN', // L'admin ne peut pas être modifié
      }))
    )

    // Retourner aussi les métadonnées des permissions
    return NextResponse.json({
      roles: rolesWithPermissions,
      permissionLabels: PERMISSION_LABELS,
      permissionCategories: PERMISSION_CATEGORIES,
      allPermissions: Object.values(AdminPermission),
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/roles:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les permissions d'un rôle
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { role, permissions } = body as {
      role: UserRole
      permissions: AdminPermission[]
    }

    // Validation
    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    // On ne peut pas modifier les permissions de l'admin
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Les permissions de l\'administrateur ne peuvent pas être modifiées' },
        { status: 403 }
      )
    }

    // Vérifier que le rôle existe
    if (!Object.keys(ROLE_LABELS).includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      )
    }

    // Vérifier que toutes les permissions sont valides
    const allPermissions = Object.values(AdminPermission)
    for (const perm of permissions) {
      if (!allPermissions.includes(perm)) {
        return NextResponse.json(
          { error: `Permission invalide: ${perm}` },
          { status: 400 }
        )
      }
    }

    // Mettre à jour les permissions
    await setRolePermissions(role, permissions)

    return NextResponse.json({
      success: true,
      message: `Permissions du rôle ${ROLE_LABELS[role]} mises à jour`,
    })
  } catch (error) {
    console.error('Erreur PUT /api/admin/roles:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Réinitialiser les permissions d'un rôle aux valeurs par défaut
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body as { role: UserRole }

    // Validation
    if (!role) {
      return NextResponse.json(
        { error: 'Rôle requis' },
        { status: 400 }
      )
    }

    // On ne peut pas modifier les permissions de l'admin
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Les permissions de l\'administrateur ne peuvent pas être modifiées' },
        { status: 403 }
      )
    }

    // Réinitialiser aux valeurs par défaut
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || []
    await setRolePermissions(role, defaultPerms)

    return NextResponse.json({
      success: true,
      message: `Permissions du rôle ${ROLE_LABELS[role]} réinitialisées`,
      permissions: defaultPerms,
    })
  } catch (error) {
    console.error('Erreur POST /api/admin/roles:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
