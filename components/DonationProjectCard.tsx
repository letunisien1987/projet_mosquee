'use client'

import { useState } from 'react'
import { Heart, TrendingUp } from 'lucide-react'
import DonationCardModal from './DonationCardModal'

interface DonationProjectCardProps {
  id: string
  title: string
  description: string
  image?: string
  goalAmount: number
  currentAmount: number
  raisenowCode?: string // Code RaiseNow unique (ex: zsmgy)
}

export default function DonationProjectCard({
  id,
  title,
  description,
  image,
  goalAmount,
  currentAmount,
  raisenowCode,
}: DonationProjectCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const percentage = ((currentAmount || 0) / (goalAmount || 1)) * 100

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-primary/10 hover:shadow-xl transition-all">
        {/* Image */}
        {image ? (
          <div className="h-48 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Heart className="h-16 w-16 text-primary" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
            {title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {description}
          </p>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progression</span>
              <span className="font-semibold text-primary">{percentage.toFixed(0)}%</span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-sm pt-1">
              <span className="text-primary font-bold">
                {currentAmount.toLocaleString('fr-FR')} CHF
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                sur {goalAmount.toLocaleString('fr-FR')} CHF
              </span>
            </div>
          </div>

          {/* Donation Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Heart className="h-5 w-5" />
            Faire un don
          </button>
        </div>
      </div>

      {/* Modal de don Stripe */}
      <DonationCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={id}
        projectTitle={title}
      />
    </>
  )
}
