'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Users, CheckCircle, AlertCircle, Info, CreditCard } from 'lucide-react'
import { EventRestrictions, getRestrictionsMessage } from '@/types/restrictions'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  date: string
  location?: string
  start_time: string
  end_time: string
  restrictions?: EventRestrictions
  // Champs de paiement
  price?: number | string
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscription_interval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

interface EventRegistrationModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: EventRegistrationModalProps) {
  const router = useRouter()
  const restrictions = event.restrictions
  const isFamily = restrictions?.enabled && (restrictions.participation_type === 'FAMILY' || restrictions.participation_type === 'MIXED')
  const requiresGender = restrictions?.enabled && restrictions.allowed_gender !== 'ALL'
  const requiresAge = restrictions?.enabled && (restrictions.min_age !== null || restrictions.max_age !== null)

  // Calcul du prix
  const price = event.price ? parseFloat(String(event.price)) : 0
  const isPaidEvent = event.payment_type && event.payment_type !== 'FREE' && price > 0
  const isSubscription = event.payment_type === 'SUBSCRIPTION'

  const [participationType, setParticipationType] = useState<'INDIVIDUAL' | 'FAMILY'>('INDIVIDUAL')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    attendees: 1,
    notes: '',
    // Pour INDIVIDUAL
    participantGender: '',
    participantBirthDate: '',
    // Pour FAMILY
    numberOfAdults: 1,
    numberOfChildren: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Calcul du prix total
  const totalAttendees = participationType === 'FAMILY'
    ? formData.numberOfAdults + formData.numberOfChildren
    : 1
  const totalPrice = price * totalAttendees

  // Labels pour les intervalles d'abonnement
  const intervalLabels: Record<string, string> = {
    WEEKLY: 'par semaine',
    MONTHLY: 'par mois',
    YEARLY: 'par an',
  }

  // Adapter le type de participation selon les restrictions
  useEffect(() => {
    if (restrictions?.enabled) {
      if (restrictions.participation_type === 'FAMILY') {
        setParticipationType('FAMILY')
      } else if (restrictions.participation_type === 'INDIVIDUAL') {
        setParticipationType('INDIVIDUAL')
      }
    }
  }, [restrictions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Préparer les données avec les bons noms de champs
      const submitData = {
        participationType,
        contactFirstName: formData.firstName,
        contactLastName: formData.lastName,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        notes: formData.notes,
        participantGender: formData.participantGender || undefined,
        participantBirthDate: formData.participantBirthDate || undefined,
        numberOfAdults: formData.numberOfAdults,
        numberOfChildren: formData.numberOfChildren,
      }

      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      setSuccess(true)

      // Si paiement requis, rediriger vers le checkout
      if (data.registration?.requiresPayment && data.registration?.checkoutUrl) {
        setTimeout(() => {
          router.push(data.registration.checkoutUrl)
        }, 1500)
      } else {
        // Sinon, fermer le modal normalement
        setTimeout(() => {
          onSuccess()
          onClose()
          setSuccess(false)
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            attendees: 1,
            notes: '',
            participantGender: '',
            participantBirthDate: '',
            numberOfAdults: 1,
            numberOfChildren: 0,
          })
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-primary text-white p-6 rounded-t-xl flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Inscription à l'événement</h2>
            <p className="text-white/90">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Event Info */}
        <div className="bg-gray-50 dark:bg-gray-700 p-6 space-y-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Calendar className="h-5 w-5 text-primary" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Users className="h-5 w-5 text-primary" />
            <span>
              {event.start_time} - {event.end_time}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{event.location}</span>
          </div>
          {/* Affichage du prix */}
          {isPaidEvent && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                {price} CHF / personne
                {isSubscription && event.subscription_interval && (
                  <span className="text-sm font-normal ml-1">
                    ({intervalLabels[event.subscription_interval] || 'récurrent'})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                {isPaidEvent ? 'Inscription enregistrée !' : 'Inscription confirmée !'}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {isPaidEvent
                  ? 'Redirection vers la page de paiement...'
                  : 'Vous recevrez une confirmation par email.'}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
              placeholder="votre.email@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
              placeholder="+41 XX XXX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre de participants
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.attendees}
              onChange={(e) =>
                setFormData({ ...formData, attendees: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes ou besoins spéciaux (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
              placeholder="Informations complémentaires..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscription en cours...' : (
                isPaidEvent
                  ? `Payer ${totalPrice} CHF${isSubscription ? ` ${intervalLabels[event.subscription_interval || 'MONTHLY']}` : ''}`
                  : 'Confirmer l\'inscription'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
