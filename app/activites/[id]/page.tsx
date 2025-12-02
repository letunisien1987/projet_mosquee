'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  BookOpen, Clock, GraduationCap, Users, Calendar, Phone, Mail,
  MessageSquare, Loader2, ArrowLeft, CreditCard, CheckCircle, User
} from 'lucide-react'

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

export default function ActivityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status: sessionStatus } = useSession()
  const activityId = params.id as string

  const [activity, setActivity] = useState<Activity | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isForChild: false,
    selectedChildId: '',
    childFirstName: '',
    childLastName: '',
    childBirthDate: '',
    notes: '',
  })

  useEffect(() => {
    fetchActivity()
  }, [activityId])

  useEffect(() => {
    if (session?.user) {
      // Pré-remplir avec les infos de l'utilisateur connecté
      const user = session.user as any
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
      // Charger les enfants
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
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
        // Si l'activité est payante ET ne nécessite pas d'approbation -> rediriger vers paiement
        if (activity?.price && activity.price > 0 && !activity.requires_approval) {
          // Rediriger vers le checkout
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Activité non trouvée</h2>
          <Link href="/activites" className="text-red-600 hover:underline">
            Retour aux activités
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Inscription envoyée !</h2>
          <p className="text-gray-600 mb-4">
            {activity.requires_approval
              ? 'Votre demande d\'inscription a été envoyée. Nous vous contacterons après validation.'
              : 'Votre inscription a été confirmée. Vous recevrez un email de confirmation.'}
          </p>
          {activity.price && activity.price > 0 && activity.requires_approval && (
            <p className="text-sm text-amber-600 mb-4">
              Après approbation, vous recevrez un lien pour effectuer le paiement de {activity.price} CHF.
            </p>
          )}
          <div className="space-y-2">
            <Link
              href="/activites"
              className="block w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Retour aux activités
            </Link>
            {session && (
              <Link
                href="/membre/inscriptions"
                className="block w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors"
              >
                Voir mes inscriptions
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/activites"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux activités
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{activity.title}</h1>
          <p className="text-white/90">{activity.description}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Infos de l'activité */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">Informations</h3>

              <div className="space-y-4">
                {activity.schedule && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Horaire</p>
                      <p className="text-gray-600 text-sm">{activity.schedule}</p>
                    </div>
                  </div>
                )}

                {activity.instructor && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Enseignant</p>
                      <p className="text-gray-600 text-sm">{activity.instructor}</p>
                    </div>
                  </div>
                )}

                {activity.age_group && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Tranche d'âge</p>
                      <p className="text-gray-600 text-sm">{activity.age_group}</p>
                    </div>
                  </div>
                )}

                {activity.max_participants && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Places</p>
                      <p className="text-gray-600 text-sm">{activity.max_participants} participants max</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tarif</span>
                    <span className="text-2xl font-bold text-red-600">
                      {activity.price && activity.price > 0
                        ? `${activity.price} CHF`
                        : 'Gratuit'}
                    </span>
                  </div>
                </div>

                {activity.requires_approval && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    Cette activité nécessite une validation par l'administration.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formulaire d'inscription */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-red-600" />
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
                        className="w-4 h-4 text-red-600 rounded"
                      />
                      <span className="font-medium">Cette inscription est pour mon enfant</span>
                    </label>
                  </div>

                  {/* Informations du parent/participant */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-4">
                      {formData.isForChild ? 'Vos informations (Parent/Tuteur)' : 'Vos informations'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Prénom *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Prénom"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Nom *</label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="Nom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="email@exemple.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Téléphone *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="+41 XX XXX XX XX"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations de l'enfant */}
                  {formData.isForChild && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-4">Informations de l'enfant</h3>

                      {/* Sélection d'un enfant existant si connecté */}
                      {session && children.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium mb-2">Sélectionner un enfant enregistré</label>
                          <select
                            value={formData.selectedChildId}
                            onChange={(e) => setFormData({ ...formData, selectedChildId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Remarques (optionnel)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Allergies, besoins spécifiques..."
                      />
                    </div>
                  </div>

                  {/* Résumé */}
                  <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-bold mb-2">Résumé</h4>
                    <div className="text-sm space-y-1 text-gray-700">
                      <p><strong>Activité:</strong> {activity.title}</p>
                      {activity.schedule && <p><strong>Horaire:</strong> {activity.schedule}</p>}
                      <p><strong>Tarif:</strong> {activity.price ? `${activity.price} CHF` : 'Gratuit'}</p>
                      {activity.requires_approval && (
                        <p className="text-amber-600"><strong>Note:</strong> Nécessite une validation</p>
                      )}
                    </div>
                  </div>

                  {/* Bouton de soumission */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : activity.price && activity.price > 0 && !activity.requires_approval ? (
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
        </div>
      </div>
    </div>
  )
}
