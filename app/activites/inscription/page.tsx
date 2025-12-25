'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, User, Calendar, Phone, Mail, MessageSquare, Loader2 } from 'lucide-react'

interface Activity {
  id: string
  title: string
  category: string
  levels: {
    id: string
    name: string
    schedule: string
    price: number | null
  }[]
}

export default function InscriptionPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    activityId: '',
    levelId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    notes: '',
    isForChild: false,
    childFirstName: '',
    childLastName: '',
    childBirthDate: '',
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/activities')
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des activités:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/activites')
        }, 3000)
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedActivity = activities.find(a => a.id === formData.activityId)
  const selectedLevel = selectedActivity?.levels.find(l => l.id === formData.levelId)

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Inscription réussie!</h2>
          <p className="text-gray-600 mb-4">
            Votre demande d'inscription a été envoyée avec succès. Nous vous contacterons bientôt.
          </p>
          <p className="text-sm text-gray-500">Redirection automatique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Inscription aux Activités</h1>
          <p className="text-white/90">Remplissez le formulaire ci-dessous pour vous inscrire</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
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
                className="w-4 h-4 text-primary rounded"
              />
              <span className="font-medium">Cette inscription est pour mon enfant</span>
            </label>
          </div>

          {/* Sélection de l'activité */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Activité *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                required
                value={formData.activityId}
                onChange={(e) => setFormData({ ...formData, activityId: e.target.value, levelId: '' })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionnez une activité</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sélection du niveau */}
          {selectedActivity && selectedActivity.levels.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Niveau / Session *
              </label>
              <select
                required
                value={formData.levelId}
                onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionnez un niveau</option>
                {selectedActivity.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name} - {level.schedule}
                    {level.price ? ` (${level.price} CHF/mois)` : ' (Gratuit)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Informations du parent/participant */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4">
              {formData.isForChild ? 'Vos informations (Parent/Tuteur)' : 'Vos informations'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Prénom *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Prénom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nom"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+41 XX XXX XX XX"
                  />
                </div>
              </div>
              {!formData.isForChild && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Date de naissance *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations de l'enfant */}
          {formData.isForChild && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">Informations de l'enfant</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Prénom de l'enfant *</label>
                  <input
                    type="text"
                    required
                    value={formData.childFirstName}
                    onChange={(e) => setFormData({ ...formData, childFirstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Nom de l'enfant *</label>
                  <input
                    type="text"
                    required
                    value={formData.childLastName}
                    onChange={(e) => setFormData({ ...formData, childLastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Date de naissance *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.childBirthDate}
                      onChange={(e) => setFormData({ ...formData, childBirthDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Remarques ou questions (optionnel)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Informations complémentaires, besoins spécifiques..."
              />
            </div>
          </div>

          {/* Résumé */}
          {selectedLevel && (
            <div className="mb-6 bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-bold mb-2">Résumé de votre inscription:</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li><strong>Activité:</strong> {selectedActivity?.title}</li>
                <li><strong>Niveau:</strong> {selectedLevel.name}</li>
                <li><strong>Horaire:</strong> {selectedLevel.schedule}</li>
                {selectedLevel.price && (
                  <li><strong>Tarif:</strong> {selectedLevel.price} CHF/mois</li>
                )}
              </ul>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/activites')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer l\'inscription'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            * Champs obligatoires. Votre inscription sera examinée et nous vous contacterons sous 48h.
          </p>
        </form>
      </div>
    </div>
  )
}
