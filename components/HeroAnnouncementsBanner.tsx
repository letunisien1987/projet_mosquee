'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Announcement {
  id: string
  title: string
  content: string
  date?: string
  image?: string
}

interface HeroAnnouncementsBannerProps {
  announcements: Announcement[]
}

export default function HeroAnnouncementsBanner({ announcements }: HeroAnnouncementsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Auto-play carousel
  useEffect(() => {
    if (announcements.length <= 1 || !isVisible) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(timer)
  }, [currentIndex, announcements.length, isVisible])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)
  }

  if (!announcements || announcements.length === 0 || !isVisible) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-primary via-primary-dark to-primary text-white overflow-hidden">
      <div className="absolute inset-0 islamic-pattern opacity-10"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 py-3">
          {/* Left Arrow */}
          {announcements.length > 1 && (
            <button
              onClick={prevSlide}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex-shrink-0"
              aria-label="Annonce précédente"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Announcement Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                {/* Icon/Badge */}
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                    ANNONCE
                  </div>
                  {announcements[currentIndex].date && (
                    <span className="text-xs text-white/70 hidden sm:inline">
                      {announcements[currentIndex].date}
                    </span>
                  )}
                </div>

                {/* Title and Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {announcements[currentIndex].title}
                  </p>
                  {announcements[currentIndex].content && (
                    <p className="text-sm text-white/80 truncate hidden md:block">
                      {announcements[currentIndex].content}
                    </p>
                  )}
                </div>

                {/* Counter for mobile */}
                {announcements.length > 1 && (
                  <div className="text-xs text-white/60 sm:hidden">
                    {currentIndex + 1}/{announcements.length}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow */}
          {announcements.length > 1 && (
            <button
              onClick={nextSlide}
              className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex-shrink-0"
              aria-label="Annonce suivante"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {/* Dots indicator for desktop */}
          {announcements.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all rounded-full ${
                    index === currentIndex
                      ? 'w-6 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Aller à l'annonce ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex-shrink-0"
            aria-label="Fermer les annonces"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
