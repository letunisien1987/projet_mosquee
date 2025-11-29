import Link from 'next/link'
import { ArrowRight, Calendar, Book, Heart, Users } from 'lucide-react'
import { PrayerTimesCard } from '@/components/PrayerTimesCard'
import { PrayerCountdown } from '@/components/PrayerCountdown'
import { SpecialPrayersSection } from '@/components/SpecialPrayersSection'
import { getPrayerTimes, getNextPrayer, formatHijriDate, isRamadan } from '@/lib/prayer-times'
import { getMawaqitAnnouncements, getMawaqitPrayerTimesWithDetails, getSpecialPrayerInfo } from '@/lib/mawaqit'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const prayerData = await getPrayerTimes()
  const nextPrayer = getNextPrayer(prayerData.timings)
  const hijriDate = formatHijriDate(prayerData.date.hijri)

  // Fetch detailed prayer times with iqama details
  const prayerDetailsData = await getMawaqitPrayerTimesWithDetails()

  // Fetch special prayer info (Joumou'a, Aïd, Imsak)
  const specialInfo = await getSpecialPrayerInfo()

  // Get current day (0=Sunday, 5=Friday)
  const currentDay = new Date().getDay()

  // Check if we're in Ramadan
  const isRamadanMonth = isRamadan(prayerData.date.hijri)

  // Fetch announcements from Mawaqit
  let announcements = []
  try {
    announcements = await getMawaqitAnnouncements()
  } catch (error) {
    console.error('Erreur lors du chargement des annonces Mawaqit:', error)
    announcements = []
  }

  return (
    <div className="islamic-pattern">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Mosquée en arrière-plan */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-15"
          style={{ backgroundImage: 'url(/mosque-silhouette.jpg)' }}
        ></div>
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
              {/* Joumou'a - Affiché le vendredi */}
              {currentDay === 5 && specialInfo.jumua && specialInfo.jumua.length > 0 && (
                <>
                  <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-sm text-white/70">Joumou&apos;a</p>
                    <p className="text-lg font-semibold">{specialInfo.jumua.join(' • ')}</p>
                  </div>
                </>
              )}
              {/* Imsak et Iftar (Ramadan) - Affiché seulement pendant Ramadan */}
              {isRamadanMonth && specialInfo.imsak && (
                <>
                  <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-sm text-white/70">Imsak</p>
                    <p className="text-lg font-semibold">{specialInfo.imsak}</p>
                  </div>
                </>
              )}
              {isRamadanMonth && specialInfo.iftar && (
                <>
                  <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-sm text-white/70">Iftar (Maghrib)</p>
                    <p className="text-lg font-semibold">{specialInfo.iftar}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Prayer Times Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Compteur centré en haut */}
        <div className="flex justify-center mb-6">
          <PrayerCountdown nextPrayer={nextPrayer} />
        </div>

        {/* Card horaires prend toute la largeur */}
        <div className="mb-6">
          <PrayerTimesCard
            timings={prayerData.timings}
            iqama={prayerData.iqama}
            iqamaDetailed={prayerDetailsData.iqamaDetailed}
            nextPrayer={nextPrayer}
            jumuaTimes={specialInfo.jumua}
            jumuaMessage={specialInfo.jumuaMessage}
            currentDay={currentDay}
          />
        </div>

        {/* Section prières spéciales (Joumou'a, Aïd, etc.) */}
        <SpecialPrayersSection specialInfo={specialInfo} currentDay={currentDay} isRamadanMonth={isRamadanMonth} />
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

      {/* Annonces Mawaqit */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Annonces</h2>
          </div>
          {announcements && announcements.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {announcements.slice(0, 3).map((announcement) => {
                const startDate = announcement.startDate ? new Date(announcement.startDate) : new Date()
                const day = startDate.getDate()
                const month = startDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()

                return (
                  <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary text-white rounded-lg p-3 text-center min-w-16">
                        <div className="text-2xl font-bold">{day}</div>
                        <div className="text-xs">{month}</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{announcement.title}</h3>
                        {announcement.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {announcement.content}
                          </p>
                        )}
                        {announcement.image && (
                          <img
                            src={announcement.image}
                            alt={announcement.title}
                            className="mt-3 rounded-lg w-full h-32 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Aucune annonce pour le moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
