'use client'

import { Check, AlertCircle } from 'lucide-react'
import { type Child } from '@/hooks/useChildren'

interface ChildSelectorCardProps {
  child: Child
  selected: boolean
  onToggle: () => void
  mode: 'single' | 'multiple'
  disabled?: boolean
  disabledReason?: string
  calculateAge: (birthDate: string) => number
}

export function ChildSelectorCard({
  child,
  selected,
  onToggle,
  mode,
  disabled = false,
  disabledReason,
  calculateAge,
}: ChildSelectorCardProps) {
  const age = calculateAge(child.birthDate)

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        w-full px-3 py-2 rounded-md border text-left transition-all text-sm
        ${disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
          : selected
            ? 'border-primary bg-primary/10'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox/Radio */}
        <div
          className={`
            flex-shrink-0 w-4 h-4 rounded-${mode === 'single' ? 'full' : 'sm'}
            border-2 flex items-center justify-center transition-colors
            ${disabled
              ? 'border-gray-300 bg-gray-100'
              : selected
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300'
            }
          `}
        >
          {selected && <Check className="w-2.5 h-2.5" />}
        </div>

        {/* Nom et âge */}
        <span className={`flex-1 truncate ${selected ? 'font-medium' : ''}`}>
          {child.firstName} {child.lastName}
        </span>

        <span className="text-xs text-gray-500 flex-shrink-0">
          {age} ans
        </span>

        {/* Disabled reason */}
        {disabled && disabledReason && (
          <div className="flex-shrink-0" title={disabledReason}>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
        )}
      </div>
    </button>
  )
}
