'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AddEditChildModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  childToEdit?: {
    id: string
    firstName: string
    lastName: string
    nickName?: string
    birthDate: string
    gender?: string
    notes?: string
    avatarUrl?: string
  }
}

export default function AddEditChildModal({
  isOpen,
  onClose,
  onSuccess,
  childToEdit,
}: AddEditChildModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickName: '',
    birthDate: '',
    gender: '',
    notes: '',
    avatarUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (childToEdit) {
      setFormData({
        firstName: childToEdit.firstName,
        lastName: childToEdit.lastName,
        nickName: childToEdit.nickName || '',
        birthDate: childToEdit.birthDate.split('T')[0], // Format YYYY-MM-DD
        gender: childToEdit.gender || '',
        notes: childToEdit.notes || '',
        avatarUrl: childToEdit.avatarUrl || '',
      })
    } else {
      // Reset form for new child
      setFormData({
        firstName: '',
        lastName: '',
        nickName: '',
        birthDate: '',
        gender: '',
        notes: '',
        avatarUrl: '',
      })
    }
    setError('')
  }, [childToEdit, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = childToEdit
        ? `/api/account/children/${childToEdit.id}`
        : '/api/account/children'

      const method = childToEdit ? 'PATCH' : 'POST'

      // Prepare data - remove empty optional fields
      const submitData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
      }

      if (formData.nickName) submitData.nickName = formData.nickName
      if (formData.gender) submitData.gender = formData.gender
      if (formData.notes) submitData.notes = formData.notes
      if (formData.avatarUrl) submitData.avatarUrl = formData.avatarUrl

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      alert(data.message || 'Enfant enregistré avec succès')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {childToEdit ? 'Modifier l\'enfant' : 'Ajouter un enfant'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Prénom et Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Amira"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Benali"
              />
            </div>
          </div>

          {/* Surnom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surnom (optionnel)
            </label>
            <input
              type="text"
              value={formData.nickName}
              onChange={(e) => setFormData({ ...formData, nickName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Mimi"
            />
          </div>

          {/* Date de naissance et Genre */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]} // Can't be in the future
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">-- Sélectionner --</option>
                <option value="MALE">👦 Garçon</option>
                <option value="FEMALE">👧 Fille</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (allergies, informations médicales, etc.)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Ex: Allergie aux arachides, asthme..."
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de la photo (optionnel)
            </label>
            <input
              type="url"
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://exemple.com/photo.jpg"
            />
            {formData.avatarUrl && (
              <div className="mt-2">
                <img
                  src={formData.avatarUrl}
                  alt="Aperçu"
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Enregistrement...' : childToEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
