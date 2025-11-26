'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface PrayerCountdownProps {
  nextPrayer: { name: string; time: string } | null
}

export function PrayerCountdown({ nextPrayer }: PrayerCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (!nextPrayer) return

    const calculateTimeLeft = () => {
      const now = new Date()
      const [hours, minutes] = nextPrayer.time.split(':').map(Number)

      const prayerTime = new Date()
      prayerTime.setHours(hours, minutes, 0, 0)

      if (prayerTime < now) {
        prayerTime.setDate(prayerTime.getDate() + 1)
      }

      const diff = prayerTime.getTime() - now.getTime()
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000)

      return `${hoursLeft.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`
    }

    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [nextPrayer])

  if (!nextPrayer) return null

  return (
    <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-6 w-6" />
        <h3 className="text-xl font-bold">Prochaine prière : {nextPrayer.name}</h3>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold mb-2 font-mono">{timeLeft}</div>
        <div className="text-white/80">Heures : Minutes : Secondes</div>
      </div>
    </div>
  )
}
