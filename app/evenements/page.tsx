'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, Users, Filter, CheckCircle } from 'lucide-react'
import { client } from '@/sanity/lib/client'
import { EventRegistrationModal } from '@/components/EventRegistrationModal'

type EventCategory = 'Tous' | 'Religieux' | 'Éducation' | 'Communauté' | 'Charité'

interface Event {
  _id: string
  title: string
  description: string
  category: 'religieux' | 'communaute' | 'education' | 'charite'
  date: string
  startTime: string
  endTime: string
  location: string
  attendees: string
  registrationRequired?: boolean
  maxCapacity?: number
  requiresApproval?: boolean
}

interface EventAvailability {
  canRegister: boolean
  isFull: boolean
  isPast: boolean
  availableSpots: number | null
  registeredCount: number
}

const getCategoryConfig = (category: string) => {
  const configs = {
    religieux: {
      label: 'Religieux',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-t-red-500',
    },
    communaute: {
      label: 'Communauté',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      borderColor: 'border-t-green-500',
    },
    education: {
      label: 'Éducation',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-t-blue-500',
    },
    charite: {
      label: 'Charité',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      borderColor: 'border-t-yellow-500',
    },
  }
  return configs[category as keyof typeof configs] || configs.religieux
}

export default function EvenementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('Tous')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [availability, setAvailability] = useState<Record<string, EventAvailability>>({})

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    // Charger la disponibilité pour chaque événement
    events.forEach((event) => {
      if (event.registrationRequired) {
        fetchAvailability(event._id)
      }
    })
  }, [events])

  const fetchEvents = async () => {
    try {
      const query = `*[_type == "event" && published == true] | order(date asc) {
        _id,
        title,
        description,
        category,
        date,
        startTime,
        endTime,
        location,
        attendees,
        registrationRequired,
        maxCapacity,
        requiresApproval
      }`
      const data = await client.fetch(query)
      setEvents(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error)
      // Événements de démonstration en cas d'erreur
      const demoEvents: Event[] = [
        {
          _id: '1',
          title: 'Préparation au Ramadan',
          description: 'Conférence sur la préparation spirituelle et pratique pour le mois béni de Ramadan. Discussion sur les mérites du jeûne et comment tirer le meilleur parti de ce mois.',
          category: 'religieux',
          date: '2024-12-15',
          startTime: '20h00',
          endTime: '22h00',
          location: 'Grande salle de prière',
          attendees: '100-150 personnes',
        },
        {
          _id: '2',
          title: 'Journée Portes Ouvertes',
          description: 'Découvrez notre mosquée et rencontrez la communauté. Visite guidée, présentation de nos activités, et rafraîchissements offerts.',
          category: 'communaute',
          date: '2024-12-22',
          startTime: '14h00',
          endTime: '18h00',
          location: 'Mosquée Madretsch',
          attendees: '200+ visiteurs attendus',
        },
        {
          _id: '3',
          title: 'Cours de Tafsir - Sourate Al-Kahf',
          description: 'Étude approfondie de Sourate Al-Kahf avec Cheikh Mohammed. Analyse des enseignements et leçons à tirer.',
          category: 'education',
          date: '2024-12-28',
          startTime: '19h30',
          endTime: '21h00',
          location: 'Salle de cours',
          attendees: '30-40 étudiants',
        },
        {
          _id: '4',
          title: 'Collecte Alimentaire',
          description: 'Grande collecte alimentaire pour les familles dans le besoin. Denrées non périssables acceptées.',
          category: 'charite',
          date: '2025-01-05',
          startTime: '10h00',
          endTime: '16h00',
          location: 'Parvis de la mosquée',
          attendees: 'Ouvert à tous',
        },
        {
          _id: '5',
          title: 'Célébration du Mawlid',
          description: 'Célébration de la naissance du Prophète Muhammad (PSL) avec chants religieux, conférence et repas communautaire.',
          category: 'religieux',
          date: '2025-01-12',
          startTime: '15h00',
          endTime: '18h00',
          location: 'Grande salle',
          attendees: 'Toute la communauté',
        },
        {
          _id: '6',
          title: 'Atelier Éducation des Enfants',
          description: 'Atelier pour parents sur l\'éducation islamique des enfants à l\'ère numérique. Animé par Dr. Fatima Zahri.',
          category: 'education',
          date: '2025-01-19',
          startTime: '18h00',
          endTime: '20h00',
          location: 'Salle de conférence',
          attendees: 'Parents et éducateurs',
        },
        {
          _id: '7',
          title: 'Iftar Communautaire',
          description: 'Rassemblement pour rompre le jeûne ensemble durant le mois de Ramadan. Repas offert à tous.',
          category: 'communaute',
          date: '2025-03-15',
          startTime: '19h30',
          endTime: '21h30',
          location: 'Grande salle',
          attendees: '150-200 personnes',
        },
        {
          _id: '8',
          title: 'Distribution Zakat Al-Fitr',
          description: 'Collecte et distribution de la Zakat Al-Fitr pour les nécessiteux.',
          category: 'charite',
          date: '2025-04-10',
          startTime: '09h00',
          endTime: '18h00',
          location: 'Bureau de la mosquée',
          attendees: 'Toute la communauté',
        },
        {
          _id: '9',
          title: 'Prière de l\'Aïd Al-Fitr',
          description: 'Célébration de l\'Aïd Al-Fitr avec deux sessions de prière. Venez en famille !',
          category: 'religieux',
          date: '2025-04-11',
          startTime: '08h00',
          endTime: '09h30',
          location: 'Parc Municipal (si beau temps)',
          attendees: '500+ fidèles',
        },
        {
          _id: '10',
          title: 'Cours d\'Arabe pour Débutants',
          description: 'Nouveau cours d\'arabe pour adultes débutants. Inscription obligatoire.',
          category: 'education',
          date: '2025-02-01',
          startTime: '18h30',
          endTime: '20h00',
          location: 'Salle de classe',
          attendees: '15-20 participants',
          registrationRequired: true,
          maxCapacity: 20,
          requiresApproval: false,
        },
      ]
      setEvents(demoEvents)
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
    : events.filter(event => getCategoryConfig(event.category).label === selectedCategory)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement des événements...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Filter Section */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Filtrer par catégorie</h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gray-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} trouvé{filteredEvents.length > 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const config = getCategoryConfig(event.category)

            return (
              <div
                key={event._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-t-4"
                style={{ borderTopColor: config.color.replace('bg-', '') === 'red-500' ? '#ef4444' : config.color.replace('bg-', '') === 'green-500' ? '#22c55e' : config.color.replace('bg-', '') === 'blue-500' ? '#3b82f6' : '#eab308' }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold pr-2 flex-1">{event.title}</h3>
                    <span className={`${config.color} text-white text-xs px-3 py-1 rounded-full whitespace-nowrap`}>
                      {config.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className={`h-4 w-4 ${config.textColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(event.date)}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Clock className={`h-4 w-4 ${config.textColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-700 dark:text-gray-300">
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className={`h-4 w-4 ${config.textColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-700 dark:text-gray-300">{event.location}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <Users className={`h-4 w-4 ${config.textColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-gray-700 dark:text-gray-300">{event.attendees}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                    {event.description}
                  </p>

                  {/* Badge et bouton d'inscription */}
                  {event.registrationRequired && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {availability[event._id] ? (
                        <>
                          {availability[event._id].isFull ? (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium text-center">
                              Complet
                            </div>
                          ) : availability[event._id].isPast ? (
                            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-center">
                              Événement terminé
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {availability[event._id].availableSpots && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Places restantes:
                                  </span>
                                  <span className={`font-semibold ${
                                    availability[event._id].availableSpots! <= 5
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-green-600 dark:text-green-400'
                                  }`}>
                                    {availability[event._id].availableSpots}
                                  </span>
                                </div>
                              )}
                              <button
                                onClick={() => setSelectedEvent(event)}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
                              >
                                <CheckCircle className="h-4 w-4" />
                                S'inscrire
                              </button>
                              {event.requiresApproval && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  Inscription soumise à approbation
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-center">
                          Chargement...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">Aucun événement trouvé pour cette catégorie</p>
          </div>
        )}
      </section>

      {/* Modal d'inscription */}
      {selectedEvent && (
        <EventRegistrationModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => {
            // Recharger la disponibilité après inscription
            if (selectedEvent) {
              fetchAvailability(selectedEvent._id)
            }
          }}
        />
      )}
    </div>
  )
}
