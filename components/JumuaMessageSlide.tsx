'use client'

import Image from 'next/image'
import { Calendar } from 'lucide-react'

interface JumuaMessageSlideProps {
  title: string
  message: string
  image?: {
    url: string
    alt?: string
  }
  times: string[]
  isFriday: boolean
}

export function JumuaMessageSlide({
  title,
  message,
  image,
  times,
  isFriday
}: JumuaMessageSlideProps) {
  return (
    <div className="bg-gradient-to-br from-[#fc4245] to-[#e63946] rounded-2xl shadow-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Section Image (si disponible) */}
        {image && (
          <div className="relative h-64 md:h-auto">
            <Image
              src={image.url}
              alt={image.alt || title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          </div>
        )}

        {/* Section Contenu */}
        <div className={`p-8 md:p-10 text-white ${!image ? 'md:col-span-2' : ''}`}>
          {/* Badge Vendredi */}
          {isFriday && (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Calendar className="h-5 w-5" />
              <span className="font-bold text-sm">Aujourd'hui</span>
            </div>
          )}

          {/* Titre */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>

          {/* Message */}
          <p className="text-lg md:text-xl leading-relaxed mb-6 text-white/90">
            {message}
          </p>

          {/* Horaires des Prêches */}
          {times && times.length > 0 && (
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4 text-white/80">
                Horaires des Prêches
              </h3>
              <div className="flex flex-wrap gap-3">
                {times.map((time, index) => (
                  <div
                    key={index}
                    className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-2xl font-bold">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
