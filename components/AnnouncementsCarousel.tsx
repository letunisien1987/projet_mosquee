'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Bell, Calendar, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Announcement {
  id: string
  title: string
  content: string
  date?: string
  priority?: 'low' | 'medium' | 'high'
  image?: string
}

interface AnnouncementsCarouselProps {
  announcements: Announcement[]
}

export default function AnnouncementsCarousel({ announcements }: AnnouncementsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Auto-play carousel
  useEffect(() => {
    if (announcements.length <= 1) return

    const timer = setInterval(() => {
      nextSlide()
    }, 6000) // Change slide every 6 seconds

    return () => clearInterval(timer)
  }, [currentIndex, announcements.length])

  const nextSlide = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % announcements.length)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-5 w-5" />
      case 'medium':
        return <Bell className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  if (!announcements || announcements.length === 0) {
    return null
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

  return (
    <section className="relative overflow-hidden">
      {/* Section Header */}
      <div className="relative z-10 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            Annonces
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Restez informés des dernières actualités de la mosquée
          </p>
        </div>
      </div>

      {/* Carousel Container - Full Width */}
      <div className="relative">
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
            className="relative min-h-[500px] md:min-h-[600px] w-full"
          >
            {/* Background Image with Red Overlay */}
            {announcements[currentIndex].image && (
              <div className="absolute inset-0 z-0">
                <img
                  src={announcements[currentIndex].image}
                  alt={announcements[currentIndex].title}
                  className="w-full h-full object-cover"
                />
                {/* Red overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/75 to-primary-dark/85"></div>
                {/* Pattern overlay */}
                <div className="absolute inset-0 islamic-pattern opacity-20"></div>
              </div>
            )}

            {/* Fallback gradient if no image */}
            {!announcements[currentIndex].image && (
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-primary-dark to-primary"></div>
            )}

            {/* Content - Full Width */}
            <div className="relative z-10 w-full h-full flex items-center">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                <div className="max-w-6xl mx-auto">
                  {/* Priority Badge and Date */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {announcements[currentIndex].priority && (
                      <div className={`${getPriorityColor(announcements[currentIndex].priority)} text-white px-5 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-xl border-2 border-white/30`}>
                        {getPriorityIcon(announcements[currentIndex].priority)}
                        <span className="capitalize">{announcements[currentIndex].priority === 'high' ? 'Important' : announcements[currentIndex].priority === 'medium' ? 'Attention' : 'Info'}</span>
                      </div>
                    )}
                    {announcements[currentIndex].date && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg">
                        <Calendar className="h-4 w-4" />
                        <span>{announcements[currentIndex].date}</span>
                      </div>
                    )}
                  </div>

                  {/* Title - Full Width */}
                  <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 text-white leading-tight drop-shadow-2xl">
                    {announcements[currentIndex].title}
                  </h3>

                  {/* Content - Full Width with better readability */}
                  <div className="max-w-5xl">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
                      <div className="prose prose-lg prose-invert max-w-none overflow-y-auto max-h-[300px] md:max-h-[350px] custom-scrollbar">
                        <p className="text-white text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-light">
                          {announcements[currentIndex].content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {announcements.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white/30 group"
              aria-label="Annonce précédente"
            >
              <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md hover:bg-white/30 p-4 rounded-full shadow-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white/30 group"
              aria-label="Annonce suivante"
            >
              <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator - Below the carousel */}
      {announcements.length > 1 && (
        <div className="relative z-10 bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
          <div className="flex justify-center gap-3">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  index === currentIndex
                    ? 'w-12 h-3 bg-gradient-to-r from-primary to-primary-dark shadow-lg'
                    : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-primary/50 hover:scale-110'
                }`}
                aria-label={`Aller à l'annonce ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
            {currentIndex + 1} / {announcements.length}
          </div>
        </div>
      )}
    </section>
  )
}
