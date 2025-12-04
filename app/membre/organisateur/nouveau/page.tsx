'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Loader2,
} from 'lucide-react'
import EventForm from '@/components/forms/EventForm'
import ActivityForm from '@/components/forms/ActivityForm'

type ItemType = 'EVENT' | 'ACTIVITY' | null

export default function NouvelleOffrePage() {
  const { status } = useSession()
  const [selectedType, setSelectedType] = useState<ItemType>(null)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Si aucun type sélectionné, afficher le sélecteur
  if (!selectedType) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/membre/organisateur"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouvelle offre</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Choisissez le type d&apos;offre que vous souhaitez créer
          </p>
        </div>

        {/* Type selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Type d&apos;offre
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedType('EVENT')}
              className="p-6 rounded-xl border-2 transition-all border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group"
            >
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Événement</p>
              <p className="text-sm text-gray-500 mt-2">
                Conférence, sortie, fête... avec une date et un lieu précis
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('ACTIVITY')}
              className="p-6 rounded-xl border-2 transition-all border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
            >
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Activité</p>
              <p className="text-sm text-gray-500 mt-2">
                Cours de Coran, arabe, sport... avec un horaire récurrent
              </p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Afficher le formulaire approprié selon le type
  if (selectedType === 'EVENT') {
    return (
      <div>
        <div className="max-w-4xl mx-auto mb-4">
          <button
            onClick={() => setSelectedType(null)}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Changer le type
          </button>
        </div>
        <EventForm
          mode="create"
          apiEndpoint="/api/membre/organisateur/offerings"
          backUrl="/membre/organisateur"
          successUrl="/membre/organisateur"
          showManagerField={false}
          title="Nouvel événement"
        />
      </div>
    )
  }

  // ACTIVITY
  return (
    <div>
      <div className="max-w-4xl mx-auto mb-4">
        <button
          onClick={() => setSelectedType(null)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Changer le type
        </button>
      </div>
      <ActivityForm
        mode="create"
        apiEndpoint="/api/membre/organisateur/offerings"
        backUrl="/membre/organisateur"
        successUrl="/membre/organisateur"
        showManagerField={false}
        title="Nouvelle activité"
      />
    </div>
  )
}
