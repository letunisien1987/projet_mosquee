'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Logo } from './Logo'
import { useSession } from 'next-auth/react'
import { Menu, X, User, LogIn } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  { name: 'Accueil', href: '/' },
  { name: 'Horaires', href: '/horaires' },
  { name: 'À propos', href: '/about' },
  { name: 'Activités', href: '/activites' },
  { name: 'Événements', href: '/evenements' },
  { name: 'Devenir Membre', href: '/devenir-membre' },
  { name: 'Dons', href: '/dons' },
  { name: 'Contact', href: '/contact' },
]

interface NavbarProps {
  mosqueName?: string
}

export function Navbar({ mosqueName = 'Mosquée Madretsch' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo location="header" alt={mosqueName} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}

            {/* Auth Links */}
            {session ? (
              <Link
                href="/membre/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                <User className="h-4 w-4" />
                Espace Membre
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/connexion"
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                  <LogIn className="h-4 w-4" />
                  Inscription
                </Link>
              </div>
            )}

            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary/10 bg-background">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            {/* Mobile Auth Links */}
            <div className="border-t border-primary/10 pt-2 mt-2 space-y-2">
              {session ? (
                <Link
                  href="/membre/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Espace Membre
                </Link>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="block px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
