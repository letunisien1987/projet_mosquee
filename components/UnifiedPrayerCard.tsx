import { Clock, Sunrise, Sun, CloudSun, Sunset, Moon, Calendar } from 'lucide-react'
import { PrayerTimes } from '@/lib/prayer-times'
import { IqamaTimes, IqamaTimesDetailed, SpecialPrayerInfo } from '@/types/mawaqit'

interface UnifiedPrayerCardProps {
  timings: PrayerTimes
  iqama?: IqamaTimes
  iqamaDetailed?: IqamaTimesDetailed
  nextPrayer?: { name: string; time: string } | null
  specialInfo: SpecialPrayerInfo
  currentDay: number
  isRamadan: boolean
}

const prayerConfig = {
  Fajr: { icon: Sunrise, name: 'Fajr' },
  Dhuhr: { icon: Sun, name: 'Dhuhr' },
  Asr: { icon: CloudSun, name: 'Asr' },
  Maghrib: { icon: Sunset, name: 'Maghrib' },
  Isha: { icon: Moon, name: 'Isha' },
}

export function UnifiedPrayerCard({
  timings,
  iqama,
  iqamaDetailed,
  nextPrayer,
  specialInfo,
  currentDay,
  isRamadan
}: UnifiedPrayerCardProps) {
  const isFriday = currentDay === 5
  const { jumua, aidPrayer, imsak, iftar } = specialInfo

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* En-tête rouge */}
      <div className="bg-gradient-to-r from-[#fc4245] to-[#e63946] p-6">
        <div className="flex items-center justify-center gap-3">
          <Clock className="h-8 w-8 text-white" />
          <h2 className="text-3xl font-bold text-white">
            Horaires de Prière
          </h2>
        </div>
      </div>

      <div className="p-6">
        {/* Grille principale : 5 prières + Joumou'a */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Les 5 prières quotidiennes */}
          {Object.entries(timings)
            .filter(([key]) => key !== 'Sunrise')
            .filter(([key]) => key in prayerConfig)
            .map(([prayer, time]) => {
              const config = prayerConfig[prayer as keyof typeof prayerConfig]
              const Icon = config.icon
              const isNext = nextPrayer?.name === prayer

              const prayerKey = prayer as keyof IqamaTimesDetailed
              const iqamaDetail = iqamaDetailed?.[prayerKey]
              const iqamaTime = iqamaDetail?.time || iqama?.[prayerKey]

              return (
                <div
                  key={prayer}
                  className={`rounded-xl p-5 text-center transition-all ${
                    isNext
                      ? 'bg-gradient-to-br from-[#fc4245] to-[#e63946] text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${isNext ? 'text-white' : 'text-[#fc4245]'}`} />
                  <h3 className={`font-bold text-sm mb-1 ${isNext ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {config.name}
                  </h3>
                  {isNext && (
                    <div className="mb-2 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
                      Prochaine
                    </div>
                  )}
                  <p className={`text-2xl font-bold mb-2 ${isNext ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {typeof time === 'string' ? time.split(' ')[0] : time}
                  </p>
                  <div className={`h-px w-full ${isNext ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'} my-2`} />
                  {iqamaTime && (
                    <div className={`text-xs ${isNext ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                      <p className="font-medium mb-1">Iqama</p>
                      <p className="font-bold">{iqamaTime}</p>
                      {iqamaDetail?.isRelative && iqamaDetail.offset && (
                        <p className="text-[10px] opacity-75 mt-1">
                          +{iqamaDetail.offset} min
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

          {/* Joumou'a intégrée */}
          {jumua && jumua.length > 0 && (
            <div
              className={`rounded-xl p-5 text-center transition-all ${
                isFriday
                  ? 'bg-gradient-to-br from-[#fc4245] to-[#e63946] text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-gray-50 dark:bg-gray-700/50 hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className={`h-8 w-8 mx-auto mb-2 ${isFriday ? 'text-white' : 'text-[#fc4245]'}`} />
              <h3 className={`font-bold text-sm mb-1 ${isFriday ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                Joumou'a
              </h3>
              {isFriday && (
                <div className="mb-2 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold">
                  Aujourd'hui
                </div>
              )}
              <div className="space-y-1 mb-2">
                {jumua.slice(0, 3).map((time, index) => (
                  <div key={index} className={`text-lg font-bold ${isFriday ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {time}
                  </div>
                ))}
              </div>
              <div className={`h-px w-full ${isFriday ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'} my-2`} />
              <p className={`text-xs ${isFriday ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {jumua.length} prêche{jumua.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Horaires Spéciaux */}
        {((aidPrayer && aidPrayer.length > 0) || (isRamadan && (imsak || iftar))) && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-1 w-12 bg-gradient-to-r from-[#fc4245] to-transparent rounded-full" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Horaires Spéciaux</h3>
              <div className="flex-1 h-1 bg-gradient-to-r from-transparent via-[#fc4245]/20 to-transparent rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prières de l'Aïd */}
              {aidPrayer && aidPrayer.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-[#fc4245]/20 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-[#fc4245] mb-4 flex items-center gap-2">
                    <span className="text-xl">🌙</span>
                    Prières de l'Aïd
                  </h4>
                  <div className="space-y-3">
                    {aidPrayer.map((time, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-[#fc4245]/10">
                        <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                          {index === 0 ? '1ère Prière' : '2ème Prière'}
                        </span>
                        <span className="text-2xl font-bold text-[#fc4245]">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Horaires Ramadan */}
              {isRamadan && (imsak || iftar) && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    Ramadan
                  </h4>
                  <div className="space-y-3">
                    {imsak && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200/30 dark:border-purple-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Imsak</span>
                          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{imsak}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Arrêt du Suhoor</p>
                      </div>
                    )}
                    {iftar && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200/30 dark:border-purple-800/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Iftar</span>
                          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{iftar}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rupture du jeûne</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
