import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Vérifier si l'utilisateur a le rôle approprié pour accéder à /admin
    if (req.nextUrl.pathname.startsWith('/admin') && req.nextUrl.pathname !== '/admin/login') {
      const token = req.nextauth.token

      if (!token || !['ADMIN', 'IMAM', 'STAFF'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
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
