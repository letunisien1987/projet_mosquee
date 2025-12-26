'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, Calendar, BookOpen, Heart, MessageSquare,
  Settings, CheckCircle, XCircle, Loader2, RotateCcw,
  Save, ChevronDown, ChevronUp, Lock
} from 'lucide-react'
import { AdminPermission, UserRole } from '@prisma/client'

interface RoleData {
  role: UserRole
  label: string
  permissions: AdminPermission[]
  isProtected: boolean
}

interface RolesResponse {
  roles: RoleData[]
  permissionLabels: Record<AdminPermission, string>
  permissionCategories: Record<string, { label: string; permissions: string[] }>
  allPermissions: AdminPermission[]
}

// Icônes par catégorie
const categoryIcons: Record<string, React.ReactNode> = {
  members: <Users className="h-5 w-5" />,
  events: <Calendar className="h-5 w-5" />,
  activities: <BookOpen className="h-5 w-5" />,
  finance: <Heart className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  admin: <Shield className="h-5 w-5" />,
}

// Couleurs par rôle
const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  IMAM: 'bg-green-100 text-green-800 border-green-200',
  TEACHER: 'bg-blue-100 text-blue-800 border-blue-200',
  STAFF: 'bg-orange-100 text-orange-800 border-orange-200',
  MANAGER: 'bg-teal-100 text-teal-800 border-teal-200',
  TRESORIER: 'bg-amber-100 text-amber-800 border-amber-200',
  MEMBER: 'bg-gray-100 text-gray-800 border-gray-200',
}

export default function RolesPermissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<UserRole | null>(null)
  const [resetting, setResetting] = useState<UserRole | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [rolesData, setRolesData] = useState<RolesResponse | null>(null)
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null)
  const [modifiedPermissions, setModifiedPermissions] = useState<Record<UserRole, AdminPermission[]>>({} as Record<UserRole, AdminPermission[]>)

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard/admin')
        return
      }
      fetchRoles()
    }
  }, [status, session])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/roles')
      if (!res.ok) throw new Error('Erreur de chargement')

      const data: RolesResponse = await res.json()
      setRolesData(data)

      // Initialiser les permissions modifiées
      const initial: Record<UserRole, AdminPermission[]> = {} as Record<UserRole, AdminPermission[]>
      data.roles.forEach(r => {
        initial[r.role] = [...r.permissions]
      })
      setModifiedPermissions(initial)
    } catch (err) {
      setError('Erreur lors du chargement des rôles')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (role: UserRole, permission: AdminPermission) => {
    setModifiedPermissions(prev => {
      const current = prev[role] || []
      const updated = current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission]
      return { ...prev, [role]: updated }
    })
  }

  const hasChanges = (role: UserRole): boolean => {
    const original = rolesData?.roles.find(r => r.role === role)?.permissions || []
    const modified = modifiedPermissions[role] || []

    if (original.length !== modified.length) return true
    return !original.every(p => modified.includes(p))
  }

  const saveRolePermissions = async (role: UserRole) => {
    try {
      setSaving(role)
      setError('')
      setSuccess('')

      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          permissions: modifiedPermissions[role] || [],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur de sauvegarde')
      }

      setSuccess(`Permissions du rôle ${rolesData?.roles.find(r => r.role === role)?.label} sauvegardées`)

      // Recharger les données
      await fetchRoles()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
    } finally {
      setSaving(null)
    }
  }

  const resetRolePermissions = async (role: UserRole) => {
    try {
      setResetting(role)
      setError('')
      setSuccess('')

      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur de réinitialisation')
      }

      setSuccess(`Permissions du rôle ${rolesData?.roles.find(r => r.role === role)?.label} réinitialisées`)

      // Recharger les données
      await fetchRoles()

      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de réinitialisation')
    } finally {
      setResetting(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!rolesData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Erreur de chargement'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestion des Rôles et Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configurez les accès de chaque rôle à l'interface d'administration
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Liste des rôles */}
      <div className="space-y-4">
        {rolesData.roles.map(roleData => (
          <div
            key={roleData.role}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* En-tête du rôle */}
            <button
              onClick={() => setExpandedRole(expandedRole === roleData.role ? null : roleData.role)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${roleColors[roleData.role]}`}>
                  {roleData.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {modifiedPermissions[roleData.role]?.length || 0} permissions
                </span>
                {roleData.isProtected && (
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                    <Lock className="h-3 w-3" />
                    Protégé
                  </span>
                )}
                {hasChanges(roleData.role) && !roleData.isProtected && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Modifications non sauvegardées
                  </span>
                )}
              </div>
              {expandedRole === roleData.role ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Contenu étendu */}
            {expandedRole === roleData.role && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {roleData.isProtected ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <Lock className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="font-medium">Ce rôle a accès à toutes les permissions</p>
                    <p className="text-sm">Les permissions de l'administrateur ne peuvent pas être modifiées</p>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Catégories de permissions */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(rolesData.permissionCategories).map(([catKey, category]) => (
                        <div key={catKey} className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            {categoryIcons[catKey] || <Shield className="h-5 w-5" />}
                            {category.label}
                          </h4>
                          <div className="space-y-2">
                            {category.permissions.map(permKey => {
                              const permission = permKey as AdminPermission
                              const isChecked = modifiedPermissions[roleData.role]?.includes(permission)
                              return (
                                <label
                                  key={permKey}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(roleData.role, permission)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    {rolesData.permissionLabels[permission]}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => saveRolePermissions(roleData.role)}
                        disabled={saving === roleData.role || !hasChanges(roleData.role)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving === roleData.role ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => resetRolePermissions(roleData.role)}
                        disabled={resetting === roleData.role}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {resetting === roleData.role ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="font-medium mb-3">Légende des permissions</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">VIEW_*</span>
            <span className="text-gray-600 dark:text-gray-400">Permet de consulter les données (lecture seule)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-green-600">MANAGE_*</span>
            <span className="text-gray-600 dark:text-gray-400">Permet de modifier, ajouter et supprimer</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-purple-600">ADMIN_ACCESS</span>
            <span className="text-gray-600 dark:text-gray-400">Accès administrateur complet (réservé aux admins)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
