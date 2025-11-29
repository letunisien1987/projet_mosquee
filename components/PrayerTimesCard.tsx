import { Clock, Sunrise, Sun, Cloud, Sunset, Moon, Calendar } from 'lucide-react'
import { PrayerTimes } from '@/lib/prayer-times'
import { IqamaTimes, IqamaTimesDetailed } from '@/types/mawaqit'

interface PrayerTimesCardProps {
  timings: PrayerTimes
  iqama?: IqamaTimes
  iqamaDetailed?: IqamaTimesDetailed
  nextPrayer?: { name: string; time: string } | null
  jumuaTimes?: string[]
  jumuaMessage?: string
  currentDay?: number
}

const prayerIcons = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: Cloud,
  Maghrib: Sunset,
  Isha: Moon,
}

const prayerNames = {
  Fajr: 'Fajr',
  Dhuhr: 'Dhuhr',
  Asr: 'Asr',
  Maghrib: 'Maghrib',
  Isha: 'Isha',
}

export function PrayerTimesCard({ timings, iqama, iqamaDetailed, nextPrayer, jumuaTimes, jumuaMessage, currentDay }: PrayerTimesCardProps) {
  const isFriday = currentDay === 5

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Horaires du jour</h2>
      </div>

      {/* Section Joumou'a - Affichée en haut si disponible */}
      {jumuaTimes && jumuaTimes.length > 0 && (
        <div className={`mb-6 rounded-xl p-5 border-2 transition-all ${
          isFriday
            ? 'bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-950/40 dark:to-orange-950/40 border-primary shadow-lg shadow-primary/20'
            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-indigo-300 dark:border-indigo-700 shadow-md'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl shadow-sm ${
              isFriday
                ? 'bg-gradient-to-br from-primary to-red-600 text-white'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            }`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${
                isFriday
                  ? 'text-primary'
                  : 'text-indigo-700 dark:text-indigo-300'
              }`}>
                Prière du Joumou&apos;a {isFriday && <span className="text-sm font-normal">(Aujourd&apos;hui)</span>}
              </h3>
              {!isFriday && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Vendredi prochain</p>
              )}
            </div>
          </div>

          {/* Grid à 2 colonnes : Message à gauche, Horaires à droite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Message du Joumou'a - À gauche */}
            <div className={`rounded-lg p-4 ${
              isFriday
                ? 'bg-white/60 dark:bg-gray-800/60 border-2 border-primary/20'
                : 'bg-white/50 dark:bg-gray-800/50 border-2 border-indigo-200 dark:border-indigo-800'
            }`}>
              <h4 className={`font-semibold mb-2 text-sm ${
                isFriday
                  ? 'text-primary'
                  : 'text-indigo-700 dark:text-indigo-300'
              }`}>
                Message du vendredi
              </h4>
              <p className={`text-sm leading-relaxed ${
                isFriday
                  ? 'text-gray-700 dark:text-gray-200'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {jumuaMessage || "Que la paix et les bénédictions d'Allah soient sur vous. Venez nombreux assister à la prière du Joumou'a."}
              </p>
            </div>

            {/* Horaires des prêches - À droite */}
            <div className="grid grid-cols-1 gap-3">
              {jumuaTimes.map((time, index) => (
                <div key={index} className={`flex items-center justify-between rounded-lg p-3 transition-all ${
                  isFriday
                    ? 'bg-white/80 dark:bg-gray-800/80 border-2 border-primary/30 shadow-sm hover:shadow-md hover:border-primary/50'
                    : 'bg-white/70 dark:bg-gray-800/70 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}>
                  <span className={`text-sm font-semibold ${
                    isFriday
                      ? 'text-primary'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {index === 0 ? '1er Prêche' : index === 1 ? '2ème Prêche' : '3ème Prêche'}
                  </span>
                  <span className={`text-xl font-bold font-mono ${
                    isFriday
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-indigo-700 dark:text-indigo-300'
                  }`}>
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(timings)
          .filter(([key]) => key !== 'Sunrise')
          .filter(([key]) => key in prayerIcons)
          .map(([prayer, time]) => {
            const Icon = prayerIcons[prayer as keyof typeof prayerIcons]
            const isNext = nextPrayer?.name === prayer

            if (!Icon) return null

            // Get iqama details (with +N info) if available, otherwise fallback to simple iqama
            const prayerKey = prayer as keyof IqamaTimesDetailed
            const iqamaDetail = iqamaDetailed?.[prayerKey]
            const iqamaTime = iqamaDetail?.time || iqama?.[prayerKey]

            return (
              <div
                key={prayer}
                className={`p-4 rounded-lg text-center transition-all relative ${
                  isNext
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${isNext ? 'text-white' : 'text-primary'}`} />
                <div className={`text-sm mb-1 ${isNext ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                  {prayerNames[prayer as keyof typeof prayerNames]}
                </div>

                {/* Heure principale */}
                <div className={`text-lg font-bold ${isNext ? 'text-white' : 'text-foreground'}`}>
                  {time.split(' ')[0]}
                </div>

                {/* Iqama avec indication fixe ou +N */}
                {iqamaTime && iqamaDetail && (
                  <div className={`text-xs mt-1 ${isNext ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="font-medium">Iqama:</span> {iqamaDetail.time}
                    {iqamaDetail.isRelative && iqamaDetail.offset && (
                      <span className="ml-1 text-[10px] opacity-75">
                        (+{iqamaDetail.offset}min)
                      </span>
                    )}
                  </div>
                )}

                {isNext && (
                  <div className="text-xs mt-1 text-white/80">Prochaine</div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
