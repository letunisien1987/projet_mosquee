'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Announcement {
  id: string
  title: string
  content: string
  date?: string
  image?: string
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
}: HeroWithAnnouncementsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Créer le slide par défaut "Bienvenue"
  const defaultSlide: Announcement & { isDefault: boolean } = {
    id: 'welcome',
    title: 'Bienvenue à la Mosquée Madretsch',
    content: 'La Mosquée Madretsch n\'est pas seulement une mosquée pour les prières mais plutôt un centre communautaire',
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
    }, 8000) // Change every 8 seconds

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

  return (
    <section className="sticky top-0 z-0 bg-gradient-to-br from-primary via-primary-dark to-primary text-white overflow-hidden h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-0"
        >
          {/* Background for announcement slides with image */}
          {!isWelcomeSlide && currentSlide.image ? (
            <>
              {/* Solid background - no image overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-primary"></div>
              <div className="absolute inset-0 islamic-pattern opacity-10"></div>
            </>
          ) : isWelcomeSlide ? (
            /* Background for welcome slide only */
            <>
              <div className="absolute inset-0 bg-black/20"></div>
              <div
                className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-15"
                style={{ backgroundImage: 'url(/mosque-silhouette.jpg)' }}
              ></div>
              <div className="absolute inset-0 islamic-pattern opacity-10"></div>
            </>
          ) : (
            /* Background for announcement slides without image */
            <>
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 islamic-pattern opacity-10"></div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        {!isWelcomeSlide && currentSlide.image && !currentSlide.content.trim() ? (
          /* SCENARIO 1: Image only - Absolute positioning to fill screen width */
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-contain"
              />

              {/* Title badge overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8 md:p-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="bg-primary px-5 py-2 rounded-full text-sm font-bold shadow-xl">
                      ANNONCE
                    </div>
                    {currentSlide.date && (
                      <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-sm font-semibold">
                        {currentSlide.date}
                      </div>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-2xl">
                    {currentSlide.title}
                  </h1>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className={!isWelcomeSlide && currentSlide.image ? "" : "text-center space-y-6"}
            >
              {/* INTELLIGENT LAYOUT ALGORITHM */}
              {!isWelcomeSlide && currentSlide.image && currentSlide.content.trim() ? (
                /* SCENARIO 2: Image + Text - Two columns layout */
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Left side - Text content */}
                  <div className="space-y-6 order-2 lg:order-1">
                    {/* Badge for announcements */}
                    <div className="flex gap-2 mb-4">
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                        ANNONCE
                      </div>
                      {currentSlide.date && (
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm">
                          {currentSlide.date}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                      {currentSlide.title}
                    </h1>

                    {/* Content */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <p className="text-lg md:text-xl text-white/95 leading-relaxed">
                        {currentSlide.content}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Image */}
                  <div className="order-1 lg:order-2">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black/20 backdrop-blur-sm h-[300px] md:h-[400px] lg:h-[450px] flex items-center justify-center">
                      <img
                        src={currentSlide.image}
                        alt={currentSlide.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              ) : !isWelcomeSlide && !currentSlide.image && currentSlide.content.trim() ? (
                /* SCENARIO 3: Text only (no image) - Centered content with decorative card */
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Badge for announcements */}
                  <div className="flex justify-center gap-2 mb-4">
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                      ANNONCE
                    </div>
                    {currentSlide.date && (
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm">
                        {currentSlide.date}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl md:text-6xl font-bold text-center px-4">
                    {currentSlide.title}
                  </h1>

                  {/* Content in beautiful card */}
                  <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border-2 border-white/20 shadow-2xl">
                    <p className="text-xl md:text-2xl text-white/95 leading-relaxed text-center">
                      {currentSlide.content}
                    </p>
                  </div>

                  {/* Decorative elements */}
                  <div className="flex justify-center gap-2 mt-6">
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                    <div className="w-2 h-2 rounded-full bg-white/60"></div>
                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Center layout for slides without image */}
                  {/* Badge for announcements */}
                  {!isWelcomeSlide && (
                    <div className="flex justify-center gap-2 mb-4">
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                        ANNONCE
                      </div>
                      {currentSlide.date && (
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm">
                          {currentSlide.date}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-4xl md:text-6xl font-bold px-4">
                    {currentSlide.title}
                  </h1>

                  {/* Content */}
                  <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto px-4">
                    {currentSlide.content}
                  </p>
                </>
              )}

              {/* Date info - only for welcome slide */}
              {isWelcomeSlide && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <div className="text-center">
                    <p className="text-sm text-white/70">Date Hijri</p>
                    <p className="text-lg font-semibold arabic-text">{hijriDate}</p>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-sm text-white/70">Date Grégorienne</p>
                    <p className="text-lg font-semibold">{gregorianDate}</p>
                  </div>
                  {/* Joumou'a - Affiché le vendredi */}
                  {currentDay === 5 && jumuaTime && jumuaTime.length > 0 && (
                    <>
                      <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                      <div className="text-center">
                        <p className="text-sm text-white/70">Joumou&apos;a</p>
                        <p className="text-lg font-semibold">{jumuaTime.join(' • ')}</p>
                      </div>
                    </>
                  )}
                  {/* Imsak et Iftar (Ramadan) */}
                  {isRamadan && imsak && (
                    <>
                      <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                      <div className="text-center">
                        <p className="text-sm text-white/70">Imsak</p>
                        <p className="text-lg font-semibold">{imsak}</p>
                      </div>
                    </>
                  )}
                  {isRamadan && iftar && (
                    <>
                      <div className="hidden sm:block w-px h-12 bg-white/30"></div>
                      <div className="text-center">
                        <p className="text-sm text-white/70">Iftar (Maghrib)</p>
                        <p className="text-lg font-semibold">{iftar}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white/30 group"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white/30 group"
            aria-label="Slide suivant"
          >
            <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-20">
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
