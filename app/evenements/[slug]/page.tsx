'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Calendar, Clock, Loader2, CheckCircle,
  AlertCircle, Info, CreditCard, User, Users
} from 'lucide-react'
import { EventRestrictions, getRestrictionsMessage } from '@/types/restrictions'
import { PricingConfig, calculatePrice, isPaidItem } from '@/lib/pricing'
import {
  RegistrationLayout,
  RegistrationLoading,
  RegistrationNotFound,
  GradientConfig
} from '@/components/RegistrationLayout'
import { RegistrationInfoCard, InfoItem } from '@/components/RegistrationInfoCard'
import { RegistrationSuccess } from '@/components/RegistrationSuccess'
import { ContactFormFields, ContactFormData, NotesField } from '@/components/ContactFormFields'
import { ChildSelector } from '@/components/ChildSelector'
import { useChildren, type Child } from '@/hooks/useChildren'

interface Event {
  id: string
  title: string
  slug: string
  description?: string
  content?: string
  category: 'religieux' | 'communaute' | 'education' | 'charite'
  date: string
  start_time: string
  end_time: string
  location?: string
  attendees?: string
  registration_required?: boolean
  max_capacity?: number
  requires_approval?: boolean
  restrictions?: EventRestrictions
  price?: number | string
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscription_interval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  pricing?: PricingConfig | null
  min_age?: number
  max_age?: number
  gender_restriction?: 'MALE' | 'FEMALE'
}

interface EventAvailability {
  canRegister: boolean
  isFull: boolean
  isPast: boolean
  availableSpots: number | null
  registeredCount: number
}

