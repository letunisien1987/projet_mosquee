import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

// Rôles qui ont accès à l'admin par défaut (peuvent être restreints par permissions)
const ADMIN_ROLES: UserRole[] = ['ADMIN', 'IMAM', 'TEACHER', 'STAFF', 'MANAGER']

export default withAuth(
  function middleware(req) {
    // Vérifier si l'utilisateur a le rôle approprié pour accéder à /admin
    if (req.nextUrl.pathname.startsWith('/admin') && req.nextUrl.pathname !== '/admin/login') {
      const token = req.nextauth.token

      // Vérifier que l'utilisateur a un rôle qui permet l'accès admin
      if (!token || !ADMIN_ROLES.includes(token.role as UserRole)) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }

      // Note: La vérification fine des permissions est faite côté client
      // et dans les API routes pour des raisons de performance
      // (le middleware ne peut pas faire d'appels async à la DB facilement)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permettre l'accès à la page de login sans authentification
        if (req.nextUrl.pathname === '/admin/login') {
          return true
        }

        // Pour toutes les autres routes /admin, vérifier le token
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/membre/:path*'],
}
