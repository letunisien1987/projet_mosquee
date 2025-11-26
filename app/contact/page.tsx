import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import { getMosqueSettings } from '@/lib/sanity'

export default async function ContactPage() {
  const settings = await getMosqueSettings()

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      content: settings?.address
        ? `${settings.address.street}, ${settings.address.postalCode} ${settings.address.city}`
        : '123 Rue de la Mosquée, 75000 Paris',
      link: settings?.address
        ? `https://maps.google.com/?q=${settings.address.street}+${settings.address.city}`
        : 'https://maps.google.com/?q=123+Rue+de+la+Mosquée+Paris',
    },
    {
      icon: Phone,
      title: 'Téléphone',
      content: settings?.contact?.phone || '01 23 45 67 89',
      link: `tel:${settings?.contact?.phone || '0123456789'}`,
    },
    {
      icon: Mail,
      title: 'Email',
      content: settings?.contact?.email || 'contact@mosquee-alnour.fr',
      link: `mailto:${settings?.contact?.email || 'contact@mosquee-alnour.fr'}`,
    },
  ]

  const openingHours = settings?.openingHours
    ? settings.openingHours.split('\n').map((line: string) => {
        const [day, hours] = line.split(':')
        return { day: day?.trim() || '', hours: hours?.trim() || '' }
      })
    : [
        { day: 'Lundi - Jeudi', hours: '09:00 - 20:00' },
        { day: 'Vendredi', hours: '09:00 - 22:00' },
        { day: 'Samedi - Dimanche', hours: '08:00 - 21:00' },
      ]

  return (
    <div className="islamic-pattern min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contactez-nous</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Nous sommes à votre écoute pour toute question ou demande
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            return (
              <a
                key={index}
                href={info.link}
                target={info.icon === MapPin ? '_blank' : undefined}
                rel={info.icon === MapPin ? 'noopener noreferrer' : undefined}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:border-primary transition-all hover:shadow-xl group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{info.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{info.content}</p>
              </a>
            )
          })}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Envoyez-nous un message</h2>
            <ContactForm />
          </div>

          {/* Map and Opening Hours */}
          <div className="space-y-8">
            {/* Map */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Où nous trouver</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-primary/10">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937586!2d2.292292615674247!3d48.85837007928746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66fec70fb1d8d%3A0x40b82c3688c9460!2sEiffel%20Tower!5e0!3m2!1sen!2sfr!4v1234567890123!5m2!1sen!2sfr"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mosquée Al-Nour Map"
                  ></iframe>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contactInfo[0].content}
                  </p>
                  <a
                    href={contactInfo[0].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm font-medium mt-2 inline-block"
                  >
                    Ouvrir dans Google Maps →
                  </a>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Horaires d'ouverture</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                  <h3 className="font-bold text-lg">Bureau d'accueil</h3>
                </div>
                <div className="space-y-3">
                  {openingHours.map((schedule: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <span className="font-medium">{schedule.day}</span>
                      <span className="text-primary font-semibold">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Note :</strong> La mosquée reste ouverte pour les prières selon les
                    horaires quotidiens. Le bureau d'accueil suit les horaires ci-dessus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Transports en commun</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                  <span className="font-bold text-blue-600 dark:text-blue-400">M</span>
                </div>
                <h3 className="font-semibold mb-1">Métro</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lignes 6, 9 - Station Trocadéro
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                  <span className="font-bold text-green-600 dark:text-green-400">B</span>
                </div>
                <h3 className="font-semibold mb-1">Bus</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lignes 22, 30, 32, 63, 82
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3">
                  <span className="font-bold text-purple-600 dark:text-purple-400">P</span>
                </div>
                <h3 className="font-semibold mb-1">Parking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Parking souterrain à 2 min
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
