'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  BookOpen, Calendar, Loader2, CheckCircle, CreditCard, Users, User
} from 'lucide-react'
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

interface Activity {
  id: string
  title: string
  slug: string
  category: string
  description?: string
  content?: string
  level?: string
  age_group?: string
  schedule?: string
  instructor?: string
  max_participants?: number
  requires_approval: boolean
  price?: number
  active: boolean
  enrollment_open: boolean
  min_age?: number
  max_age?: number
  gender_restriction?: 'MALE' | 'FEMALE'
}

// Configuration de couleur par défaut pour les activités
const activityGradientConfig: GradientConfig = {
  gradient: 'from-emerald-600 to-emerald-700',
  color: 'bg-emerald-500',
  textColor: 'text-emerald-600',
  label: 'Activité'
}

export default function ActivityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const activityId = params.id as string
  const { children, calculateAge, refetch: refetchChildren, getChildById } = useChildren()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [contactData, setContactData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })

  // Mode d'inscription : adulte ou enfant(s)
  const [inscriptionMode, setInscriptionMode] = useState<'adult' | 'children'>('adult')
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])

  // Pour les visiteurs non connectes qui ajoutent un enfant inline
  const [inlineChild, setInlineChild] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
  })

  useEffect(() => {
    fetchActivity()
  }, [activityId])

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any
      setContactData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
    }
  }, [session])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${activityId}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data)
      } else {
        setError('Activite non trouvee')
      }
    } catch (err) {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // Enfants sélectionnés (objets complets)
  const selectedChildren = useMemo(() => {
    return selectedChildIds
      .map(id => getChildById(id))
      .filter((c): c is Child => c !== undefined)
  }, [selectedChildIds, getChildById])

  // Calcul du prix total
  const totalPrice = useMemo(() => {
    if (!activity?.price) return 0
    if (inscriptionMode === 'adult') return activity.price
    return activity.price * selectedChildIds.length
  }, [activity?.price, inscriptionMode, selectedChildIds.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (inscriptionMode === 'children') {
      if (session && selectedChildIds.length === 0) {
        setError('Veuillez sélectionner au moins un enfant')
        setSubmitting(false)
        return
      }
      if (!session && (!inlineChild.firstName || !inlineChild.lastName || !inlineChild.birthDate)) {
        setError('Veuillez remplir les informations de l\'enfant')
        setSubmitting(false)
        return
      }
    }

    try {
      let payload: any = {
        activityId: activityId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        notes: contactData.notes,
        isForChild: inscriptionMode === 'children',
      }

      if (inscriptionMode === 'children') {
        if (session && selectedChildIds.length > 0) {
          // Utilisateur connecté avec enfants sélectionnés
          if (selectedChildIds.length === 1) {
            // Mode single : un seul enfant
            payload.childId = selectedChildIds[0]
          } else {
            // Mode batch : plusieurs enfants
            payload.childIds = selectedChildIds
          }
        } else if (!session) {
          // Visiteur non connecté : nouvel enfant inline
          payload.childFirstName = inlineChild.firstName
          payload.childLastName = inlineChild.lastName
          payload.childBirthDate = inlineChild.birthDate
        }
      }

      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        if (data.checkoutUrl) {
          // Redirection vers Stripe pour paiement
          window.location.href = data.checkoutUrl
        } else {
          setSuccess(true)
        }
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewChildAdded = (child: Child) => {
    // Automatiquement ajouter le nouvel enfant à la sélection
    setSelectedChildIds(prev => [...prev, child.id])
  }

  if (loading) {
    return <RegistrationLoading accentColor="text-emerald-600" />
  }

  if (!activity) {
    return (
      <RegistrationNotFound
        message="Activité non trouvée"
        backHref="/activites"
        backLabel="Retour aux activités"
        accentColor="text-emerald-600"
      />
    )
  }

  const isPaid = activity.price && activity.price > 0

  if (success) {
    const successMessage = activity.requires_approval
      ? 'Votre demande d\'inscription a été envoyée. Nous vous contacterons après validation.'
      : 'Votre inscription a été confirmée. Vous recevrez un email de confirmation.'

    const additionalMessage = isPaid && activity.requires_approval
      ? `Après approbation, vous recevrez un lien pour effectuer le paiement de ${activity.price} CHF.`
      : undefined

    return (
      <RegistrationSuccess
        title="Inscription envoyée !"
        message={successMessage}
        additionalMessage={additionalMessage}
        backHref="/activites"
        backLabel="Retour aux activités"
        accentColor="bg-emerald-600 hover:bg-emerald-700"
        showMyRegistrations={!!session}
        myRegistrationsHref="/dashboard/inscriptions"
        myRegistrationsLabel="Voir mes inscriptions"
      />
    )
  }

  // Build info items
  const infoItems: InfoItem[] = []

  if (activity.schedule) {
    infoItems.push({ icon: 'clock', label: 'Horaire', value: activity.schedule })
  }

  if (activity.instructor) {
    infoItems.push({ icon: 'instructor', label: 'Enseignant', value: activity.instructor })
  }

  if (activity.age_group) {
    infoItems.push({ icon: 'users', label: 'Tranche d\'âge', value: activity.age_group })
  }

  if (activity.max_participants) {
    infoItems.push({ icon: 'users', label: 'Places', value: `${activity.max_participants} participants max` })
  }

  // Restrictions pour le ChildSelector
  const ageRestriction = (activity.min_age || activity.max_age)
    ? { min: activity.min_age, max: activity.max_age }
    : undefined

  return (
    <RegistrationLayout
      title={activity.title}
      description={activity.description}
      backHref="/activites"
      backLabel="Retour aux activités"
      gradientConfig={activityGradientConfig}
    >
      {/* Sidebar */}
      <RegistrationInfoCard
        infos={infoItems}
        price={{
          amount: activity.price || 0,
          isPaid: !!isPaid,
        }}
        warningMessage={activity.requires_approval ? 'Cette activité nécessite une validation par l\'administration.' : undefined}
        accentColor="text-emerald-600"
      />

      {/* Form */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            S'inscrire à cette activité
          </h2>

          {!activity.enrollment_open ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Inscriptions fermées</h3>
              <p className="text-gray-600">
                Les inscriptions pour cette activité ne sont pas ouvertes pour le moment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  {error}
                </div>
              )}

              {/* Choix du type d'inscription */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cette inscription est pour :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInscriptionMode('adult')
                      setSelectedChildIds([])
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      inscriptionMode === 'adult'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Moi-même</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInscriptionMode('children')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      inscriptionMode === 'children'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Mon/mes enfant(s)</span>
                  </button>
                </div>
              </div>

              {/* Informations du parent/participant */}
              <ContactFormFields
                data={contactData}
                onChange={setContactData}
                title={inscriptionMode === 'children' ? 'Vos informations (Parent/Tuteur)' : 'Vos informations'}
                showNotes={false}
                accentColor="focus:ring-emerald-500"
              />

              {/* Sélection des enfants */}
              {inscriptionMode === 'children' && (
                <div className="mb-6">
                  {session ? (
                    // Utilisateur connecté : utiliser le ChildSelector
                    <ChildSelector
                      mode="multiple"
                      selectedChildIds={selectedChildIds}
                      onSelectionChange={setSelectedChildIds}
                      onNewChildAdded={handleNewChildAdded}
                      showInlineAdd={true}
                      showModalLink={true}
                      ageRestriction={ageRestriction}
                      genderRestriction={activity.gender_restriction}
                      title="Sélectionnez vos enfants"
                      description="Choisissez les enfants à inscrire à cette activité"
                      className="mb-4"
                    />
                  ) : (
                    // Visiteur non connecté : formulaire inline
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        <Link href="/connexion" className="text-emerald-600 hover:underline">
                          Connectez-vous
                        </Link>
                        {' '}pour gérer vos enfants et les réutiliser pour d'autres inscriptions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <NotesField
                value={contactData.notes || ''}
                onChange={(value) => setContactData({ ...contactData, notes: value })}
                placeholder="Allergies, besoins spécifiques..."
                accentColor="focus:ring-emerald-500"
              />

              {/* Résumé */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-bold mb-3">Résumé</h4>
                <div className="text-sm space-y-2 text-gray-700">
                  <p><strong>Activité:</strong> {activity.title}</p>
                  {activity.schedule && <p><strong>Horaire:</strong> {activity.schedule}</p>}

                  {/* Participants */}
                  <div className="pt-2 border-t border-gray-200">
                    <strong>Participant(s):</strong>
                    {inscriptionMode === 'adult' ? (
                      <span className="ml-2">{contactData.firstName} {contactData.lastName}</span>
                    ) : session && selectedChildren.length > 0 ? (
                      <ul className="mt-1 ml-4 list-disc">
                        {selectedChildren.map(child => (
                          <li key={child.id}>
                            {child.firstName} {child.lastName} ({calculateAge(child.birthDate)} ans)
                          </li>
                        ))}
                      </ul>
                    ) : !session && inlineChild.firstName ? (
                      <span className="ml-2">{inlineChild.firstName} {inlineChild.lastName}</span>
                    ) : (
                      <span className="ml-2 text-gray-400 italic">Aucun enfant sélectionné</span>
                    )}
                  </div>

                  {/* Prix */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <strong>Total:</strong>
                      <span className="text-lg font-bold text-emerald-600">
                        {isPaid ? `${totalPrice} CHF` : 'Gratuit'}
                      </span>
                    </div>
                    {isPaid && inscriptionMode === 'children' && selectedChildIds.length > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ({activity.price} CHF × {selectedChildIds.length} enfants)
                      </p>
                    )}
                  </div>

                  {activity.requires_approval && (
                    <p className="text-amber-600 pt-2"><strong>Note:</strong> Nécessite une validation</p>
                  )}
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={submitting || (inscriptionMode === 'children' && !!session && selectedChildIds.length === 0)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : isPaid && !activity.requires_approval ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    S'inscrire et payer ({totalPrice} CHF)
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {activity.requires_approval ? 'Envoyer ma demande' : 'Confirmer l\'inscription'}
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
