import { Clock, Sunrise, Sun, Cloud, Sunset, Moon } from 'lucide-react'
import { PrayerTimes } from '@/lib/prayer-times'

interface PrayerTimesCardProps {
  timings: PrayerTimes
  nextPrayer?: { name: string; time: string } | null
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

export function PrayerTimesCard({ timings, nextPrayer }: PrayerTimesCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Horaires du jour</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(timings)
          .filter(([key]) => key !== 'Sunrise')
          .filter(([key]) => key in prayerIcons)
          .map(([prayer, time]) => {
            const Icon = prayerIcons[prayer as keyof typeof prayerIcons]
            const isNext = nextPrayer?.name === prayer

            if (!Icon) return null

            return (
              <div
                key={prayer}
                className={`p-4 rounded-lg text-center transition-all ${
                  isNext
                    ? 'bg-primary text-white shadow-md scale-105'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${isNext ? 'text-white' : 'text-primary'}`} />
                <div className={`text-sm mb-1 ${isNext ? 'text-white font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                  {prayerNames[prayer as keyof typeof prayerNames]}
                </div>
                <div className={`text-lg font-bold ${isNext ? 'text-white' : 'text-foreground'}`}>
                  {time.split(' ')[0]}
                </div>
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
