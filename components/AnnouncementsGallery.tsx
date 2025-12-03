'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

// Function to parse content and extract URLs
function parseContentWithLinks(content: string): { text: string; links: string[] } {
  if (!content) return { text: '', links: [] }

  // Regex to match URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  const links: string[] = []

  // Extract all URLs
  const matches = content.match(urlRegex)
  if (matches) {
    matches.forEach(url => {
      // Ensure URL starts with http/https
      const fullUrl = url.startsWith('www.') ? `https://${url}` : url
      // Clean URL (remove trailing punctuation)
      const cleanUrl = fullUrl.replace(/[.,;:!?)]+$/, '')
      if (!links.includes(cleanUrl)) {
        links.push(cleanUrl)
      }
    })
  }

  // Remove URLs from text
  const text = content.replace(urlRegex, '').replace(/\s+/g, ' ').trim()

  return { text, links }
}

// Function to get a readable label from URL
function getLinkLabel(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '')
    if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'YouTube'
    if (hostname.includes('facebook')) return 'Facebook'
    if (hostname.includes('instagram')) return 'Instagram'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter'
    if (hostname.includes('whatsapp')) return 'WhatsApp'
    if (hostname.includes('telegram')) return 'Telegram'
    if (hostname.includes('forms.google')) return 'Formulaire'
    if (hostname.includes('docs.google')) return 'Document'
    if (hostname.includes('drive.google')) return 'Google Drive'
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)
  } catch {
    return 'Lien'
  }
}

interface Announcement {
  id: string
  title: string
  content?: string
  date?: string
  image: string
}

interface AnnouncementsGalleryProps {
  announcements: Announcement[]
}

export default function AnnouncementsGallery({ announcements }: AnnouncementsGalleryProps) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (announcements.length === 0) return null

  const openModal = (announcement: Announcement, index: number) => {
    setSelectedAnnouncement(announcement)
    setCurrentIndex(index)
  }

  const closeModal = () => {
    setSelectedAnnouncement(null)
  }

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % announcements.length
    setCurrentIndex(nextIndex)
    setSelectedAnnouncement(announcements[nextIndex])
  }

  const prevImage = () => {
    const prevIndex = (currentIndex - 1 + announcements.length) % announcements.length
    setCurrentIndex(prevIndex)
    setSelectedAnnouncement(announcements[prevIndex])
  }

  return (
    <>
      <section className="relative z-10 bg-white dark:bg-gray-900 w-full py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Calendar className="h-4 w-4" />
              Actualites
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Annonces
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Restez informes des dernieres annonces de notre mosquee
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => openModal(announcement, index)}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Image Container - Fixed aspect ratio */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={announcement.image}
                      alt={announcement.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Date badge */}
                    {announcement.date && (
                      <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {announcement.date}
                      </div>
                    )}

                    {/* View indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                        Voir l'annonce
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">
                      {announcement.title}
                    </h3>
                    {announcement.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {parseContentWithLinks(announcement.content).text}
                      </p>
                    )}
                  </div>

                  {/* Bottom accent bar */}
                  <div className="h-1 bg-gradient-to-r from-primary to-primary-dark transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={closeModal}
          >
            {/* Navigation buttons */}
            {announcements.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 bg-white/20 backdrop-blur-md hover:bg-white/30 p-3 md:p-4 rounded-full transition-all hover:scale-110"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 bg-white/20 backdrop-blur-md hover:bg-white/30 p-3 md:p-4 rounded-full transition-all hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              </>
            )}

            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-md hover:bg-white/30 p-3 rounded-full transition-all"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Modal content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={selectedAnnouncement.image}
                  alt={selectedAnnouncement.title}
                  className="w-full max-h-[60vh] object-contain bg-black"
                />
                {selectedAnnouncement.date && (
                  <div className="absolute top-4 right-4 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    {selectedAnnouncement.date}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {selectedAnnouncement.title}
                </h2>
                {selectedAnnouncement.content && (() => {
                  const { text, links } = parseContentWithLinks(selectedAnnouncement.content)
                  return (
                    <>
                      {text && (
                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                          {text}
                        </p>
                      )}
                      {links.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4">
                          {links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105"
                            >
                              <ExternalLink className="h-4 w-4" />
                              {getLinkLabel(link)}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Image counter */}
              {announcements.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {announcements.length}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
