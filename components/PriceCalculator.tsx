'use client'

import { useMemo } from 'react'
import { Calculator, Tag, Users, Baby, Percent } from 'lucide-react'
import { calculatePrice, type PricingConfig, type PricingResult } from '@/lib/pricing'
import { type Child } from '@/hooks/useChildren'

interface PriceCalculatorProps {
  pricing: PricingConfig | null
  fallbackPrice?: number
  numberOfAdults: number
  selectedChildren: Child[]
  calculateAge: (birthDate: string) => number
  registrationDate?: Date
  showBreakdown?: boolean
  className?: string
  currency?: string
}

export function PriceCalculator({
  pricing,
  fallbackPrice = 0,
  numberOfAdults,
  selectedChildren,
  calculateAge,
  registrationDate = new Date(),
  showBreakdown = true,
  className = '',
  currency = 'CHF',
}: PriceCalculatorProps) {
  // Calculer les ages des enfants selectionnes
  const childrenAges = useMemo(() => {
    return selectedChildren.map(child => calculateAge(child.birthDate))
  }, [selectedChildren, calculateAge])

  // Calculer le prix
  const priceResult: PricingResult = useMemo(() => {
    return calculatePrice(
      pricing,
      {
        numberOfAdults,
        numberOfChildren: selectedChildren.length,
        childrenAges,
        registrationDate,
      },
      fallbackPrice
    )
  }, [pricing, numberOfAdults, selectedChildren.length, childrenAges, registrationDate, fallbackPrice])

  const totalParticipants = numberOfAdults + selectedChildren.length

  // Si aucun participant, ne rien afficher
  if (totalParticipants === 0) {
    return null
  }

  // Si gratuit
  if (priceResult.total === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="w-5 h-5" />
          <span className="font-semibold text-lg">Gratuit</span>
        </div>
        {totalParticipants > 0 && (
          <p className="text-sm text-green-600 mt-1">
            {totalParticipants} participant{totalParticipants > 1 ? 's' : ''}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <Calculator className="w-5 h-5" />
            <span className="font-medium">Recapitulatif</span>
          </div>
          <span className="text-sm text-gray-500">
            {totalParticipants} participant{totalParticipants > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="px-4 py-3 space-y-2 text-sm">
          {/* Adultes */}
          {numberOfAdults > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{numberOfAdults} adulte{numberOfAdults > 1 ? 's' : ''}</span>
              </div>
              <span className="text-gray-900 font-medium">
                {priceResult.adultTotal} {currency}
              </span>
            </div>
          )}

          {/* Enfants payants */}
          {priceResult.paidChildren > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Baby className="w-4 h-4" />
                <span>{priceResult.paidChildren} enfant{priceResult.paidChildren > 1 ? 's' : ''}</span>
              </div>
              <span className="text-gray-900 font-medium">
                {priceResult.childTotal} {currency}
              </span>
            </div>
          )}

          {/* Enfants gratuits */}
          {priceResult.freeChildren > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <Baby className="w-4 h-4" />
                <span>{priceResult.freeChildren} enfant{priceResult.freeChildren > 1 ? 's' : ''} gratuit{priceResult.freeChildren > 1 ? 's' : ''}</span>
              </div>
              <span className="text-green-600 font-medium">0 {currency}</span>
            </div>
          )}

          {/* Reductions */}
          {priceResult.discountAmount > 0 && (
            <div className="flex items-center justify-between text-green-600 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                <span className="text-xs">{priceResult.discountReason}</span>
              </div>
              <span className="font-medium">-{priceResult.discountAmount} {currency}</span>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="bg-primary text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Total a payer</span>
          <span className="text-xl font-bold">{priceResult.total} {currency}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Version compacte du calculateur de prix (pour affichage inline)
 */
export function PriceCalculatorCompact({
  pricing,
  fallbackPrice = 0,
  numberOfAdults,
  selectedChildren,
  calculateAge,
  currency = 'CHF',
}: Omit<PriceCalculatorProps, 'showBreakdown' | 'className' | 'registrationDate'>) {
  const childrenAges = useMemo(() => {
    return selectedChildren.map(child => calculateAge(child.birthDate))
  }, [selectedChildren, calculateAge])

  const priceResult = useMemo(() => {
    return calculatePrice(
      pricing,
      {
        numberOfAdults,
        numberOfChildren: selectedChildren.length,
        childrenAges,
        registrationDate: new Date(),
      },
      fallbackPrice
    )
  }, [pricing, numberOfAdults, selectedChildren.length, childrenAges, fallbackPrice])

  const totalParticipants = numberOfAdults + selectedChildren.length

  if (totalParticipants === 0) {
    return <span className="text-gray-400">Selectionnez des participants</span>
  }

  if (priceResult.total === 0) {
    return <span className="text-green-600 font-semibold">Gratuit</span>
  }

  return (
    <span className="font-semibold text-primary">
      {priceResult.total} {currency}
      {priceResult.discountAmount > 0 && (
        <span className="text-xs text-green-600 ml-2">
          (-{priceResult.discountAmount} {currency})
        </span>
      )}
    </span>
  )
}
