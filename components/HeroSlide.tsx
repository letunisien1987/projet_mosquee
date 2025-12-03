'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

interface DateInfo {
  label: string
  value: string
  isArabic?: boolean
}

interface HeroSlideProps {
  title: string
  content: string
  backgroundImage?: string
  dateInfos: DateInfo[]
  slideVariants: {
    enter: (direction: number) => { x: number; opacity: number }
    center: { zIndex: number; x: number; opacity: number }
    exit: (direction: number) => { zIndex: number; x: number; opacity: number }
  }
  direction: number
  index: number
}

// Function to parse content and extract URLs
function parseContentWithLinks(content: string): { text: string; links: string[] } {
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
    // Return a friendly name based on common domains
    if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'YouTube'
    if (hostname.includes('facebook')) return 'Facebook'
    if (hostname.includes('instagram')) return 'Instagram'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'Twitter'
    if (hostname.includes('whatsapp')) return 'WhatsApp'
    if (hostname.includes('telegram')) return 'Telegram'
    if (hostname.includes('forms.google')) return 'Formulaire'
    if (hostname.includes('docs.google')) return 'Document'
    if (hostname.includes('drive.google')) return 'Google Drive'
    // Return domain name for other URLs
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1)
  } catch {
    return 'Lien'
  }
}

export default function HeroSlide({
  title,
  content,
  backgroundImage,
  dateInfos,
  slideVariants,
  direction,
  index,
}: HeroSlideProps) {
  const { text, links } = parseContentWithLinks(content)
  return (
    <motion.div
      key={index}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      className="w-full h-full relative overflow-hidden"
    >
      {/* Background image if available */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

      {/* Islamic pattern overlay */}
      <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none"></div>

      {/* Centered content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="text-center space-y-6 px-4 max-w-4xl">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            {title}
          </h1>

          {/* Content (text without URLs) */}
          {text && (
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {text}
            </p>
          )}

          {/* Link buttons */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:scale-105 border border-white/30"
                >
                  <ExternalLink className="h-4 w-4" />
                  {getLinkLabel(link)}
                </a>
              ))}
            </div>
          )}

          {/* Date info row - Enhanced styling */}
          <div className="flex flex-wrap gap-3 justify-center items-center pt-4">
            {dateInfos.map((info, idx) => {
              const isJumua = info.label.toLowerCase().includes('joumou') || info.label.toLowerCase().includes('jumua')
              const isHijri = info.label.toLowerCase().includes('hijri')

              return (
                <div
                  key={idx}
                  className={`px-4 py-2 rounded-xl backdrop-blur-md transition-all ${
                    isJumua
                      ? 'bg-amber-500/30 border-2 border-amber-400/50 shadow-lg shadow-amber-500/20'
                      : isHijri
                        ? 'bg-emerald-500/20 border border-emerald-400/40'
                        : 'bg-white/10 border border-white/20'
                  }`}
                >
                  <p className={`text-xs uppercase tracking-wider mb-1 ${
                    isJumua ? 'text-amber-200' : isHijri ? 'text-emerald-200' : 'text-white/60'
                  }`}>
                    {info.label}
                  </p>
                  <p className={`text-lg font-bold ${
                    isJumua ? 'text-amber-100' : isHijri ? 'text-emerald-100' : 'text-white'
                  } ${info.isArabic ? 'arabic-text' : ''}`}>
                    {info.value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
