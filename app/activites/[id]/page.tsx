'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  BookOpen, Calendar, Loader2, CheckCircle, CreditCard, Users, User, Info, AlertCircle
} from 'lucide-react'
import { EventRestrictions, getRestrictionsMessage, getVisibleParticipationModes } from '@/types/restrictions'
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
import { OrganizerContact } from '@/components/OrganizerContact'
import type { OrganizerInfo } from '@/lib/content'

interface Activity {
  id: string
  title: string
  slug: string
  category: string
  description?: string
  content?: string
  level?: string
  ageGroup?: string
  schedule?: string
  instructor?: string
  maxParticipants?: number
  requiresApproval: boolean
  price?: number
  active: boolean
  enrollmentOpen: boolean
  minAge?: number
  maxAge?: number
  genderRestriction?: 'MALE' | 'FEMALE'
  restrictions?: EventRestrictions
  // Champs organisateur
  managerEmail?: string
  showOrganizerName?: boolean
  showOrganizerEmail?: boolean
  showOrganizerPhone?: boolean
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
  const [organizerInfo, setOrganizerInfo] = useState<OrganizerInfo | null>(null)
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

  // Type de participation: INDIVIDUAL (moi-même), FAMILY (groupe), CHILDREN (mes enfants)
  const [participationType, setParticipationType] = useState<'INDIVIDUAL' | 'FAMILY' | 'CHILDREN'>('INDIVIDUAL')
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([])

  // Pour le mode FAMILY
  const [familyData, setFamilyData] = useState({
    numberOfAdults: 1,
    numberOfChildren: 0,
  })

