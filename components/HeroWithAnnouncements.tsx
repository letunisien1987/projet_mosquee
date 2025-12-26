'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import HeroSlide from './HeroSlide'

interface Announcement {
  id: string
  title: string
  content: string
  date?: string
  image?: string
  isJumua?: boolean
  jumuaTimes?: string[]
}

interface HeroWithAnnouncementsProps {
  announcements: Announcement[]
  hijriDate: string
  gregorianDate: string
  jumuaTime?: string[]
  currentDay: number
  imsak?: string
  iftar?: string
  isRamadan: boolean
  mosqueName?: string
}

export default function HeroWithAnnouncements({
  announcements,
  hijriDate,
  gregorianDate,
  jumuaTime,
  currentDay,
  imsak,
  iftar,
  isRamadan,
  mosqueName = 'Mosquée Madretsch',
}: HeroWithAnnouncementsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Créer le slide par défaut "Bienvenue"
  const defaultSlide: Announcement & { isDefault: boolean } = {
    id: 'welcome',
    title: `Bienvenue à ${mosqueName}`,
    content: `${mosqueName} n'est pas seulement une mosquée pour les prières mais plutôt un centre communautaire`,
    isDefault: true,
  }

  // Combiner le slide par défaut avec les annonces
  const allSlides: (Announcement & { isDefault?: boolean })[] = announcements.length > 0
    ? [defaultSlide, ...announcements.map(a => ({ ...a, isDefault: false }))]
    : [defaultSlide]

  // Auto-play carousel
  useEffect(() => {
    if (allSlides.length <= 1) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % allSlides.length)
    }, 8000)

    return () => clearInterval(timer)
  }, [currentIndex, allSlides.length])

  const nextSlide = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % allSlides.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + allSlides.length) % allSlides.length)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const currentSlide = allSlides[currentIndex]
  const isWelcomeSlide = 'isDefault' in currentSlide && currentSlide.isDefault

  // Build date infos for welcome slide
  const buildWelcomeDateInfos = () => {
    const infos = [
      { label: 'Date Hijri', value: hijriDate, isArabic: true },
      { label: 'Date Grégorienne', value: gregorianDate },
    ]

    // Joumou'a - Affiché le vendredi
    if (currentDay === 5 && jumuaTime && jumuaTime.length > 0) {
      infos.push({ label: "Joumou'a", value: jumuaTime.join(' • ') })
    }

    // Imsak et Iftar (Ramadan)
    if (isRamadan && imsak) {
      infos.push({ label: 'Imsak', value: imsak })
    }
    if (isRamadan && iftar) {
      infos.push({ label: 'Iftar (Maghrib)', value: iftar })
    }

    return infos
  }

  // Build date infos for Jumua slide
  const buildJumuaDateInfos = () => {
    const infos = [
      { label: 'Date Hijri', value: hijriDate, isArabic: true },
      { label: 'Date Grégorienne', value: gregorianDate },
    ]

    if (currentSlide.jumuaTimes && currentSlide.jumuaTimes.length > 0) {
      infos.push({ label: "Joumou'a", value: currentSlide.jumuaTimes.join(' • ') })
    }

    return infos
  }

  // Build date infos for Mawaqit announcements
  const buildAnnouncementDateInfos = () => {
    const infos = [
      { label: 'Date Hijri', value: hijriDate, isArabic: true },
      { label: 'Date Grégorienne', value: gregorianDate },
    ]

    // Si l'annonce a une date spécifique, l'afficher
    if (currentSlide.date) {
      infos.push({ label: 'Date', value: currentSlide.date })
    }

    return infos
  }

  // Get the appropriate date infos based on slide type
  const getDateInfos = () => {
    if (isWelcomeSlide) {
      return buildWelcomeDateInfos()
    } else if (currentSlide.isJumua) {
      return buildJumuaDateInfos()
    } else {
      return buildAnnouncementDateInfos()
    }
  }

  // Get the appropriate background image based on slide type
  // Fallback to mosque silhouette if no image is provided
  const getBackgroundImage = () => {
    if (isWelcomeSlide) {
      return '/mosque-silhouette.jpg'
    }
    // Si le slide n'a pas d'image, utiliser l'image par défaut
    return currentSlide.image || '/mosque-silhouette.jpg'
  }

  return (
    <section className="group sticky top-0 z-0 bg-gradient-to-br from-primary via-primary-dark to-primary text-white overflow-hidden h-[35vh]">
      {/* Background - now handled by HeroSlide component */}

      {/* Content - All slides use HeroSlide component */}
      <div className="relative z-10 flex items-center h-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <HeroSlide
            key={currentIndex}
            index={currentIndex}
            direction={direction}
            slideVariants={slideVariants}
            title={currentSlide.title}
            content={currentSlide.content}
            backgroundImage={getBackgroundImage()}
            dateInfos={getDateInfos()}
          />
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Hidden by default, shown on hover */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white/30 opacity-0 group-hover:opacity-100"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white/30 opacity-0 group-hover:opacity-100"
            aria-label="Slide suivant"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator - Hidden by default, shown on hover */}
      {allSlides.length > 1 && (
        <div className="absolute left-0 right-0 z-20 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-center gap-3">
            {allSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-white ${
                  index === currentIndex
                    ? 'w-12 h-3 bg-white shadow-lg'
                    : 'w-3 h-3 bg-white/40 hover:bg-white/60 hover:scale-110'
                }`}
                aria-label={`Aller au slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="text-center mt-3 text-sm text-white/80 font-medium">
            {currentIndex + 1} / {allSlides.length}
          </div>
        </div>
      )}
    </section>
  )
}
