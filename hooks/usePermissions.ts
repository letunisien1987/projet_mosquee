'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminPermission, UserRole } from '@prisma/client'

interface PermissionsData {
  role: UserRole
  roleLabel: string
  permissions: AdminPermission[]
  accessibleRoutes: string[]
  hasAdminAccess: boolean
  isAdmin: boolean
}

export function usePermissions() {
  const [data, setData] = useState<PermissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/roles/my-permissions')

      if (res.status === 401) {
        setData(null)
        return
      }

      if (!res.ok) {
        throw new Error('Erreur lors de la récupération des permissions')
      }

      const permissionsData = await res.json()
      setData(permissionsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!data) return false
      if (data.isAdmin) return true // L'admin a toutes les permissions
      return data.permissions.includes(permission)
    },
    [data]
  )

  // Vérifier si l'utilisateur a au moins une des permissions
  const hasAnyPermission = useCallback(
    (permissions: AdminPermission[]): boolean => {
      if (!data) return false
      if (data.isAdmin) return true
      return permissions.some(p => data.permissions.includes(p))
    },
    [data]
  )

  // Vérifier si l'utilisateur a toutes les permissions
  const hasAllPermissions = useCallback(
    (permissions: AdminPermission[]): boolean => {
      if (!data) return false
      if (data.isAdmin) return true
      return permissions.every(p => data.permissions.includes(p))
    },
    [data]
  )

  // Vérifier si une route est accessible
  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!data) return false
      if (data.isAdmin) return true
      return data.accessibleRoutes.some(r => route.startsWith(r))
    },
    [data]
  )

  return {
    role: data?.role,
    roleLabel: data?.roleLabel,
    permissions: data?.permissions || [],
    accessibleRoutes: data?.accessibleRoutes || [],
    hasAdminAccess: data?.hasAdminAccess || false,
    isAdmin: data?.isAdmin || false,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    refetch: fetchPermissions,
  }
}