  // Pour les visiteurs non connectes qui ajoutent un enfant inline
  const [inlineChild, setInlineChild] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
  })

  // Restrictions et modes de participation
  const restrictions = activity?.restrictions
  const restrictionsMessage = restrictions ? getRestrictionsMessage(restrictions) : null

  // Utiliser la fonction helper pour déterminer les modes visibles
  const participationModes = useMemo(() => {
    return getVisibleParticipationModes(restrictions)
  }, [restrictions])

  const { showIndividual, showChildren, showFamily, defaultMode } = participationModes

  useEffect(() => {
    fetchActivity()
  }, [activityId])

  // Charger les infos de l'organisateur
  useEffect(() => {
    if (activity?.managerEmail && (activity.showOrganizerName || activity.showOrganizerEmail || activity.showOrganizerPhone)) {
      const fetchOrganizerInfo = async () => {
        try {
          const params = new URLSearchParams({
            email: activity.managerEmail!,
            showName: String(activity.showOrganizerName || false),
            showEmail: String(activity.showOrganizerEmail || false),
            showPhone: String(activity.showOrganizerPhone || false)
          })
          const res = await fetch(`/api/organizer-info?${params}`)
          if (res.ok) {
            const data = await res.json()
            if (data) setOrganizerInfo(data)
          }
        } catch (err) {
          console.error('Erreur chargement infos organisateur:', err)
        }
      }
      fetchOrganizerInfo()
    }
  }, [activity?.managerEmail, activity?.showOrganizerName, activity?.showOrganizerEmail, activity?.showOrganizerPhone])

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

  // Définir le mode de participation par défaut selon les restrictions
  useEffect(() => {
    if (defaultMode) {
      setParticipationType(defaultMode)
    }
  }, [defaultMode])

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
    if (participationType === 'INDIVIDUAL') {
      return activity.price
    } else if (participationType === 'CHILDREN') {
      return activity.price * (selectedChildIds.length || 1)
    } else {
      // FAMILY
      return activity.price * (familyData.numberOfAdults + familyData.numberOfChildren)
    }
  }, [activity?.price, participationType, selectedChildIds.length, familyData.numberOfAdults, familyData.numberOfChildren])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (participationType === 'CHILDREN') {
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
        participationType: participationType,
        isForChild: participationType === 'CHILDREN',
      }

      if (participationType === 'CHILDREN') {
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
      } else if (participationType === 'FAMILY') {
        payload.numberOfAdults = familyData.numberOfAdults
        payload.numberOfChildren = familyData.numberOfChildren
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
    const successMessage = activity.requiresApproval
      ? 'Votre demande d\'inscription a été envoyée. Nous vous contacterons après validation.'
      : 'Votre inscription a été confirmée. Vous recevrez un email de confirmation.'

    const additionalMessage = isPaid && activity.requiresApproval
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

  if (activity.level) {
    infoItems.push({ icon: 'info', label: 'Niveau', value: activity.level })
  }

  if (activity.ageGroup) {
    infoItems.push({ icon: 'users', label: 'Tranche d\'âge', value: activity.ageGroup })
  }

  if (activity.maxParticipants) {
    infoItems.push({ icon: 'users', label: 'Places', value: `${activity.maxParticipants} participants max` })
  }

  // Restrictions pour le ChildSelector
  const ageRestriction = (activity.minAge || activity.maxAge || restrictions?.minAge || restrictions?.maxAge)
    ? { min: (activity.minAge || restrictions?.minAge) ?? undefined, max: (activity.maxAge || restrictions?.maxAge) ?? undefined }
    : undefined

  // Ne filtrer par genre que si MALE ou FEMALE (pas CHILD ni ALL)
  const genderRestriction = activity.genderRestriction ||
    (restrictions?.allowedGender === 'MALE' || restrictions?.allowedGender === 'FEMALE'
      ? restrictions.allowedGender
      : undefined)

  return (
    <RegistrationLayout
      title={activity.title}
      description={activity.description}
      content={activity.content}
      backHref="/activites"
      backLabel="Retour aux activités"
      gradientConfig={activityGradientConfig}
    >
      {/* Sidebar */}
      <div>
        <RegistrationInfoCard
          infos={infoItems}
          price={{
            amount: activity.price || 0,
            isPaid: !!isPaid,
          }}
          warningMessage={activity.requiresApproval ? 'Cette activité nécessite une validation par l\'administration.' : undefined}
          accentColor="text-emerald-600"
        />

        {/* Organisateur */}
        {organizerInfo && (
          <OrganizerContact
            organizer={organizerInfo}
            itemType="activity"
            itemId={activity.id}
            itemTitle={activity.title}
          />
        )}
      </div>

      {/* Form */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            S'inscrire à cette activité
          </h2>

          {restrictionsMessage && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{restrictionsMessage}</p>
            </div>
          )}

          {!activity.enrollmentOpen ? (
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
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Type de participation - Affichage dynamique selon les restrictions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cette inscription est pour :
                </label>
                <div className={`grid gap-3 ${
                  [showIndividual, showChildren, showFamily].filter(Boolean).length === 1
                    ? 'grid-cols-1 max-w-xs'
                    : [showIndividual, showChildren, showFamily].filter(Boolean).length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                }`}>
                  {showIndividual && (
                    <button
                      type="button"
                      onClick={() => {
                        setParticipationType('INDIVIDUAL')
                        setSelectedChildIds([])
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        participationType === 'INDIVIDUAL'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span className="font-medium text-sm">Moi-même</span>
                    </button>
                  )}
                  {showChildren && (
                    <button
                      type="button"
                      onClick={() => {
                        setParticipationType('CHILDREN')
                        setSelectedChildIds([])
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        participationType === 'CHILDREN'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium text-sm">Mon/mes enfant(s)</span>
                    </button>
                  )}
                  {showFamily && (
                    <button
                      type="button"
                      onClick={() => {
                        setParticipationType('FAMILY')
                        setSelectedChildIds([])
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        participationType === 'FAMILY'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium text-sm">Famille/Groupe</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Informations du parent/participant */}
              <ContactFormFields
                data={contactData}
                onChange={setContactData}
                title={
                  participationType === 'CHILDREN'
                    ? 'Vos informations (Parent/Tuteur)'
                    : participationType === 'FAMILY'
                      ? 'Informations du responsable du groupe'
                      : 'Vos informations'
                }
                showNotes={false}
                accentColor="focus:ring-emerald-500"
              />

              {/* MODE CHILDREN : Sélection des enfants */}
              {participationType === 'CHILDREN' && (
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
                      genderRestriction={genderRestriction}
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

              {/* MODE FAMILY : Nombre adultes et enfants */}
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
                        value={familyData.numberOfAdults}
                        onChange={(e) => setFamilyData({ ...familyData, numberOfAdults: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre d'enfants</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={familyData.numberOfChildren}
                        onChange={(e) => setFamilyData({ ...familyData, numberOfChildren: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
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
                    {participationType === 'INDIVIDUAL' ? (
                      <span className="ml-2">{contactData.firstName} {contactData.lastName}</span>
                    ) : participationType === 'CHILDREN' && session && selectedChildren.length > 0 ? (
                      <ul className="mt-1 ml-4 list-disc">
                        {selectedChildren.map(child => (
                          <li key={child.id}>
                            {child.firstName} {child.lastName} ({calculateAge(child.birthDate)} ans)
                          </li>
                        ))}
                      </ul>
                    ) : participationType === 'CHILDREN' && !session && inlineChild.firstName ? (
                      <span className="ml-2">{inlineChild.firstName} {inlineChild.lastName}</span>
                    ) : participationType === 'FAMILY' ? (
                      <span className="ml-2">{familyData.numberOfAdults} adulte(s), {familyData.numberOfChildren} enfant(s)</span>
                    ) : (
                      <span className="ml-2 text-gray-400 italic">Aucun participant sélectionné</span>
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
                    {isPaid && participationType === 'CHILDREN' && selectedChildIds.length > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ({activity.price} CHF × {selectedChildIds.length} enfants)
                      </p>
                    )}
                    {isPaid && participationType === 'FAMILY' && (familyData.numberOfAdults + familyData.numberOfChildren) > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ({activity.price} CHF × {familyData.numberOfAdults + familyData.numberOfChildren} personnes)
                      </p>
                    )}
                  </div>

                  {activity.requiresApproval && (
                    <p className="text-amber-600 pt-2"><strong>Note:</strong> Nécessite une validation</p>
                  )}
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={submitting || (participationType === 'CHILDREN' && !!session && selectedChildIds.length === 0)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : isPaid && !activity.requiresApproval ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    S'inscrire et payer ({totalPrice} CHF)
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {activity.requiresApproval ? 'Envoyer ma demande' : 'Confirmer l\'inscription'}
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
