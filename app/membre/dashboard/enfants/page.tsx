'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Users, Edit } from 'lucide-react'
import AddEditChildModal from '@/components/AddEditChildModal'

interface Child {
  id: string
  firstName: string
  lastName: string
  nickName?: string
  birthDate: string
  gender?: string
  notes?: string
  avatarUrl?: string
  createdAt: string
  _count?: {
    enrollments: number
    eventRegistrations: number
  }
}

export default function EnfantsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [childToEdit, setChildToEdit] = useState<Child | undefined>(undefined)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadChildren()
    }
  }, [status])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/account/children')
      const data = await res.json()

      if (data.children) {
        setChildren(data.children)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleEditChild = (child: Child) => {
    setChildToEdit(child)
    setShowAddModal(true)
  }

  const handleAddNewChild = () => {
    setChildToEdit(undefined)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setChildToEdit(undefined)
  }

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      return
    }

    try {
      const res = await fetch(`/api/account/children/${childId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        alert('Enfant supprimé avec succès')
        loadChildren()
      } else {
        if (data.details) {
          alert(
            `Impossible de supprimer cet enfant.\n\nInscriptions actives:\n- Activités: ${data.details.enrollments}\n- Événements: ${data.details.eventRegistrations}`
          )
        } else {
          alert(data.error || 'Erreur lors de la suppression')
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression de l\'enfant')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Mes Enfants
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez les profils de vos enfants pour les inscriptions aux activités et événements
              </p>
            </div>
            <button
              onClick={handleAddNewChild}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Ajouter un enfant
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total enfants</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{children.length}</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inscriptions activités</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {children.reduce((sum, child) => sum + (child._count?.enrollments || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inscriptions événements</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {children.reduce((sum, child) => sum + (child._count?.eventRegistrations || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎉</span>
              </div>
            </div>
          </div>
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun enfant ajouté</h3>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter les profils de vos enfants pour les inscrire aux activités et événements
            </p>
            <button
              onClick={handleAddNewChild}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Ajouter mon premier enfant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.firstName} className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      getInitials(child.firstName, child.lastName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {child.firstName} {child.lastName}
                    </h3>
                    {child.nickName && (
                      <p className="text-sm text-gray-500">"{child.nickName}"</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {calculateAge(child.birthDate)} ans
                      {child.gender && (
                        <span className="ml-2">
                          {child.gender === 'MALE' ? '👦' : '👧'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {child.notes && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> {child.notes}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {child._count?.enrollments || 0}
                    </p>
                    <p className="text-xs text-gray-600">Activités</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {child._count?.eventRegistrations || 0}
                    </p>
                    <p className="text-xs text-gray-600">Événements</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditChild(child)}
                    className="flex-1 bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Child Modal */}
        <AddEditChildModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onSuccess={loadChildren}
          childToEdit={childToEdit}
        />
      </div>
    </div>
  )
}
