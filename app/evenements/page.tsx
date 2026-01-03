'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { PricingConfig, getMinimumPrice } from '@/lib/pricing'
import { CategoryFilter, eventCategoryStyles } from '@/components/CategoryFilter'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ItemCard, eventCategoryColors } from '@/components/ItemCard'

type EventCategory = 'Tous' | 'Religieux' | 'Éducation' | 'Communauté' | 'Charité'

interface Event {
  id: string
  title: string
  slug?: string
  description?: string
  category: 'religieux' | 'communaute' | 'education' | 'charite'
  date: string
  startTime: string
  endTime: string
  location?: string
  attendees?: string
  registrationRequired?: boolean
  maxCapacity?: number
  requiresApproval?: boolean
  price?: number | string
  paymentType?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscriptionInterval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  pricing?: PricingConfig | null
}

interface EventAvailability {
  canRegister: boolean
  isFull: boolean
  isPast: boolean
  availableSpots: number | null
  registeredCount: number
}

// Mapping catégorie API vers label de filtre
const getCategoryLabel = (category: string): EventCategory => {
  const mapping: Record<string, EventCategory> = {
    religieux: 'Religieux',
    communaute: 'Communauté',
    education: 'Éducation',
    charite: 'Charité',
  }
  return mapping[category] || 'Religieux'
}

export default function EvenementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('Tous')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [availability, setAvailability] = useState<Record<string, EventAvailability>>({})

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    events.forEach((event) => {
      if (event.registrationRequired) {
        fetchAvailability(event.id)
      }
    })
  }, [events])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Erreur réseau')
      const data = await response.json()
      setEvents(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/availability`)
      if (response.ok) {
        const data = await response.json()
        setAvailability((prev) => ({ ...prev, [eventId]: data }))
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error)
    }
  }

  const categories: EventCategory[] = ['Tous', 'Religieux', 'Éducation', 'Communauté', 'Charité']

  const filteredEvents = selectedCategory === 'Tous'
    ? events
    : events.filter(event => getCategoryLabel(event.category) === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Déterminer le statut d'un événement
  const getEventStatus = (event: Event) => {
    if (!event.registrationRequired) return undefined

    const avail = availability[event.id]
    if (!avail) return { type: 'loading' as const }
    if (avail.isFull) return { type: 'full' as const }
    if (avail.isPast) return { type: 'past' as const }

    return {
      type: 'available' as const,
      availableSpots: avail.availableSpots ?? undefined,
      requiresApproval: event.requiresApproval,
    }
  }

  if (loading) {
    return <LoadingSpinner message="Chargement des événements..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Filter Section */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        styles={eventCategoryStyles}
        resultCount={filteredEvents.length}
        resultLabel="événement"
      />

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const categoryConfig = eventCategoryColors[event.category] || eventCategoryColors.religieux
            const priceInfo = getMinimumPrice(event.pricing, event.price)

            return (
              <ItemCard
                key={event.id}
                id={event.id}
                title={event.title}
                href={`/evenements/${event.slug || event.id}`}
                description={event.description}
                categoryConfig={categoryConfig}
                infos={[
                  { icon: 'calendar', label: '', value: formatDate(event.date) },
                  { icon: 'clock', label: '', value: `${event.startTime} - ${event.endTime}` },
                  ...(event.location ? [{ icon: 'location' as const, label: '', value: event.location }] : []),
                  ...(event.attendees ? [{ icon: 'users' as const, label: '', value: event.attendees }] : []),
                ]}
                price={event.registrationRequired ? {
                  amount: priceInfo.price,
                  label: priceInfo.isVariable ? 'Dès' : undefined,
                } : undefined}
                status={getEventStatus(event)}
              />
            )
          })}
        </div>

        {filteredEvents.length === 0 && (
          <EmptyState
            icon={Calendar}
            message="Aucun événement trouvé pour cette catégorie"
          />
        )}
      </section>
    </div>
  )
}
