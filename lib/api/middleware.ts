import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { AdminPermission, UserRole } from '@prisma/client'

/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Session type with user info
 */
export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
  }
}

/**
 * Require authentication - throws ApiError if not authenticated
 * @returns The authenticated session
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new ApiError('Non authentifié', 401, 'UNAUTHENTICATED')
  }

  return session as AuthSession
}

/**
 * Require specific roles - throws ApiError if role not allowed
 * @param allowedRoles - Array of allowed roles
 * @returns The authenticated session
 */
export async function requireRoles(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.user.role)) {
    throw new ApiError('Accès non autorisé pour ce rôle', 403, 'FORBIDDEN_ROLE')
  }

  return session
}

/**
 * Require specific permission - throws ApiError if permission not granted
 * @param permission - The required permission
 * @returns The authenticated session
 */
export async function requirePermission(permission: AdminPermission): Promise<AuthSession> {
  const session = await requireAuth()

  const can = await hasPermission(session.user.role, permission)
  if (!can) {
    throw new ApiError(
      `Permission requise: ${permission}`,
      403,
      'FORBIDDEN_PERMISSION'
    )
  }

  return session
}

/**
 * Require any of the specified permissions
 * @param permissions - Array of permissions (user needs at least one)
 * @returns The authenticated session
 */
export async function requireAnyPermission(permissions: AdminPermission[]): Promise<AuthSession> {
  const session = await requireAuth()

  for (const permission of permissions) {
    const can = await hasPermission(session.user.role, permission)
    if (can) {
      return session
    }
  }

  throw new ApiError(
    `Une des permissions requise: ${permissions.join(', ')}`,
    403,
    'FORBIDDEN_PERMISSION'
  )
}

/**
 * Require all of the specified permissions
 * @param permissions - Array of permissions (user needs all)
 * @returns The authenticated session
 */
export async function requireAllPermissions(permissions: AdminPermission[]): Promise<AuthSession> {
  const session = await requireAuth()

  for (const permission of permissions) {
    const can = await hasPermission(session.user.role, permission)
    if (!can) {
      throw new ApiError(
        `Permission requise: ${permission}`,
        403,
        'FORBIDDEN_PERMISSION'
      )
    }
  }

  return session
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  code?: string
  message?: string
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string
): Response {
  return Response.json(
    { error: message, code },
    { status }
  )
}

/**
 * Handler type for API routes
 */
type ApiHandler = (
  req: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Wrap an API handler with error handling
 * Catches ApiError and other errors, returns consistent responses
 *
 * @example
 * export const GET = apiHandler(async (req) => {
 *   const session = await requirePermission('VIEW_MEMBERS')
 *   const data = await fetchData()
 *   return successResponse(data)
 * })
 */
export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(req, context)
    } catch (error) {
      // Handle known API errors
      if (error instanceof ApiError) {
        console.error(`[API Error ${error.status}]`, error.message)
        return errorResponse(error.message, error.status, error.code)
      }

      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        console.error('[Validation Error]', error.message)
        return errorResponse('Données invalides', 400, 'VALIDATION_ERROR')
      }

      // Handle unknown errors
      console.error('[API Error 500]', error)
      return errorResponse('Erreur serveur', 500, 'INTERNAL_ERROR')
    }
  }
}

/**
 * Common admin roles that can access admin panel
 */
export const ADMIN_ROLES: UserRole[] = ['ADMIN', 'IMAM', 'STAFF', 'MANAGER', 'TEACHER']

/**
 * Full admin roles (not including TEACHER and MANAGER)
 */
export const FULL_ADMIN_ROLES: UserRole[] = ['ADMIN', 'IMAM', 'STAFF']

/**
 * Check if user is the owner of a resource
 * @param resourceOwnerId - The owner ID of the resource
 * @param userId - The current user ID
 * @throws ApiError if not the owner
 */
export function requireOwnership(resourceOwnerId: string | null, userId: string): void {
  if (resourceOwnerId !== userId) {
    throw new ApiError('Accès non autorisé à cette ressource', 403, 'FORBIDDEN_RESOURCE')
  }
}

/**
 * Check if user is the owner OR has admin access
 */
export async function requireOwnershipOrAdmin(
  resourceOwnerId: string | null,
  session: AuthSession
): Promise<void> {
  // Admins can access anything
  if (session.user.role === 'ADMIN') {
    return
  }

  // Check ownership
  if (resourceOwnerId !== session.user.id) {
    throw new ApiError('Accès non autorisé à cette ressource', 403, 'FORBIDDEN_RESOURCE')
  }
}
