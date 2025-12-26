'use client'

import { useState } from 'react'
import { X, Loader2, UserPlus } from 'lucide-react'
import { type CreateChildInput } from '@/hooks/useChildren'

interface InlineChildFormProps {
  onSubmit: (data: CreateChildInput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function InlineChildForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InlineChildFormProps) {
  const [formData, setFormData] = useState<CreateChildInput>({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: undefined,
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)

    // Validation basique
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      setError('Le prenom doit contenir au moins 2 caracteres')
      return
    }
    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      setError('Le nom doit contenir au moins 2 caracteres')
      return
    }
    if (!formData.birthDate) {
      setError('La date de naissance est requise')
      return
    }
    if (new Date(formData.birthDate) >= new Date()) {
      setError('La date de naissance doit etre dans le passe')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          <UserPlus className="w-5 h-5" />
          <span className="font-medium">Ajouter un enfant</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-3">
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prenom *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              placeholder="Prenom"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              placeholder="Nom"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de naissance *
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                gender: e.target.value as 'MALE' | 'FEMALE' | undefined || undefined
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isSubmitting}
            >
              <option value="">Selectionner</option>
              <option value="MALE">Garcon</option>
              <option value="FEMALE">Fille</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ajout...
              </>
            ) : (
              'Ajouter'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
