'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Users, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { EventRestrictions, getRestrictionsMessage } from '@/types/restrictions'

interface Event {
  id: string
  title: string
  date: string
  location?: string
  start_time: string
  end_time: string
  restrictions?: EventRestrictions
}

interface EventRegistrationModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SmartEventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: EventRegistrationModalProps) {
  const restrictions = event.restrictions
  const restrictionsMessage = restrictions ? getRestrictionsMessage(restrictions) : null

  // Détermine le type de participation autorisé
  const allowIndividual = !restrictions?.enabled ||
                          restrictions.participation_type === 'INDIVIDUAL' ||
                          restrictions.participation_type === 'MIXED'
  const allowFamily = !restrictions?.enabled ||
                      restrictions.participation_type === 'FAMILY' ||
                      restrictions.participation_type === 'MIXED'
  const requiresGender = restrictions?.enabled && restrictions.allowed_gender !== 'ALL'
  const requiresAge = restrictions?.enabled && (restrictions.min_age !== null || restrictions.max_age !== null)

  const [participationType, setParticipationType] = useState<'INDIVIDUAL' | 'FAMILY'>(
    restrictions?.participation_type === 'FAMILY' ? 'FAMILY' : 'INDIVIDUAL'
  )

  const [formData, setFormData] = useState({
    // Contact
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    // Pour INDIVIDUAL
    participantGender: '',
    participantBirthDate: '',
    // Pour CHILD - Parent/Tuteur
    parentRelation: '', // Père, Mère, Tuteur légal
    // Pour FAMILY
    numberOfAdults: 1,
    numberOfChildren: 0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ageError, setAgeError] = useState('')

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Reset participationType si restrictions changent
  useEffect(() => {
    if (restrictions?.enabled) {
      if (restrictions.participation_type === 'FAMILY') {
        setParticipationType('FAMILY')
      } else if (restrictions.participation_type === 'INDIVIDUAL') {
        setParticipationType('INDIVIDUAL')
      }
    }
  }, [restrictions])

  // Pré-remplir le genre si restriction spécifique
  useEffect(() => {
    if (restrictions?.enabled && restrictions.allowed_gender && restrictions.allowed_gender !== 'ALL') {
      setFormData(prev => ({ ...prev, participantGender: restrictions.allowed_gender }))
    }
  }, [restrictions])

  // Validation en temps réel de l'âge
  useEffect(() => {
    if (!formData.participantBirthDate || !restrictions?.enabled) {
      setAgeError('')
      return
    }

    const age = calculateAge(formData.participantBirthDate)
    if (age === null) {
      setAgeError('')
      return
    }

    // Vérifier min_age
    if (restrictions.min_age !== null && age < restrictions.min_age) {
      if (restrictions.max_age !== null) {
        setAgeError(`Âge minimum requis: ${restrictions.min_age} ans (vous avez ${age} ans)`)
      } else {
        setAgeError(`Vous devez avoir au moins ${restrictions.min_age} ans (vous avez ${age} ans)`)
      }
      return
    }

    // Vérifier max_age
    if (restrictions.max_age !== null && age > restrictions.max_age) {
      if (restrictions.min_age !== null) {
        setAgeError(`Âge maximum autorisé: ${restrictions.max_age} ans (vous avez ${age} ans)`)
      } else {
        setAgeError(`Vous devez avoir maximum ${restrictions.max_age} ans (vous avez ${age} ans)`)
      }
      return
    }

    // Âge valide
    setAgeError('')
  }, [formData.participantBirthDate, restrictions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Préparer les données selon le type de participation
      const payload: any = {
        participationType,
        contactFirstName: formData.firstName,
        contactLastName: formData.lastName,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        notes: formData.notes,
      }

      if (participationType === 'INDIVIDUAL') {
        if (formData.participantGender) {
          payload.participantGender = formData.participantGender
        }
        if (formData.participantBirthDate) {
          payload.participantBirthDate = formData.participantBirthDate
        }
        // Relation parent si enfant
        if (formData.participantGender === 'CHILD' && formData.parentRelation) {
          payload.parentRelation = formData.parentRelation
        }
      } else {
        payload.numberOfAdults = formData.numberOfAdults
        payload.numberOfChildren = formData.numberOfChildren
      }

      const response = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess(false)
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          notes: '',
          participantGender: '',
          participantBirthDate: '',
          parentRelation: '',
          numberOfAdults: 1,
          numberOfChildren: 0,
        })
      }, 2000)
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
        <div className="sticky top-0 bg-primary text-white p-6 rounded-t-xl flex justify-between items-start z-10">
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
          {event.location && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Restrictions Info */}
        {restrictionsMessage && (
          <div className="mx-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">{restrictionsMessage}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                Inscription confirmée !
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Vous recevrez une confirmation par email.
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
          {/* Type de participation (si MIXED) */}
          {restrictions?.participation_type === 'MIXED' && (
            <div>
              <label className="block text-sm font-medium mb-3">
                Type d'inscription <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="INDIVIDUAL"
                    checked={participationType === 'INDIVIDUAL'}
                    onChange={(e) => setParticipationType('INDIVIDUAL')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Individuel</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="FAMILY"
                    checked={participationType === 'FAMILY'}
                    onChange={(e) => setParticipationType('FAMILY')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Famille/Groupe</span>
                </label>
              </div>
            </div>
          )}

          {/* Contact principal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              {participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD'
                ? '👨‍👩‍👧 Informations du parent/tuteur légal'
                : participationType === 'FAMILY'
                ? '👨‍👩‍👧‍👦 Informations du responsable du groupe'
                : 'Coordonnées du contact principal'}
            </h3>
            {participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD' && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Pour les inscriptions d'enfants, les coordonnées d'un parent ou tuteur légal sont obligatoires.
                </p>
              </div>
            )}
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

            <div className="grid md:grid-cols-2 gap-4 mt-4">
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
            </div>

            {/* Relation avec l'enfant (si CHILD) */}
            {participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Relation avec l'enfant <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.parentRelation}
                  onChange={(e) =>
                    setFormData({ ...formData, parentRelation: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                >
                  <option value="">Sélectionnez</option>
                  <option value="PERE">Père</option>
                  <option value="MERE">Mère</option>
                  <option value="TUTEUR">Tuteur légal</option>
                  <option value="AUTRE">Autre (oncle, tante, etc.)</option>
                </select>
              </div>
            )}
          </div>

          {/* INDIVIDUAL: Genre et Date de naissance */}
          {participationType === 'INDIVIDUAL' && (
            <div>
              <h3 className="font-semibold text-lg mb-4">Informations participant</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {requiresGender && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Genre {requiresGender && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      required={requiresGender}
                      value={formData.participantGender}
                      onChange={(e) =>
                        setFormData({ ...formData, participantGender: e.target.value })
                      }
                      disabled={restrictions?.enabled && restrictions.allowed_gender !== 'ALL'}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Sélectionnez</option>
                      <option value="MALE">Homme</option>
                      <option value="FEMALE">Femme</option>
                      <option value="CHILD">Enfant</option>
                    </select>
                    {restrictions?.enabled && restrictions.allowed_gender !== 'ALL' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Genre imposé par les restrictions de l'événement
                      </p>
                    )}
                  </div>
                )}

                {requiresAge && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date de naissance {requiresAge && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      required={requiresAge}
                      value={formData.participantBirthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, participantBirthDate: e.target.value })
                      }
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 ${
                        ageError
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {ageError ? (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {ageError}
                      </p>
                    ) : (
                      <>
                        {restrictions?.min_age !== null && restrictions?.max_age !== null && (
                          <p className="text-xs text-gray-500 mt-1">
                            Âge requis: {restrictions.min_age}-{restrictions.max_age} ans
                          </p>
                        )}
                        {restrictions?.min_age !== null && restrictions?.max_age === null && (
                          <p className="text-xs text-gray-500 mt-1">
                            Âge minimum: {restrictions.min_age} ans
                          </p>
                        )}
                        {restrictions?.min_age === null && restrictions?.max_age !== null && (
                          <p className="text-xs text-gray-500 mt-1">
                            Âge maximum: {restrictions.max_age} ans
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FAMILY: Nombre adultes et enfants */}
          {participationType === 'FAMILY' && (
            <div>
              <h3 className="font-semibold text-lg mb-4">Composition du groupe</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre d'adultes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.numberOfAdults}
                    onChange={(e) =>
                      setFormData({ ...formData, numberOfAdults: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre d'enfants
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.numberOfChildren}
                    onChange={(e) =>
                      setFormData({ ...formData, numberOfChildren: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total: {formData.numberOfAdults + formData.numberOfChildren} personne(s)
              </p>
            </div>
          )}

          {/* Notes */}
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

          {/* Buttons */}
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
              disabled={loading || success || !!ageError}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscription en cours...' : 'Confirmer l\'inscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
