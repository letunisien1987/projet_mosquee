import Link from 'next/link'
import { ArrowRight, Calendar, Book, Heart, Users } from 'lucide-react'
import { PrayerTimesCard } from '@/components/PrayerTimesCard'
import { PrayerCountdown } from '@/components/PrayerCountdown'
import { getPrayerTimes, getNextPrayer, formatHijriDate } from '@/lib/prayer-times'
import { client } from '@/sanity/lib/client'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const prayerData = await getPrayerTimes('Paris', 'France')
  const nextPrayer = getNextPrayer(prayerData.timings)
  const hijriDate = formatHijriDate(prayerData.date.hijri)

  // Fetch featured events from Sanity
  let featuredEvents = []
  try {
    featuredEvents = await client.fetch(`
      *[_type == "event" && published == true && featured == true] | order(date asc) [0...3] {
        _id,
        title,
        description,
        date,
        startTime
      }
    `)
  } catch (error) {
    console.error('Erreur lors du chargement des événements:', error)
    // Événements de démonstration
    featuredEvents = [
      {
        _id: '1',
        title: 'Préparation au Ramadan',
        description: 'Conférence sur la préparation spirituelle et pratique pour le mois béni de Ramadan.',
        date: '2024-12-15',
        startTime: '20h00',
      },
      {
        _id: '2',
        title: 'Journée Portes Ouvertes',
        description: 'Découvrez notre mosquée et rencontrez la communauté.',
        date: '2024-12-22',
        startTime: '14h00',
      },
      {
        _id: '3',
        title: 'Cours de Tafsir',
        description: 'Étude approfondie de Sourate Al-Kahf avec Cheikh Mohammed.',
        date: '2024-12-28',
        startTime: '19h30',
      },
    ]
  }

  return (
    <div className="islamic-pattern">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              Bienvenue à la Mosquée Madretsch
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              La Mosquée Madretsch n'est pas seulement une mosquée pour les prières mais plutôt un centre communautaire
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-center">
                <p className="text-sm text-white/70">Date Hijri</p>
                <p className="text-lg font-semibold arabic-text">{hijriDate}</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/30"></div>
              <div className="text-center">
                <p className="text-sm text-white/70">Date Grégorienne</p>
                <p className="text-lg font-semibold">{prayerData.date.gregorian.date}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prayer Times Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="md:col-span-2">
            <PrayerTimesCard timings={prayerData.timings} nextPrayer={nextPrayer} />
          </div>
          <div>
            <PrayerCountdown nextPrayer={nextPrayer} />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Découvrez nos services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/horaires" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:border-primary transition-all hover:shadow-xl">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Horaires</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Consultez les horaires mensuels des prières et de la Joumou'a
              </p>
              <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                <span>En savoir plus</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link href="/activites" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:border-primary transition-all hover:shadow-xl">
              <Book className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Activités</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Cours de Coran, d'arabe et école du dimanche pour tous les âges
              </p>
              <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                <span>Découvrir</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link href="/dons" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:border-primary transition-all hover:shadow-xl">
              <Heart className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Dons</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Soutenez votre mosquée : Zakat, Sadaqa et cotisations
              </p>
              <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                <span>Contribuer</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link href="/about" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:border-primary transition-all hover:shadow-xl">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">À propos</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Notre histoire, notre mission et notre équipe
              </p>
              <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                <span>Nous connaître</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Événements à venir</h2>
            <Link href="/evenements" className="text-primary hover:text-primary-dark flex items-center gap-1">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredEvents.map((event: any) => {
                const eventDate = new Date(event.date)
                const day = eventDate.getDate()
                const month = eventDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()

                return (
                  <div key={event._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary text-white rounded-lg p-3 text-center min-w-16">
                        <div className="text-2xl font-bold">{day}</div>
                        <div className="text-xs">{month}</div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {event.description}
                        </p>
                        <p className="text-sm text-primary mt-2">{event.startTime}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Aucun événement à venir pour le moment.</p>
              <p className="text-sm mt-2">Les événements seront bientôt disponibles.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
