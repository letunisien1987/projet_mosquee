import Link from 'next/link'
import { ArrowRight, Calendar, Book, Heart, Users } from 'lucide-react'
import { UnifiedPrayerCard } from '@/components/UnifiedPrayerCard'
import { PrayerCountdown } from '@/components/PrayerCountdown'
import HeroWithAnnouncements from '@/components/HeroWithAnnouncements'
import { getPrayerTimes, getNextPrayer, formatHijriDate, isRamadan } from '@/lib/prayer-times'
import { getMawaqitAnnouncements, getMawaqitPrayerTimesWithDetails, getSpecialPrayerInfo } from '@/lib/mawaqit'
import { getJumuaMessages } from '@/lib/sanity'

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
  let rawAnnouncements: any[] = []
  try {
    rawAnnouncements = await getMawaqitAnnouncements()
  } catch (error) {
    console.error('Erreur lors du chargement des annonces Mawaqit:', error)
    rawAnnouncements = []
  }

  // Fetch Jumua messages from Sanity
  let jumuaMessages: any[] = []
  try {
    jumuaMessages = await getJumuaMessages()
  } catch (error) {
    console.error('Erreur lors du chargement des messages Joumou\'a:', error)
    jumuaMessages = []
  }

  // Transform Jumua messages for the carousel
  const jumuaAnnouncements = jumuaMessages.map((msg) => ({
    id: msg._id,
    title: msg.title,
    content: msg.message,
    image: msg.image?.asset?.url,
    priority: 'high',
    isJumua: true,
    jumuaTimes: specialInfo.jumua || []
  }))

  // Transform Mawaqit announcements for the carousel
  const mawaqitAnnouncements = rawAnnouncements.map((announcement) => ({
    id: announcement.id || Math.random().toString(),
    title: announcement.title || 'Annonce',
    content: announcement.content || announcement.description || announcement.text || '',
    date: announcement.startDate
      ? new Date(announcement.startDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : undefined,
    priority: announcement.priority || 'low',
    image: announcement.image || announcement.imageUrl || announcement.photo || undefined,
    isJumua: false
  }))

  // Combine all announcements (Jumua messages first if it's Friday or close to Friday)
  const announcements = currentDay === 5 || currentDay === 4 || currentDay === 6
    ? [...jumuaAnnouncements, ...mawaqitAnnouncements]
    : [...mawaqitAnnouncements, ...jumuaAnnouncements]

  return (
    <div>
      {/* Hero Section with Announcements Carousel */}
      <HeroWithAnnouncements
        announcements={announcements}
        hijriDate={hijriDate}
        gregorianDate={prayerData.date.gregorian.date}
        jumuaTime={specialInfo.jumua}
        currentDay={currentDay}
        imsak={specialInfo.imsak}
        iftar={specialInfo.iftar}
        isRamadan={isRamadanMonth}
      />

      {/* Prayer Times Section */}
      <section className="relative z-10 bg-background islamic-pattern w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Compteur centré en haut */}
          <div className="flex justify-center mb-6">
            <PrayerCountdown nextPrayer={nextPrayer} />
          </div>

          {/* Carte unifiée : toutes les prières + horaires spéciaux */}
          <div className="mb-6">
            <UnifiedPrayerCard
              timings={prayerData.timings}
              iqama={prayerData.iqama}
              iqamaDetailed={prayerDetailsData.iqamaDetailed}
              nextPrayer={nextPrayer}
              specialInfo={specialInfo}
              currentDay={currentDay}
              isRamadan={isRamadanMonth}
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="relative z-10 bg-background w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>
      </section>

    </div>
  )
}
