'use client'

import { useState } from 'react'
import { BookOpen } from 'lucide-react'

interface Activity {
  id?: string
  _id?: string // Legacy Sanity format
  title: string
  description?: string
  level?: string
  age_group?: string
}

interface EnrollmentFormProps {
    activities?: Activity[]
}

export default function EnrollmentForm({ activities = [] }: EnrollmentFormProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        activityId: '',
        activityTitle: '',
        childFirstName: '',
        childLastName: '',
        childBirthDate: '',
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        parentPhone: '',
        notes: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/enrollments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activityId: formData.activityId,
                    activityTitle: formData.activityTitle,
                    notes: formData.notes,
                }),
            })

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi')
            }

            setSuccess(true)
            setFormData({
                activityId: '',
                activityTitle: '',
                childFirstName: '',
                childLastName: '',
                childBirthDate: '',
                parentFirstName: '',
                parentLastName: '',
                parentEmail: '',
                parentPhone: '',
                notes: '',
            })

            setTimeout(() => setSuccess(false), 5000)
        } catch (error) {
            console.error('Error:', error)
            alert('Une erreur est survenue. Veuillez réessayer.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10">
            <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Inscription aux Cours</h2>
            </div>

            {success && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg">
                    Votre demande d'inscription a été envoyée ! Nous vous contacterons bientôt.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Cours souhaité *</label>
                    <select
                        required
                        value={formData.activityId}
                        onChange={(e) => {
                            const activity = activities.find((a) => (a.id || a._id) === e.target.value)
                            setFormData({
                                ...formData,
                                activityId: e.target.value,
                                activityTitle: activity?.title || e.target.options[e.target.selectedIndex].text,
                            })
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                    >
                        <option value="">Sélectionner un cours</option>
                        <option value="coran-adultes">Cours de Coran - Adultes</option>
                        <option value="coran-enfants">Cours de Coran - Enfants</option>
                        <option value="arabe-debutant">Cours d'Arabe - Débutant</option>
                        <option value="arabe-intermediaire">Cours d'Arabe - Intermédiaire</option>
                        <option value="ecole-dimanche">École du Dimanche</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Prénom de l'enfant *</label>
                        <input
                            type="text"
                            required
                            value={formData.childFirstName}
                            onChange={(e) => setFormData({ ...formData, childFirstName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Nom de l'enfant *</label>
                        <input
                            type="text"
                            required
                            value={formData.childLastName}
                            onChange={(e) => setFormData({ ...formData, childLastName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Date de naissance *</label>
                    <input
                        type="date"
                        required
                        value={formData.childBirthDate}
                        onChange={(e) => setFormData({ ...formData, childBirthDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                    />
                </div>

                <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-4">Informations du Parent/Tuteur</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Prénom *</label>
                            <input
                                type="text"
                                required
                                value={formData.parentFirstName}
                                onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Nom *</label>
                            <input
                                type="text"
                                required
                                value={formData.parentLastName}
                                onChange={(e) => setFormData({ ...formData, parentLastName: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.parentEmail}
                            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Téléphone *</label>
                        <input
                            type="tel"
                            required
                            value={formData.parentPhone}
                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Notes (optionnel)</label>
                    <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Informations complémentaires, besoins spécifiques..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Envoi en cours...' : 'Envoyer la demande d\'inscription'}
                </button>
            </form>
        </div>
    )
}
