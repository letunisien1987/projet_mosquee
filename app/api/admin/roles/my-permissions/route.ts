import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import {
  getRolePermissions,
  getAccessibleRoutes,
  ROLE_LABELS,
} from '@/lib/permissions'

// GET - Obtenir les permissions de l'utilisateur connecté
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const role = session.user.role as UserRole

    // Vérifier si le rôle a accès à l'admin
    const permissions = await getRolePermissions(role)
    const accessibleRoutes = await getAccessibleRoutes(role)

    // Si l'utilisateur n'a aucune permission, il n'a pas accès à l'admin
    const hasAdminAccess = role === 'ADMIN' || permissions.length > 0

    return NextResponse.json({
      role,
      roleLabel: ROLE_LABELS[role],
      permissions,
      accessibleRoutes,
      hasAdminAccess,
      isAdmin: role === 'ADMIN',
    })
  } catch (error) {
    console.error('Erreur GET /api/admin/roles/my-permissions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
