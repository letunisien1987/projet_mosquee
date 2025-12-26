import { Clock, Calendar } from 'lucide-react'
import { getMonthlyPrayerTimes, getPrayerTimes, getNextPrayer } from '@/lib/prayer-times'
import { getMawaqitJumuahTimes } from '@/lib/mawaqit'
import { PrayerCountdown } from '@/components/PrayerCountdown'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function HorairesPage() {
  const [monthlyPrayers, todayPrayers, settings] = await Promise.all([
    getMonthlyPrayerTimes(),
    getPrayerTimes(),
    getSettings(),
  ])
  const nextPrayer = getNextPrayer(todayPrayers.timings)

  // Récupérer horaires Joumou'a depuis Mawaqit
  let jumuahTimes: string[] = []
  try {
    jumuahTimes = await getMawaqitJumuahTimes()
  } catch (error) {
    console.error('Erreur lors du chargement des horaires Joumou\'a:', error)
    jumuahTimes = [] // Fallback vide si erreur
  }

  const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

  return (
    <div className="islamic-pattern min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Horaires des Prières</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Consultez les horaires mensuels des prières de {settings.name} ({settings.address_city}, Suisse)
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-8">
          <PrayerCountdown nextPrayer={nextPrayer} />
        </div>

        {/* Joumou'a Info */}
        {jumuahTimes.length > 0 && (
          <div className="bg-accent/10 border border-accent rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <Calendar className="h-8 w-8 text-accent flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Prière du Vendredi (Joumou'a)</h2>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                  {jumuahTimes.map((time, index) => (
                    <p key={index}>
                      <strong>{index === 0 ? 'Premier' : index === 1 ? 'Deuxième' : `${index + 1}ème`} prêche :</strong> {time}
                    </p>
                  ))}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Nous vous recommandons d'arriver 15 minutes avant le début du prêche.
                    Les places sont limitées, merci de libérer votre place après la prière.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Prayer Times Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-primary/10">
          <div className="bg-primary text-white p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              <h2 className="text-2xl font-bold">
                Horaires du mois - {monthlyPrayers[0]?.date.gregorian.month.en} {monthlyPrayers[0]?.date.gregorian.year}
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Jour
                  </th>
                  {prayerNames.map((name) => (
                    <th key={name} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {monthlyPrayers.map((day, index) => {
                  const isToday = day.date.gregorian.date === todayPrayers.date.gregorian.date
                  const isFriday = day.date.gregorian.weekday.en === 'Friday'

                  return (
                    <tr
                      key={index}
                      className={`
                        ${isToday ? 'bg-primary/10 font-semibold' : ''}
                        ${isFriday ? 'bg-accent/5' : ''}
                        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      `}
                    >
                      <td className="px-4 py-3 text-sm">
                        {day.date.gregorian.day}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={isFriday ? 'text-accent font-semibold' : ''}>
                          {day.date.gregorian.weekday.en}
                        </span>
                      </td>
                      {prayerNames.map((name) => (
                        <td key={name} className="px-4 py-3 text-sm text-center font-mono">
                          {day.timings[name as keyof typeof day.timings].split(' ')[0]}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">Informations importantes</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Les horaires officiels de {settings.name} ({settings.address_city}, Suisse)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Les horaires d'iqama sont affichés à côté de chaque prière</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Les horaires peuvent varier légèrement selon les conditions météorologiques</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Veuillez arriver quelques minutes avant l'iqama</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
