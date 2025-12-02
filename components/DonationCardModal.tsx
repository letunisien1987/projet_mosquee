'use client'

import { X } from 'lucide-react'
import StripeDonationForm from './StripeDonationForm'

interface DonationCardModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
}

export default function DonationCardModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
}: DonationCardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stripe Form */}
        <div className="p-6">
          <StripeDonationForm projectId={projectId} projectTitle={projectTitle} />
        </div>
      </div>
    </div>
  )
}
