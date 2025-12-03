'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  BookOpen,
  Calendar,
  MessageSquare,
  FileText,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  Home,
  BookOpenText,
  CalendarPlus,
  BookPlus,
  ChevronDown,
  ChevronRight,
  Wallet,
  UserPlus,
  CreditCard,
  GraduationCap,
  PartyPopper,
  Mail,
  HandHeart,
  Shield,
  Settings,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { AdminPermission } from '@prisma/client'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: AdminPermission[]  // Permissions requises pour voir cet item
}

interface NavGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
  permissions?: AdminPermission[]  // Permissions requises pour voir ce groupe
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Membres', 'Activités', 'Événements'])
  const { hasAnyPermission, isAdmin, loading: permissionsLoading } = usePermissions()

  // Si on est sur la page de login, ne pas afficher le layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Navigation groupée avec permissions
  const navigationGroups: NavGroup[] = [
    {
      name: 'Membres',
      icon: Users,
      permissions: ['VIEW_MEMBERS', 'MANAGE_MEMBERS', 'VIEW_MEMBERSHIPS', 'MANAGE_MEMBERSHIPS'],
      items: [
        { name: 'Liste des membres', href: '/admin/membres', icon: Users, permissions: ['VIEW_MEMBERS'] },
        { name: 'Demandes d\'adhésion', href: '/admin/demandes-adhesion', icon: UserPlus, permissions: ['VIEW_MEMBERSHIPS'] },
        { name: 'Cotisations', href: '/admin/cotisations', icon: CreditCard, permissions: ['VIEW_MEMBERSHIPS'] },
      ],
    },
    {
      name: 'Activités',
      icon: GraduationCap,
      permissions: ['VIEW_ACTIVITIES', 'MANAGE_ACTIVITIES', 'VIEW_ENROLLMENTS', 'MANAGE_ENROLLMENTS'],
      items: [
        { name: 'Inscriptions', href: '/admin/inscriptions', icon: BookOpen, permissions: ['VIEW_ENROLLMENTS'] },
        { name: 'Gérer les activités', href: '/admin/activites', icon: BookPlus, permissions: ['VIEW_ACTIVITIES'] },
      ],
    },
    {
      name: 'Événements',
      icon: PartyPopper,
      permissions: ['VIEW_EVENTS', 'MANAGE_EVENTS', 'VIEW_EVENT_REGISTRATIONS', 'MANAGE_EVENT_REGISTRATIONS'],
      items: [
        { name: 'Inscriptions', href: '/admin/evenements', icon: Calendar, permissions: ['VIEW_EVENT_REGISTRATIONS'] },
        { name: 'Gérer les événements', href: '/admin/evenements-gestion', icon: CalendarPlus, permissions: ['VIEW_EVENTS'] },
      ],
    },
    {
      name: 'Finances',
      icon: Wallet,
      permissions: ['VIEW_DONATIONS', 'MANAGE_DONATIONS'],
      items: [
        { name: 'Dons', href: '/admin/dons', icon: HandHeart, permissions: ['VIEW_DONATIONS'] },
      ],
    },
    {
      name: 'Communication',
      icon: Mail,
      permissions: ['VIEW_MESSAGES', 'MANAGE_MESSAGES', 'VIEW_SERVICES', 'MANAGE_SERVICES'],
      items: [
        { name: 'Messages', href: '/admin/messages', icon: MessageSquare, permissions: ['VIEW_MESSAGES'] },
        { name: 'Demandes de services', href: '/admin/services', icon: FileText, permissions: ['VIEW_SERVICES'] },
        { name: 'Messages Jumua', href: '/admin/jumua', icon: BookOpenText, permissions: ['VIEW_MESSAGES'] },
      ],
    },
    {
      name: 'Configuration',
      icon: Settings,
      permissions: ['VIEW_SETTINGS', 'MANAGE_SETTINGS', 'MANAGE_ROLES'],
      items: [
        { name: 'Gestion des rôles', href: '/admin/roles', icon: Shield, permissions: ['MANAGE_ROLES'] },
      ],
    },
  ]

  // Filtrer les groupes et items selon les permissions
  const filteredNavigationGroups = navigationGroups
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
    filteredNavigationGroups.forEach((group) => {
      const isActive = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      )
      if (isActive && !expandedGroups.includes(group.name)) {
        setExpandedGroups((prev) => [...prev, group.name])
      }
    })
  }, [pathname, filteredNavigationGroups])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    )
  }

  const isItemActive = (href: string) => {
    return pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
  }

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard'
    for (const group of filteredNavigationGroups) {
      const item = group.items.find(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      )
      if (item) return item.name
    }
    // Fallback pour les pages non filtrées (comme /admin/roles pour admins)
    for (const group of navigationGroups) {
      const item = group.items.find(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      )
      if (item) return item.name
    }
    return 'Administration'
  }

  const renderNavigation = (mobile = false) => (
    <nav className="flex-1 space-y-1">
      {/* Dashboard - toujours visible */}
      <Link
        href="/admin"
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          pathname === '/admin'
            ? 'bg-primary text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => mobile && setSidebarOpen(false)}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Dashboard</span>
      </Link>

      {/* Groupes */}
      {filteredNavigationGroups.map((group) => {
        const GroupIcon = group.icon
        const isExpanded = expandedGroups.includes(group.name)
        const hasActiveItem = group.items.some((item) => isItemActive(item.href))

        return (
          <div key={group.name} className="pt-2">
            <button
              onClick={() => toggleGroup(group.name)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                hasActiveItem
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
              <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = isItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
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
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="fixed inset-0 bg-black/50" />
        <div
          className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 p-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Administration</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {renderNavigation(true)}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Link
              href="/membre/dashboard"
              className="flex items-center gap-3 px-4 py-3 w-full text-primary hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Espace Membre</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 overflow-y-auto p-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Administration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {session?.user?.name}
            </p>
          </div>

          {renderNavigation(false)}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Link
              href="/membre/dashboard"
              className="flex items-center gap-3 px-4 py-3 w-full text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Espace Membre</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
