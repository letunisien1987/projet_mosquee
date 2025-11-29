import { Calendar, Moon, Sun } from 'lucide-react'
import type { SpecialPrayerInfo } from '@/types/mawaqit'

interface SpecialPrayersSectionProps {
  specialInfo: SpecialPrayerInfo
  currentDay: number // 0=Dimanche, 5=Vendredi
  isRamadanMonth: boolean // true si nous sommes dans le mois de Ramadan
}

export function SpecialPrayersSection({ specialInfo, currentDay, isRamadanMonth }: SpecialPrayersSectionProps) {
  const { aidPrayer, imsak, iftar } = specialInfo

  // Ne rien afficher si aucune information spéciale
  const hasAnyInfo = aidPrayer || (isRamadanMonth && imsak)

  if (!hasAnyInfo) return null

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

      {/* Prières de l'Aïd */}
      {aidPrayer && aidPrayer.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Moon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Prières de l&apos;Aïd</h3>
          </div>

          <div className="space-y-3">
            {aidPrayer.map((time, index) => (
              <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                <span className="font-medium">
                  {index === 0 ? '1ère Prière' : '2ème Prière'}
                </span>
                <span className="text-2xl font-bold font-mono">{time}</span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm text-white/80">
            Prières spéciales de l&apos;Aïd al-Fitr ou al-Adha
          </p>
        </div>
      )}

      {/* Imsak et Iftar (Ramadan) - Affiché seulement pendant Ramadan */}
      {isRamadanMonth && (imsak || iftar) && (
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Sun className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Ramadan</h3>
          </div>

          <div className="space-y-3">
            {imsak && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Imsak</span>
                  <span className="text-2xl font-bold font-mono">{imsak}</span>
                </div>
                <p className="text-xs text-white/70">Arrêt du Suhoor</p>
              </div>
            )}

            {iftar && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Iftar</span>
                  <span className="text-2xl font-bold font-mono">{iftar}</span>
                </div>
                <p className="text-xs text-white/70">Rupture du jeûne (Maghrib)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
