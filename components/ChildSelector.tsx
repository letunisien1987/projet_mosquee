'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { UserPlus, Users, Loader2, LogIn, ExternalLink } from 'lucide-react'
import { useChildren, filterChildrenByRestrictions, type Child, type CreateChildInput } from '@/hooks/useChildren'
import { ChildSelectorCard } from './ChildSelectorCard'
import { InlineChildForm } from './InlineChildForm'

export interface ChildSelectorProps {
  mode: 'single' | 'multiple'
  selectedChildIds: string[]
  onSelectionChange: (childIds: string[]) => void
  onNewChildAdded?: (child: Child) => void
  showInlineAdd?: boolean
  showModalLink?: boolean
  maxSelections?: number
  ageRestriction?: { min?: number; max?: number }
  genderRestriction?: 'MALE' | 'FEMALE'
  title?: string
  description?: string
  className?: string
}

export function ChildSelector({
  mode,
  selectedChildIds,
  onSelectionChange,
  onNewChildAdded,
  showInlineAdd = true,
  showModalLink = true,
  maxSelections,
  ageRestriction,
  genderRestriction,
  title = 'Selectionnez vos enfants',
  description,
  className = '',
}: ChildSelectorProps) {
  const { children, loading, error, addChild, calculateAge, isAuthenticated, refetch } = useChildren()
  const [showAddForm, setShowAddForm] = useState(false)
  const [isAddingChild, setIsAddingChild] = useState(false)

  // S'assurer que children est un tableau
  const safeChildren = Array.isArray(children) ? children : []

  // Filtrer les enfants selon les restrictions
  const eligibleChildren = useMemo(() => {
    return filterChildrenByRestrictions(
      safeChildren,
      { minAge: ageRestriction?.min, maxAge: ageRestriction?.max, gender: genderRestriction },
      calculateAge
    )
  }, [safeChildren, ageRestriction, genderRestriction, calculateAge])

  // Enfants ineligibles (pour affichage avec raison)
  const ineligibleChildren = useMemo(() => {
    return safeChildren.filter(child => !eligibleChildren.find(e => e.id === child.id))
  }, [safeChildren, eligibleChildren])

  // Gerer le toggle d'un enfant
  const handleToggle = (childId: string) => {
    if (mode === 'single') {
      // Mode single : remplacer la selection
      onSelectionChange(selectedChildIds.includes(childId) ? [] : [childId])
    } else {
      // Mode multiple : ajouter/retirer
      if (selectedChildIds.includes(childId)) {
        onSelectionChange(selectedChildIds.filter(id => id !== childId))
      } else {
        // Verifier la limite
        if (maxSelections && selectedChildIds.length >= maxSelections) {
          return
        }
        onSelectionChange([...selectedChildIds, childId])
      }
    }
  }

  // Gerer l'ajout d'un enfant
  const handleAddChild = async (data: CreateChildInput) => {
    setIsAddingChild(true)
    try {
      const newChild = await addChild(data)
      if (newChild) {
        setShowAddForm(false)
        // Selectionner automatiquement le nouvel enfant
        if (mode === 'single') {
          onSelectionChange([newChild.id])
        } else {
          if (!maxSelections || selectedChildIds.length < maxSelections) {
            onSelectionChange([...selectedChildIds, newChild.id])
          }
        }
        onNewChildAdded?.(newChild)
      }
    } finally {
      setIsAddingChild(false)
    }
  }

  // Raison d'ineligibilite
  const getIneligibilityReason = (child: Child): string => {
    const age = calculateAge(child.birthDate)
    if (ageRestriction?.min && age < ageRestriction.min) {
      return `Age minimum: ${ageRestriction.min} ans`
    }
    if (ageRestriction?.max && age > ageRestriction.max) {
      return `Age maximum: ${ageRestriction.max} ans`
    }
    if (genderRestriction && child.gender !== genderRestriction) {
      return `Reserve aux ${genderRestriction === 'MALE' ? 'garcons' : 'filles'}`
    }
    return 'Non eligible'
  }

  // Etat de chargement
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Chargement des enfants...</span>
        </div>
      </div>
    )
  }

  // Non connecte
  if (!isAuthenticated) {
    return (
      <div className={`${className}`}>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <LogIn className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connectez-vous pour voir vos enfants
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Vous devez etre connecte pour selectionner vos enfants enregistres.
          </p>
          <Link
            href="/connexion"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Erreur
  if (error) {
    return (
      <div className={`${className}`}>
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Reessayer
          </button>
        </div>
      </div>
    )
  }

  const hasChildren = safeChildren.length > 0
  const hasEligibleChildren = eligibleChildren.length > 0

  return (
    <div className={`${className}`}>
      {/* Header compact */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
          {mode === 'multiple' && selectedChildIds.length > 0 && (
            <span className="text-xs text-primary">({selectedChildIds.length})</span>
          )}
        </div>
        {!showAddForm && showInlineAdd && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <UserPlus className="w-3 h-3" />
            Ajouter
          </button>
        )}
      </div>

      {/* Liste des enfants eligibles */}
      {hasEligibleChildren && (
        <div className="space-y-1 mb-2">
          {eligibleChildren.map(child => (
            <ChildSelectorCard
              key={child.id}
              child={child}
              selected={selectedChildIds.includes(child.id)}
              onToggle={() => handleToggle(child.id)}
              mode={mode}
              disabled={mode === 'multiple' && maxSelections !== undefined && selectedChildIds.length >= maxSelections && !selectedChildIds.includes(child.id)}
              calculateAge={calculateAge}
            />
          ))}
        </div>
      )}

      {/* Liste des enfants ineligibles (grises) */}
      {ineligibleChildren.length > 0 && (
        <div className="space-y-1 mb-2">
          <p className="text-xs text-gray-400">Non éligibles :</p>
          {ineligibleChildren.map(child => (
            <ChildSelectorCard
              key={child.id}
              child={child}
              selected={false}
              onToggle={() => {}}
              mode={mode}
              disabled={true}
              disabledReason={getIneligibilityReason(child)}
              calculateAge={calculateAge}
            />
          ))}
        </div>
      )}

      {/* Etat vide compact */}
      {!hasChildren && !showAddForm && (
        <div className="border border-dashed border-gray-300 rounded-md p-3 text-center text-sm text-gray-500 mb-2">
          Aucun enfant enregistré
        </div>
      )}

      {/* Formulaire d'ajout inline */}
      {showAddForm && (
        <div className="mb-2">
          <InlineChildForm
            onSubmit={handleAddChild}
            onCancel={() => setShowAddForm(false)}
            isSubmitting={isAddingChild}
          />
        </div>
      )}

      {/* Lien vers gestion */}
      {!showAddForm && showModalLink && hasChildren && (
        <Link
          href="/dashboard/enfants"
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <ExternalLink className="w-3 h-3" />
          Gérer mes enfants
        </Link>
      )}

      {/* Restrictions info compact */}
      {(ageRestriction || genderRestriction) && (
        <p className="mt-2 text-xs text-gray-400">
          {ageRestriction?.min && `${ageRestriction.min}+ ans`}
          {ageRestriction?.min && ageRestriction?.max && ' · '}
          {ageRestriction?.max && `max ${ageRestriction.max} ans`}
          {(ageRestriction?.min || ageRestriction?.max) && genderRestriction && ' · '}
          {genderRestriction && (genderRestriction === 'MALE' ? 'Garçons' : 'Filles')}
        </p>
      )}
    </div>
  )
}
