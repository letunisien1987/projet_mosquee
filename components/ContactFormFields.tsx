'use client'

import { User, Mail, Phone, MessageSquare } from 'lucide-react'

export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes?: string
}

interface ContactFormFieldsProps {
  data: ContactFormData
  onChange: (data: ContactFormData) => void
  title?: string
  showTitle?: boolean
  showNotes?: boolean
  notesPlaceholder?: string
  accentColor?: string  // 'focus:ring-red-500'
  required?: {
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phone?: boolean
  }
}

export function ContactFormFields({
  data,
  onChange,
  title = 'Vos informations',
  showTitle = true,
  showNotes = false,
  notesPlaceholder = 'Besoins spécifiques, allergies...',
  accentColor = 'focus:ring-red-500',
  required = { firstName: true, lastName: true, email: true, phone: true }
}: ContactFormFieldsProps) {
  const handleChange = (field: keyof ContactFormData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="mb-6">
      {showTitle && (
        <h3 className="text-lg font-bold mb-4">{title}</h3>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Prénom {required.firstName && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              required={required.firstName}
              value={data.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${accentColor} focus:border-transparent`}
              placeholder="Prénom"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Nom {required.lastName && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={required.lastName}
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${accentColor} focus:border-transparent`}
            placeholder="Nom"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email {required.email && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required={required.email}
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${accentColor} focus:border-transparent`}
              placeholder="email@exemple.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Téléphone {required.phone && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              required={required.phone}
              value={data.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${accentColor} focus:border-transparent`}
              placeholder="+41 XX XXX XX XX"
            />
          </div>
        </div>
      </div>

      {showNotes && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Remarques (optionnel)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              value={data.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${accentColor} focus:border-transparent`}
              placeholder={notesPlaceholder}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Composant notes seul
interface NotesFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  accentColor?: string
}

export function NotesField({
  value,
  onChange,
  placeholder = 'Besoins spécifiques, allergies...',
  accentColor = 'focus:ring-red-500'
}: NotesFieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">
        Remarques (optionnel)
      </label>
      <div className="relative">
        <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 ${accentColor} focus:border-transparent`}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
