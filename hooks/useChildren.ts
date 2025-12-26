'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Child {
  id: string
  firstName: string
  lastName: string
  nickName?: string | null
  birthDate: string
  gender?: string | null
  notes?: string | null
  avatarUrl?: string | null
  parentId: string
  createdAt: string
  updatedAt: string
  _count?: {
    enrollments: number
    eventRegistrations: number
  }
}

export interface CreateChildInput {
  firstName: string
  lastName: string
  nickName?: string
  birthDate: string
  gender?: 'MALE' | 'FEMALE'
  notes?: string
  avatarUrl?: string
}

interface UseChildrenReturn {
  children: Child[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addChild: (data: CreateChildInput) => Promise<Child | null>
  updateChild: (id: string, data: Partial<CreateChildInput>) => Promise<Child | null>
  deleteChild: (id: string) => Promise<boolean>
  calculateAge: (birthDate: string) => number
  getChildById: (id: string) => Child | undefined
  isAuthenticated: boolean
}

/**
 * Hook pour gérer les enfants de l'utilisateur connecté
 * Centralise la logique de fetch, création et mise à jour
 */
export function useChildren(): UseChildrenReturn {
  const { data: session, status } = useSession()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = status === 'authenticated'

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = useCallback((birthDate: string): number => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [])

  // Récupérer les enfants
  const fetchChildren = useCallback(async () => {
    if (!isAuthenticated) {
      setChildren([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/account/children')

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des enfants')
      }

      const data = await response.json()
      // L'API retourne { children: [...] } - extraire le tableau
      const childrenArray = data.children || data
      setChildren(Array.isArray(childrenArray) ? childrenArray : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setChildren([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Ajouter un enfant
  const addChild = useCallback(async (data: CreateChildInput): Promise<Child | null> => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté pour ajouter un enfant')
      return null
    }

    try {
      const response = await fetch('/api/account/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      const result = await response.json()
      const newChild = result.child

      // Mettre à jour la liste locale
      setChildren(prev => [newChild, ...prev])

      return newChild
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      return null
    }
  }, [isAuthenticated])

  // Mettre à jour un enfant
  const updateChild = useCallback(async (
    id: string,
    data: Partial<CreateChildInput>
  ): Promise<Child | null> => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté')
      return null
    }

    try {
      const response = await fetch(`/api/account/children/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      const result = await response.json()
      const updatedChild = result.child

      // Mettre à jour la liste locale
      setChildren(prev => prev.map(c => c.id === id ? updatedChild : c))

      return updatedChild
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      return null
    }
  }, [isAuthenticated])

  // Supprimer un enfant
  const deleteChild = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté')
      return false
    }

    try {
      const response = await fetch(`/api/account/children/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      // Mettre à jour la liste locale
      setChildren(prev => prev.filter(c => c.id !== id))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      return false
    }
  }, [isAuthenticated])

  // Trouver un enfant par ID
  const getChildById = useCallback((id: string): Child | undefined => {
    return children.find(c => c.id === id)
  }, [children])

  // Charger les enfants au montage et quand l'authentification change
  useEffect(() => {
    if (status !== 'loading') {
      fetchChildren()
    }
  }, [status, fetchChildren])

  return {
    children,
    loading,
    error,
    refetch: fetchChildren,
    addChild,
    updateChild,
    deleteChild,
    calculateAge,
    getChildById,
    isAuthenticated,
  }
}

/**
 * Utilitaire pour filtrer les enfants selon les restrictions
 */
export function filterChildrenByRestrictions(
  children: Child[] | undefined | null,
  restrictions?: {
    minAge?: number
    maxAge?: number
    gender?: 'MALE' | 'FEMALE'
  },
  calculateAge?: (birthDate: string) => number
): Child[] {
  // S'assurer que children est un tableau
  if (!children || !Array.isArray(children)) return []
  if (!restrictions || !calculateAge) return children

  return children.filter(child => {
    const age = calculateAge(child.birthDate)

    // Vérifier l'âge minimum
    if (restrictions.minAge !== undefined && age < restrictions.minAge) {
      return false
    }

    // Vérifier l'âge maximum
    if (restrictions.maxAge !== undefined && age > restrictions.maxAge) {
      return false
    }

    // Vérifier le genre
    if (restrictions.gender && child.gender !== restrictions.gender) {
      return false
    }

    return true
  })
}

/**
 * Génère les initiales d'un enfant pour l'avatar
 */
export function getChildInitials(child: Child): string {
  const first = child.firstName.charAt(0).toUpperCase()
  const last = child.lastName.charAt(0).toUpperCase()
  return `${first}${last}`
}

/**
 * Retourne l'emoji du genre
 */
export function getGenderEmoji(gender?: string | null): string {
  if (gender === 'MALE') return '👦'
  if (gender === 'FEMALE') return '👧'
  return '👶'
}
