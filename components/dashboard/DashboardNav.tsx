'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Home,
  User,
  Users,
  BookOpen,
  Heart,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  LayoutGrid,
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Mail,
  HandHeart,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { AdminPermission } from '@prisma/client'

interface DashboardNavProps {
  user: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    role?: string | null
  }
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: AdminPermission[]
}

interface NavGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
  permissions?: AdminPermission[]
  section: 'personal' | 'activities' | 'organizer' | 'admin'
}

// Navigation personnelle (tous les utilisateurs)
const personalNavigation: NavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard', icon: Home },
  { name: 'Mon Profil', href: '/dashboard/profil', icon: User },
  { name: 'Mes Enfants', href: '/dashboard/enfants', icon: Users },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

// Mes participations (tous les utilisateurs)
const activitiesNavigation: NavItem[] = [
  { name: 'Mes Inscriptions', href: '/dashboard/inscriptions', icon: BookOpen },
  { name: 'Mes Dons', href: '/dashboard/dons', icon: Heart },
  { name: 'Ma Cotisation', href: '/dashboard/cotisation', icon: CreditCard },
  { name: 'Mes Documents', href: '/dashboard/documents', icon: FileText },
]

// Espace organisateur (MANAGER+)
const organizerNavigation: NavItem[] = [
  { name: 'Espace Organisateur', href: '/dashboard/organiser', icon: LayoutGrid },
]

// Navigation admin (groupes avec permissions) - 4 groupes simplifiés
const adminNavigationGroups: NavGroup[] = [
  {
    name: 'Communauté',
    icon: Users,
    section: 'admin',
    permissions: ['VIEW_MEMBERS', 'MANAGE_MEMBERS', 'VIEW_MEMBERSHIPS', 'MANAGE_MEMBERSHIPS'],
    items: [
      { name: 'Membres', href: '/dashboard/admin/membres', icon: Users, permissions: ['VIEW_MEMBERS'] },
      { name: 'Adhésions', href: '/dashboard/admin/adhesions', icon: UserPlus, permissions: ['VIEW_MEMBERSHIPS'] },
      { name: 'Cotisations', href: '/dashboard/admin/cotisations', icon: CreditCard, permissions: ['VIEW_MEMBERSHIPS'] },
    ],
  },
  {
    name: 'Programmes',
    icon: LayoutGrid,
    section: 'admin',
    permissions: ['VIEW_EVENTS', 'MANAGE_EVENTS', 'VIEW_ACTIVITIES', 'MANAGE_ACTIVITIES', 'VIEW_ENROLLMENTS', 'VIEW_EVENT_REGISTRATIONS'],
    items: [
      { name: 'Gestion', href: '/dashboard/admin/gestion', icon: LayoutGrid, permissions: ['VIEW_EVENTS', 'VIEW_ACTIVITIES'] },
      { name: 'Inscriptions', href: '/dashboard/admin/inscriptions-activites', icon: ClipboardCheck, permissions: ['VIEW_ENROLLMENTS', 'VIEW_EVENT_REGISTRATIONS'] },
    ],
  },
  {
    name: 'Communication',
    icon: Mail,
    section: 'admin',
    permissions: ['VIEW_MESSAGES', 'MANAGE_MESSAGES', 'VIEW_SERVICES', 'MANAGE_SERVICES'],
    items: [
      { name: 'Messages', href: '/dashboard/admin/messages', icon: MessageSquare, permissions: ['VIEW_MESSAGES'] },
      { name: 'Services', href: '/dashboard/admin/services', icon: FileText, permissions: ['VIEW_SERVICES'] },
    ],
  },
  {
    name: 'Système',
    icon: Settings,
    section: 'admin',
    permissions: ['VIEW_DONATIONS', 'MANAGE_DONATIONS', 'VIEW_SETTINGS', 'MANAGE_SETTINGS', 'MANAGE_ROLES'],
    items: [
      { name: 'Dons', href: '/dashboard/admin/dons', icon: HandHeart, permissions: ['VIEW_DONATIONS'] },
      { name: 'Paramètres', href: '/dashboard/admin/parametres', icon: Settings, permissions: ['MANAGE_SETTINGS'] },
      { name: 'Rôles', href: '/dashboard/admin/roles', icon: Shield, permissions: ['MANAGE_ROLES'] },
    ],
  },
]

