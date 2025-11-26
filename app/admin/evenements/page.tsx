'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, TrendingUp, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface EventRegistration {
  id: string
  eventId: string
  eventTitle: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  attendees: number
  notes: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  } | null
}

export default function EvenementsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    totalAttendees: 0,
    uniqueEvents: 0,
  })

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/event-registrations')
      const data = await response.json()
      setRegistrations(data)

      // Calculer les stats
      const uniqueEvents = new Set(data.map((r: EventRegistration) => r.eventId)).size
      const totalAttendees = data.reduce((sum: number, r: EventRegistration) => sum + r.attendees, 0)

      setStats({
        total: data.length,
        totalAttendees,
        uniqueEvents,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter((registration) => {
    const matchesSearch =
      registration.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Grouper par événement
  const eventStats = registrations.reduce((acc: any, reg) => {
    if (!acc[reg.eventId]) {
      acc[reg.eventId] = {
        title: reg.eventTitle,
        registrations: 0,
        attendees: 0,
      }
    }
    acc[reg.eventId].registrations++
    acc[reg.eventId].attendees += reg.attendees
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inscriptions</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-3xl font-bold mt-2">{stats.totalAttendees}</p>
            </div>
            <Users className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Événements</p>
              <p className="text-3xl font-bold mt-2">{stats.uniqueEvents}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Stats par événement */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Inscriptions par événement</h3>
        <div className="space-y-4">
          {Object.entries(eventStats).map(([eventId, stats]: [string, any]) => (
            <div key={eventId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium">{stats.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.registrations} inscription{stats.registrations > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{stats.attendees}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">participants</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par événement, nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des inscriptions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nb. Personnes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date Inscription
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune inscription trouvée
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{registration.eventTitle}</div>
                      {registration.notes && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {registration.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {registration.firstName} {registration.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-600 dark:text-gray-400">{registration.email}</div>
                        {registration.phone && (
                          <div className="text-gray-500 dark:text-gray-500">{registration.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold">
                        {registration.attendees} personne{registration.attendees > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(registration.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Résumé */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredRegistrations.length} inscription{filteredRegistrations.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
