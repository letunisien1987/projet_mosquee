import Link from 'next/link'
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'
import { getSettings } from '@/lib/settings'
import { Logo } from '@/components/Logo'

export async function Footer() {
  const settings = await getSettings()

  // Construire l'adresse formatée
  const formattedAddress = `${settings.address_street}, ${settings.address_postal_code} ${settings.address_city}`

  return (
    <footer className="bg-primary text-white mt-auto relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, white 1px, transparent 1px),
            linear-gradient(to bottom, white 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo location="footer" />
            </div>
            <p className="text-white/80 text-sm">
              {settings.description || `${settings.name} n'est pas seulement une mosquée pour les prières mais plutôt un centre communautaire.`}
            </p>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/horaires" className="text-white/80 hover:text-white transition-colors">
                  Horaires des prières
                </Link>
              </li>
              <li>
                <Link href="/activites" className="text-white/80 hover:text-white transition-colors">
                  Nos activités
                </Link>
              </li>
              <li>
                <Link href="/evenements" className="text-white/80 hover:text-white transition-colors">
                  Événements
                </Link>
              </li>
              <li>
                <Link href="/dons" className="text-white/80 hover:text-white transition-colors">
                  Faire un don
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 text-white/80">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{formattedAddress}</span>
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="font-bold text-lg mb-4">Suivez-nous</h3>
            <div className="flex gap-4">
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.social_youtube && (
                <a
                  href={settings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} {settings.name}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