// Rôles qui ont accès à l'espace admin
const ADMIN_ROLES = ['ADMIN', 'IMAM', 'TEACHER', 'STAFF', 'MANAGER', 'TRESORIER']

// Rôles qui voient l'espace organisateur
const ORGANIZER_ROLES = ['ADMIN', 'IMAM', 'STAFF', 'MANAGER']

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const { hasAnyPermission, isAdmin, loading: permissionsLoading } = usePermissions()

  const isAdminRole = user.role && ADMIN_ROLES.includes(user.role)
  const isOrganizerRole = user.role && ORGANIZER_ROLES.includes(user.role)

  // Filtrer les groupes admin selon les permissions
  const filteredAdminGroups = adminNavigationGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (isAdmin) return true
        if (!item.permissions) return true
        return hasAnyPermission(item.permissions)
      }),
    }))
    .filter(group => {
      if (isAdmin) return true
      if (group.items.length === 0) return false
      if (!group.permissions) return true
      return hasAnyPermission(group.permissions)
    })

  // Ouvrir automatiquement le groupe contenant la page active
  useEffect(() => {
    filteredAdminGroups.forEach((group) => {
      const isActive = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      )
      if (isActive && !expandedGroups.includes(group.name)) {
        setExpandedGroups((prev) => [...prev, group.name])
      }
    })
  }, [pathname])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    )
  }

  const isItemActive = (href: string) => {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const renderNavItem = (item: NavItem, mobile = false) => {
    const Icon = item.icon
    const isActive = isItemActive(item.href)
    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={() => mobile && setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.name}</span>
      </Link>
    )
  }

  const renderNavGroup = (group: NavGroup, mobile = false) => {
    const GroupIcon = group.icon
    const isExpanded = expandedGroups.includes(group.name)
    const hasActiveItem = group.items.some((item) => isItemActive(item.href))

    return (
      <div key={group.name} className="pt-1">
        <button
          onClick={() => toggleGroup(group.name)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
            hasActiveItem
              ? 'bg-primary/10 text-primary dark:bg-primary/20'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <GroupIcon className="h-5 w-5" />
            <span className="font-medium">{group.name}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-1 ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => mobile && setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderNavigation = (mobile = false) => (
    <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-4">
      {/* Section Espace Personnel */}
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
          Espace Personnel
        </p>
        {personalNavigation.map((item) => renderNavItem(item, mobile))}
      </div>

      {/* Section Mes Participations */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
          Mes Participations
        </p>
        <div className="space-y-1">
          {activitiesNavigation.map((item) => renderNavItem(item, mobile))}
        </div>
      </div>

      {/* Section Organisateur (MANAGER+) */}
      {isOrganizerRole && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Organisateur
          </p>
          <div className="space-y-1">
            {organizerNavigation.map((item) => renderNavItem(item, mobile))}
          </div>
        </div>
      )}

      {/* Section Administration (selon permissions) */}
      {isAdminRole && filteredAdminGroups.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Administration
          </p>

          {/* Dashboard Admin */}
          <Link
            href="/dashboard/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard/admin'
                ? 'bg-primary text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span>Dashboard Admin</span>
          </Link>

          {/* Groupes admin avec permissions */}
          <div className="mt-2 space-y-1">
            {filteredAdminGroups.map((group) => renderNavGroup(group, mobile))}
          </div>
        </div>
      )}
    </nav>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">
              Mon Espace
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications" className="relative p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-900/80"
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/" className="flex items-center">
                <Image
                  src="/mosque-madretsch-logo.png"
                  alt="Mosquée Madretsch"
                  width={160}
                  height={37}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            {renderNavigation(true)}

            {/* Logout */}
            <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center">
              <Image
                src="/mosque-madretsch-logo.png"
                alt="Mosquée Madretsch"
                width={160}
                height={37}
                className="h-8 w-auto"
                priority
              />
            </Link>
            <Link href="/dashboard/notifications" className="relative p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {renderNavigation(false)}

          {/* Logout */}
          <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
