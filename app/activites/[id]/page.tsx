'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  BookOpen, Calendar, Loader2, CheckCircle, CreditCard
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
}

interface Child {
  id: string
  firstName: string
  lastName: string
  birthDate: string
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

  const [activity, setActivity] = useState<Activity | null>(null)
  const [children, setChildren] = useState<Child[]>([])
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

  const [formData, setFormData] = useState({
    isForChild: false,
    selectedChildId: '',
    childFirstName: '',
    childLastName: '',
    childBirthDate: '',
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
      fetchChildren()
    }
  }, [session])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${activityId}`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data)
      } else {
        setError('Activité non trouvée')
      }
    } catch (err) {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/account/children')
      if (res.ok) {
        const data = await res.json()
        setChildren(data)
      }
    } catch (err) {
      console.error('Erreur chargement enfants:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload = {
        activityId: activityId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        notes: contactData.notes,
        isForChild: formData.isForChild,
        ...(formData.isForChild && formData.selectedChildId && {
          childId: formData.selectedChildId,
        }),
        ...(formData.isForChild && !formData.selectedChildId && {
          childFirstName: formData.childFirstName,
          childLastName: formData.childLastName,
          childBirthDate: formData.childBirthDate,
        }),
      }

      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        if (activity?.price && activity.price > 0 && !activity.requires_approval) {
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
        myRegistrationsHref="/membre/mes-inscriptions?type=activities"
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

              {/* Type d'inscription */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isForChild}
                    onChange={(e) => setFormData({ ...formData, isForChild: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium">Cette inscription est pour mon enfant</span>
                </label>
              </div>

              {/* Informations du parent/participant */}
              <ContactFormFields
                data={contactData}
                onChange={setContactData}
                title={formData.isForChild ? 'Vos informations (Parent/Tuteur)' : 'Vos informations'}
                showNotes={false}
                accentColor="focus:ring-emerald-500"
              />

              {/* Informations de l'enfant */}
              {formData.isForChild && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4">Informations de l'enfant</h3>

                  {/* Sélection d'un enfant existant */}
                  {session && children.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Sélectionner un enfant enregistré</label>
                      <select
                        value={formData.selectedChildId}
                        onChange={(e) => setFormData({ ...formData, selectedChildId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">-- Nouvel enfant --</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.firstName} {child.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Formulaire nouvel enfant */}
                  {!formData.selectedChildId && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Prénom de l'enfant *</label>
                        <input
                          type="text"
                          required={formData.isForChild && !formData.selectedChildId}
                          value={formData.childFirstName}
                          onChange={(e) => setFormData({ ...formData, childFirstName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Nom de l'enfant *</label>
                        <input
                          type="text"
                          required={formData.isForChild && !formData.selectedChildId}
                          value={formData.childLastName}
                          onChange={(e) => setFormData({ ...formData, childLastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Nom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Date de naissance *</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            required={formData.isForChild && !formData.selectedChildId}
                            value={formData.childBirthDate}
                            onChange={(e) => setFormData({ ...formData, childBirthDate: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
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
                <h4 className="font-bold mb-2">Résumé</h4>
                <div className="text-sm space-y-1 text-gray-700">
                  <p><strong>Activité:</strong> {activity.title}</p>
                  {activity.schedule && <p><strong>Horaire:</strong> {activity.schedule}</p>}
                  <p><strong>Tarif:</strong> {isPaid ? `${activity.price} CHF` : 'Gratuit'}</p>
                  {activity.requires_approval && (
                    <p className="text-amber-600"><strong>Note:</strong> Nécessite une validation</p>
                  )}
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={submitting}
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
                    S'inscrire et payer ({activity.price} CHF)
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
