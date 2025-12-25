import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

// Rôles qui ont accès à l'admin par défaut (peuvent être restreints par permissions)
const ADMIN_ROLES: UserRole[] = ['ADMIN', 'IMAM', 'TEACHER', 'STAFF', 'MANAGER']

// Mapping des anciennes routes membre vers les nouvelles
const MEMBRE_REDIRECTS: Record<string, string> = {
  '/membre/dashboard': '/dashboard',
  '/membre/dashboard/enfants': '/dashboard/enfants',
  '/membre/profil': '/dashboard/profil',
  '/membre/enfants': '/dashboard/enfants',
  '/membre/inscriptions': '/dashboard/inscriptions',
  '/membre/mes-inscriptions': '/dashboard/inscriptions',
  '/membre/dons': '/dashboard/dons',
  '/membre/cotisation': '/dashboard/cotisation',
  '/membre/adhesion': '/dashboard/adhesion',
  '/membre/documents': '/dashboard/documents',
  '/membre/parametres': '/dashboard/parametres',
  '/membre/paiements': '/dashboard/paiements',
  '/membre/organisateur': '/dashboard/organiser',
  '/membre/organisateur/nouveau': '/dashboard/organiser/nouveau',
}

// Mapping des anciennes routes admin vers les nouvelles
const ADMIN_REDIRECTS: Record<string, string> = {
  '/admin': '/dashboard/admin',
  '/admin/membres': '/dashboard/admin/membres',
  '/admin/demandes-adhesion': '/dashboard/admin/adhesions',
  '/admin/cotisations': '/dashboard/admin/cotisations',
  '/admin/gestion': '/dashboard/admin/gestion',
  '/admin/inscriptions': '/dashboard/admin/inscriptions-activites',
  '/admin/dons': '/dashboard/admin/dons',
  '/admin/messages': '/dashboard/admin/messages',
  '/admin/services': '/dashboard/admin/services',
  '/admin/roles': '/dashboard/admin/roles',
  '/admin/jumua': '/dashboard/admin/jumua',
  '/admin/activites': '/dashboard/admin/activites',
  '/admin/evenements': '/dashboard/admin/evenements',
  '/admin/responsables-activites': '/dashboard/admin/responsables-activites',
  '/admin/import-raisenow': '/dashboard/admin/import-raisenow',
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname

    // Rediriger les anciennes routes /membre vers /dashboard
    if (pathname.startsWith('/membre')) {
      // Vérifier d'abord les redirections exactes
      if (MEMBRE_REDIRECTS[pathname]) {
        return NextResponse.redirect(new URL(MEMBRE_REDIRECTS[pathname], req.url))
      }

      // Redirection dynamique pour les routes organisateur
      if (pathname.startsWith('/membre/organisateur/event/')) {
        const newPath = pathname.replace('/membre/organisateur/', '/dashboard/organiser/')
        return NextResponse.redirect(new URL(newPath, req.url))
      }
      if (pathname.startsWith('/membre/organisateur/activity/')) {
        const newPath = pathname.replace('/membre/organisateur/', '/dashboard/organiser/')
        return NextResponse.redirect(new URL(newPath, req.url))
      }

      // Redirection générale /membre -> /dashboard
      const newPath = pathname.replace('/membre', '/dashboard')
      return NextResponse.redirect(new URL(newPath, req.url))
    }

    // Rediriger les anciennes routes /admin vers /dashboard/admin
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      const token = req.nextauth.token

      // Vérifier que l'utilisateur a un rôle qui permet l'accès admin
      if (!token || !ADMIN_ROLES.includes(token.role as UserRole)) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }

      // Vérifier d'abord les redirections exactes
      if (ADMIN_REDIRECTS[pathname]) {
        return NextResponse.redirect(new URL(ADMIN_REDIRECTS[pathname], req.url))
      }

      // Redirection dynamique pour les routes avec paramètres
      // /admin/gestion/[id] -> /dashboard/admin/gestion/[id]
      if (pathname.startsWith('/admin/gestion/')) {
        const newPath = pathname.replace('/admin/gestion/', '/dashboard/admin/gestion/')
        return NextResponse.redirect(new URL(newPath, req.url))
      }
      // /admin/activites/[id]/modifier -> /dashboard/admin/activites/[id]/modifier
      if (pathname.startsWith('/admin/activites/')) {
        const newPath = pathname.replace('/admin/activites/', '/dashboard/admin/activites/')
        return NextResponse.redirect(new URL(newPath, req.url))
      }
      // /admin/evenements/[id] -> /dashboard/admin/evenements/[id]
      if (pathname.startsWith('/admin/evenements/') && !pathname.startsWith('/admin/evenements-gestion')) {
        const newPath = pathname.replace('/admin/evenements/', '/dashboard/admin/evenements/')
        return NextResponse.redirect(new URL(newPath, req.url))
      }

      // Redirection générale /admin -> /dashboard/admin pour les routes non mappées
      const newPath = pathname.replace('/admin', '/dashboard/admin')
      return NextResponse.redirect(new URL(newPath, req.url))
    }

    // Vérifier si l'utilisateur a le rôle approprié pour accéder à /dashboard/admin
    if (pathname.startsWith('/dashboard/admin')) {
      const token = req.nextauth.token

      // Vérifier que l'utilisateur a un rôle qui permet l'accès admin
      if (!token || !ADMIN_ROLES.includes(token.role as UserRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Note: La vérification fine des permissions est faite côté client
      // et dans les API routes pour des raisons de performance
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Permettre l'accès à la page de login sans authentification
        if (pathname === '/admin/login') {
          return true
        }

        // Pour toutes les autres routes /admin, vérifier le token
        if (pathname.startsWith('/admin')) {
          return !!token
        }

        // Pour toutes les routes /dashboard, vérifier le token
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

        // Pour les routes /membre (legacy), vérifier le token
        if (pathname.startsWith('/membre')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/membre/:path*', '/dashboard/:path*'],
}