const categoryConfigs: Record<string, GradientConfig> = {
  religieux: {
    label: 'Religieux',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    gradient: 'from-red-600 to-red-700',
  },
  communaute: {
    label: 'Communauté',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    gradient: 'from-green-600 to-green-700',
  },
  education: {
    label: 'Éducation',
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  charite: {
    label: 'Charité',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    gradient: 'from-yellow-600 to-yellow-700',
  },
}

const intervalLabels: Record<string, string> = {
  WEEKLY: '/semaine',
  MONTHLY: '/mois',
  YEARLY: '/an',
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const eventSlug = params.slug as string
  const { children, calculateAge: calcChildAge, getChildById } = useChildren()

  const [event, setEvent] = useState<Event | null>(null)
  const [availability, setAvailability] = useState<EventAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ageError, setAgeError] = useState('')

  // Restrictions
  const restrictions = event?.restrictions
  const restrictionsMessage = restrictions ? getRestrictionsMessage(restrictions) : null
  const allowIndividual = !restrictions?.enabled ||
    restrictions.participation_type === 'INDIVIDUAL' ||
    restrictions.participation_type === 'MIXED'
  const requiresGender = restrictions?.enabled && restrictions.allowed_gender !== 'ALL'
  const requiresAge = restrictions?.enabled && (restrictions.min_age !== null || restrictions.max_age !== null)

  // Type de participation: INDIVIDUAL (moi-même), FAMILY (groupe), CHILDREN (mes enfants)
  const [participationType, setParticipationType] = useState<'INDIVIDUAL' | 'FAMILY' | 'CHILDREN'>('INDIVIDUAL')

  // Enfants sélectionnés pour le mode CHILDREN
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])

  // Pour visiteurs non connectés - ajout enfant inline
  const [inlineChild, setInlineChild] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
  })

  const [contactData, setContactData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })

  const [formData, setFormData] = useState({
    participantGender: '',
    participantBirthDate: '',
    parentRelation: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
  })

  // Enfants sélectionnés (objets complets)
  const selectedChildren = useMemo(() => {
    return selectedChildIds
      .map(id => getChildById(id))
      .filter((c): c is Child => c !== undefined)
  }, [selectedChildIds, getChildById])

  // Prix
  const fallbackPrice = event?.price ? parseFloat(String(event.price)) : 0
  const isPaidEvent = event ? isPaidItem(event.payment_type, event.price, event.pricing) : false
  const isSubscription = event?.payment_type === 'SUBSCRIPTION'

  const priceResult = useMemo(() => {
    if (!event) return { total: 0, breakdown: [], discountAmount: 0, discountReason: '' }

    let numberOfAdults = 0
    let numberOfChildren = 0

    if (participationType === 'INDIVIDUAL') {
      numberOfAdults = 1
    } else if (participationType === 'FAMILY') {
      numberOfAdults = formData.numberOfAdults
      numberOfChildren = formData.numberOfChildren
    } else if (participationType === 'CHILDREN') {
      numberOfChildren = selectedChildIds.length
    }

    return calculatePrice(event.pricing || null, {
      numberOfAdults,
      numberOfChildren,
      registrationDate: new Date(),
    }, fallbackPrice)
  }, [event, participationType, formData.numberOfAdults, formData.numberOfChildren, selectedChildIds.length, fallbackPrice])

  useEffect(() => {
    fetchEvent()
  }, [eventSlug])

  useEffect(() => {
    if (event?.id && event.registration_required) {
      fetchAvailability(event.id)
    }
  }, [event?.id])

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      setContactData(prev => ({
        ...prev,
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
    }
  }, [session])

  useEffect(() => {
    if (restrictions?.enabled) {
      if (restrictions.participation_type === 'FAMILY') {
        setParticipationType('FAMILY')
      } else if (restrictions.participation_type === 'INDIVIDUAL') {
        setParticipationType('INDIVIDUAL')
      }
    }
  }, [restrictions])

  useEffect(() => {
    if (restrictions?.enabled && restrictions.allowed_gender && restrictions.allowed_gender !== 'ALL') {
      setFormData(prev => ({ ...prev, participantGender: restrictions.allowed_gender! }))
    }
  }, [restrictions])

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
    if (restrictions.min_age !== null && age < restrictions.min_age) {
      setAgeError(`Âge minimum requis: ${restrictions.min_age} ans (vous avez ${age} ans)`)
      return
    }
    if (restrictions.max_age !== null && age > restrictions.max_age) {
      setAgeError(`Âge maximum autorisé: ${restrictions.max_age} ans (vous avez ${age} ans)`)
      return
    }
    setAgeError('')
  }, [formData.participantBirthDate, restrictions])

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

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/by-slug/${eventSlug}`)
      if (res.ok) {
        const data = await res.json()
        setEvent(data)
      } else {
        const resById = await fetch(`/api/events/${eventSlug}`)
        if (resById.ok) {
          const data = await resById.json()
          setEvent(data)
        } else {
          setError('Événement non trouvé')
        }
      }
    } catch (err) {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/availability`)
      if (res.ok) {
        const data = await res.json()
        setAvailability(data)
      }
    } catch (err) {
      console.error('Erreur disponibilité:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleNewChildAdded = (child: Child) => {
    setSelectedChildIds(prev => [...prev, child.id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    // Validation pour le mode CHILDREN
    if (participationType === 'CHILDREN') {
      if (session && selectedChildIds.length === 0) {
        setError('Veuillez sélectionner au moins un enfant')
        return
      }
      if (!session && (!inlineChild.firstName || !inlineChild.lastName || !inlineChild.birthDate)) {
        setError('Veuillez remplir les informations de l\'enfant')
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const payload: any = {
        contactFirstName: contactData.firstName,
        contactLastName: contactData.lastName,
        contactEmail: contactData.email,
        contactPhone: contactData.phone,
        notes: contactData.notes,
      }

      if (participationType === 'CHILDREN') {
        payload.participationType = 'CHILDREN'

        if (session && selectedChildIds.length > 0) {
          // Utilisateur connecté avec enfants sélectionnés
          if (selectedChildIds.length === 1) {
            payload.childId = selectedChildIds[0]
          } else {
            payload.childIds = selectedChildIds
          }
        } else if (!session) {
          // Visiteur non connecté : nouvel enfant inline
          payload.inlineChildFirstName = inlineChild.firstName
          payload.inlineChildLastName = inlineChild.lastName
          payload.inlineChildBirthDate = inlineChild.birthDate
        }
      } else if (participationType === 'INDIVIDUAL') {
        payload.participationType = 'INDIVIDUAL'
        if (formData.participantGender) {
          payload.participantGender = formData.participantGender
        }
        if (formData.participantBirthDate) {
          payload.participantBirthDate = formData.participantBirthDate
        }
        if (formData.participantGender === 'CHILD' && formData.parentRelation) {
          payload.parentRelation = formData.parentRelation
        }
      } else {
        // FAMILY
        payload.participationType = 'FAMILY'
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

      // Pour les inscriptions batch d'enfants avec paiement
      if (data.checkoutUrl) {
        setTimeout(() => {
          router.push(data.checkoutUrl)
        }, 1500)
      } else if (data.registration?.requiresPayment && data.registration?.checkoutUrl) {
        setTimeout(() => {
          router.push(data.registration.checkoutUrl)
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <RegistrationLoading accentColor="text-red-600" />
  }

  if (!event) {
    return (
      <RegistrationNotFound
        message="Événement non trouvé"
        backHref="/evenements"
        backLabel="Retour aux événements"
        accentColor="text-red-600"
      />
    )
  }

  const config = categoryConfigs[event.category] || categoryConfigs.religieux

  if (success) {
    let successTitle = 'Inscription confirmée !'
    let successMessage = 'Vous recevrez un email de confirmation.'

    if (event.requires_approval) {
      successTitle = 'Demande envoyée !'
      if (isPaidEvent) {
        successMessage = 'Votre demande d\'inscription a été envoyée. Après approbation par l\'organisateur, vous recevrez un email avec le lien de paiement.'
      } else {
        successMessage = 'Votre demande d\'inscription a été envoyée. Vous serez contacté après validation par l\'organisateur.'
      }
    } else if (isPaidEvent) {
      successTitle = 'Inscription enregistrée !'
      successMessage = 'Redirection vers la page de paiement...'
    }

    return (
      <RegistrationSuccess
        title={successTitle}
        message={successMessage}
        backHref="/evenements"
        backLabel="Retour aux événements"
        showMyRegistrations={!!session}
        myRegistrationsHref="/dashboard/evenements"
        myRegistrationsLabel="Voir mes inscriptions"
      />
    )
  }

  // Build info items
  const infoItems: InfoItem[] = [
    { icon: 'calendar', label: 'Date', value: formatDate(event.date) },
    { icon: 'clock', label: 'Horaire', value: `${event.start_time} - ${event.end_time}` },
  ]

  if (event.location) {
    infoItems.push({ icon: 'location', label: 'Lieu', value: event.location })
  }

  if (event.attendees) {
    infoItems.push({ icon: 'users', label: 'Public', value: event.attendees })
  }

  if (availability && event.max_capacity) {
    infoItems.push({
      icon: 'users',
      label: 'Places',
      value: `${availability.availableSpots} places restantes`,
      highlight: !!availability.availableSpots && availability.availableSpots <= 5
    })
  }

  // Restrictions pour le ChildSelector
  const childAgeRestriction = (event.min_age || event.max_age || restrictions?.min_age || restrictions?.max_age)
    ? {
        min: event.min_age || restrictions?.min_age || undefined,
        max: event.max_age || restrictions?.max_age || undefined
      }
    : undefined

  const childGenderRestriction = event.gender_restriction ||
    (restrictions?.allowed_gender !== 'ALL' ? restrictions?.allowed_gender as 'MALE' | 'FEMALE' : undefined)

  return (
    <RegistrationLayout
      title={event.title}
      description={event.description}
      backHref="/evenements"
      backLabel="Retour aux événements"
      gradientConfig={config}
      showCategoryBadge
    >
      {/* Sidebar */}
      <RegistrationInfoCard
        infos={infoItems}
        price={event.registration_required ? {
          amount: fallbackPrice,
          isPaid: isPaidEvent,
          interval: isSubscription && event.subscription_interval ? intervalLabels[event.subscription_interval] : undefined
        } : undefined}
        warningMessage={event.requires_approval ? 'Inscription soumise à approbation' : undefined}
        accentColor={config.textColor}
      />

      {/* Form */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className={`h-5 w-5 ${config.textColor}`} />
            S'inscrire à cet événement
          </h2>

          {restrictionsMessage && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{restrictionsMessage}</p>
            </div>
          )}

          {!event.registration_required ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Entrée libre</h3>
              <p className="text-gray-600">
                Cet événement ne nécessite pas d'inscription préalable.
              </p>
            </div>
          ) : availability?.isFull ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Complet</h3>
              <p className="text-gray-600">
                Cet événement a atteint sa capacité maximale.
              </p>
            </div>
          ) : availability?.isPast ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Événement terminé</h3>
              <p className="text-gray-600">
                Cet événement a déjà eu lieu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Type de participation - Avec option CHILDREN */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cette inscription est pour :
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(!restrictions?.enabled || restrictions.participation_type !== 'FAMILY') && (
                    <button
                      type="button"
                      onClick={() => {
                        setParticipationType('INDIVIDUAL')
                        setSelectedChildIds([])
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        participationType === 'INDIVIDUAL'
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium text-sm">Moi-même</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setParticipationType('CHILDREN')
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      participationType === 'CHILDREN'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium text-sm">Mon/mes enfant(s)</span>
                  </button>
                  {(!restrictions?.enabled || restrictions.participation_type !== 'INDIVIDUAL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setParticipationType('FAMILY')
                        setSelectedChildIds([])
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        participationType === 'FAMILY'
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium text-sm">Famille/Groupe</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Contact principal */}
              <ContactFormFields
                data={contactData}
                onChange={setContactData}
                title={
                  participationType === 'CHILDREN'
                    ? 'Vos informations (Parent/Tuteur)'
                    : participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD'
                      ? 'Informations du parent/tuteur légal'
                      : participationType === 'FAMILY'
                        ? 'Informations du responsable du groupe'
                        : 'Vos informations'
                }
                showNotes={false}
              />

              {/* MODE CHILDREN : Sélection des enfants */}
              {participationType === 'CHILDREN' && (
                <div className="mb-6">
                  {session ? (
                    <ChildSelector
                      mode="multiple"
                      selectedChildIds={selectedChildIds}
                      onSelectionChange={setSelectedChildIds}
                      onNewChildAdded={handleNewChildAdded}
                      showInlineAdd={true}
                      showModalLink={true}
                      ageRestriction={childAgeRestriction}
                      genderRestriction={childGenderRestriction}
                      title="Sélectionnez vos enfants"
                      description="Choisissez les enfants à inscrire à cet événement"
                      className="mb-4"
                    />
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-red-600" />
                        Informations de l'enfant
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Prénom de l'enfant *</label>
                          <input
                            type="text"
                            required
                            value={inlineChild.firstName}
                            onChange={(e) => setInlineChild({ ...inlineChild, firstName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Prénom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Nom de l'enfant *</label>
                          <input
                            type="text"
                            required
                            value={inlineChild.lastName}
                            onChange={(e) => setInlineChild({ ...inlineChild, lastName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Nom"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-2">Date de naissance *</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="date"
                              required
                              value={inlineChild.birthDate}
                              onChange={(e) => setInlineChild({ ...inlineChild, birthDate: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        <Link href="/connexion" className="text-red-600 hover:underline">
                          Connectez-vous
                        </Link>
                        {' '}pour gérer vos enfants et les réutiliser pour d'autres inscriptions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Relation avec l'enfant (mode INDIVIDUAL + gender CHILD) */}
              {participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD' && (
                <div className="mb-6">
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Pour les enfants, les coordonnées d'un parent ou tuteur légal sont obligatoires.
                    </p>
                  </div>
                  <label className="block text-sm font-medium mb-2">
                    Relation avec l'enfant <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.parentRelation}
                    onChange={(e) => setFormData({ ...formData, parentRelation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="PERE">Père</option>
                    <option value="MERE">Mère</option>
                    <option value="TUTEUR">Tuteur légal</option>
                    <option value="AUTRE">Autre (oncle, tante, etc.)</option>
                  </select>
                </div>
              )}

              {/* INDIVIDUAL: Genre et Date de naissance */}
              {participationType === 'INDIVIDUAL' && (requiresGender || requiresAge) && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Informations participant</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {requiresGender && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Genre <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.participantGender}
                          onChange={(e) => setFormData({ ...formData, participantGender: e.target.value })}
                          disabled={restrictions?.enabled && restrictions.allowed_gender !== 'ALL'}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Sélectionnez</option>
                          <option value="MALE">Homme</option>
                          <option value="FEMALE">Femme</option>
                          <option value="CHILD">Enfant</option>
                        </select>
                        {restrictions?.enabled && restrictions.allowed_gender !== 'ALL' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Genre imposé par les restrictions
                          </p>
                        )}
                      </div>
                    )}

                    {requiresAge && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Date de naissance <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.participantBirthDate}
                          onChange={(e) => setFormData({ ...formData, participantBirthDate: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${ageError ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {ageError ? (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {ageError}
                          </p>
                        ) : (
                          restrictions?.min_age !== null && restrictions?.max_age !== null && (
                            <p className="text-xs text-gray-500 mt-1">
                              Âge requis: {restrictions.min_age}-{restrictions.max_age} ans
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FAMILY: Nombre adultes et enfants */}
              {participationType === 'FAMILY' && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Composition du groupe</h3>
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
                        onChange={(e) => setFormData({ ...formData, numberOfAdults: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre d'enfants</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.numberOfChildren}
                        onChange={(e) => setFormData({ ...formData, numberOfChildren: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <NotesField
                value={contactData.notes || ''}
                onChange={(value) => setContactData({ ...contactData, notes: value })}
                placeholder="Besoins spécifiques, allergies..."
              />

              {/* Résumé */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-bold mb-3">Résumé</h4>
                <div className="text-sm space-y-2 text-gray-700">
                  <p><strong>Événement:</strong> {event.title}</p>
                  <p><strong>Date:</strong> {formatDate(event.date)}</p>

                  {/* Participants */}
                  <div className="pt-2 border-t border-gray-200">
                    <strong>Participant(s):</strong>
                    {participationType === 'INDIVIDUAL' ? (
                      <span className="ml-2">{contactData.firstName} {contactData.lastName}</span>
                    ) : participationType === 'CHILDREN' && session && selectedChildren.length > 0 ? (
                      <ul className="mt-1 ml-4 list-disc">
                        {selectedChildren.map(child => (
                          <li key={child.id}>
                            {child.firstName} {child.lastName} ({calcChildAge(child.birthDate)} ans)
                          </li>
                        ))}
                      </ul>
                    ) : participationType === 'CHILDREN' && !session && inlineChild.firstName ? (
                      <span className="ml-2">{inlineChild.firstName} {inlineChild.lastName}</span>
                    ) : participationType === 'FAMILY' ? (
                      <span className="ml-2">{formData.numberOfAdults} adulte(s), {formData.numberOfChildren} enfant(s)</span>
                    ) : (
                      <span className="ml-2 text-gray-400 italic">Aucun participant sélectionné</span>
                    )}
                  </div>

                  {/* Prix */}
                  {isPaidEvent && (
                    <div className="pt-2 border-t border-gray-200">
                      {priceResult.breakdown.slice(0, -1).map((line, idx) => (
                        <div key={idx} className="text-sm text-gray-600">{line}</div>
                      ))}
                      <div className="flex justify-between items-center pt-2">
                        <strong>Total:</strong>
                        <span className="text-lg font-bold text-red-600">
                          {priceResult.total} CHF
                          {isSubscription && event.subscription_interval && (
                            <span className="text-sm font-normal ml-1">{intervalLabels[event.subscription_interval]}</span>
                          )}
                        </span>
                      </div>
                      {priceResult.discountAmount > 0 && priceResult.discountReason && (
                        <div className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{priceResult.discountReason}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {event.requires_approval && (
                    <p className="text-amber-600 pt-2"><strong>Note:</strong> Nécessite une validation</p>
                  )}
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={submitting || !!ageError || (participationType === 'CHILDREN' && !!session && selectedChildIds.length === 0)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Inscription en cours...
                  </>
                ) : event.requires_approval ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Envoyer ma demande d'inscription
                    {isPaidEvent && (
                      <span className="text-sm ml-1">({priceResult.total} CHF après approbation)</span>
                    )}
                  </>
                ) : isPaidEvent ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Payer {priceResult.total} CHF
                    {isSubscription && event.subscription_interval && (
                      <span className="text-sm ml-1">{intervalLabels[event.subscription_interval]}</span>
                    )}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Confirmer l'inscription
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                * Champs obligatoires
              </p>
            </form>
          )}
        </div>
      </div>
    </RegistrationLayout>
  )
}
