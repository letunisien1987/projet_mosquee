'use client'

import { useEffect, useState } from 'react'
import {
  Users, Mail, Phone, Shield, Search, Filter,
  Eye, UserCheck, UserX, DollarSign, Bell, XCircle,
  Clock, CreditCard, RefreshCw, Ban, Edit2, type LucideIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Membership {
  id: string
  type: string
  status: string
  paymentStatus: string
  amount: number
  startDate: string
  endDate: string
  createdAt: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: string | null
  profile: {
    city: string | null
    postalCode: string | null
    country: string | null
  } | null
  role: string
  createdAt: string
  memberships: Membership[]
  _count: {
    donations: number
    eventRegistrations: number
    enrollments: number
  }
}

export default function MembresPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [membershipFilter, setMembershipFilter] = useState<string>('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    activeMembers: 0,
    expiredMembers: 0,
    noMembership: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?includeMemberships=true')
      const data = await response.json()

      if (!response.ok || !Array.isArray(data)) {
        console.error('Erreur API:', data)
        alert(data.error || 'Erreur lors du chargement des membres')
        setUsers([])
        setStats({ total: 0, activeMembers: 0, expiredMembers: 0, noMembership: 0 })
        return
      }

      setUsers(data)

      const activeMembers = data.filter((u: User) =>
        u.memberships.some(m => m.status === 'ACTIVE')
      ).length
      const expiredMembers = data.filter((u: User) =>
        u.memberships.length > 0 && !u.memberships.some(m => m.status === 'ACTIVE')
      ).length
      const noMembership = data.filter((u: User) => u.memberships.length === 0).length

      setStats({
        total: data.length,
        activeMembers,
        expiredMembers,
        noMembership,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error)
      alert('Erreur lors du chargement des membres')
      setUsers([])
      setStats({ total: 0, activeMembers: 0, expiredMembers: 0, noMembership: 0 })
    } finally {
      setLoading(false)
    }
  }

  const getActiveMembership = (user: User): Membership | null => {
    return user.memberships.find(m => m.status === 'ACTIVE') || null
  }

  const getMembershipStatus = (user: User): { label: string; color: string; icon: LucideIcon } => {
    const activeMembership = getActiveMembership(user)

    if (activeMembership) {
      if (activeMembership.type === 'ACTIF') {
        return {
          label: 'Membre Actif',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: UserCheck
        }
      } else if (activeMembership.type === 'PASSIF') {
        return {
          label: 'Membre Passif',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          icon: Users
        }
      }
    }

    if (user.memberships.length > 0) {
      return {
        label: 'Cotisation expiree',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        icon: Clock
      }
    }

    return {
      label: 'Aucune cotisation',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      icon: UserX
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter

    let matchesMembership = true
    if (membershipFilter === 'ACTIVE') {
      matchesMembership = user.memberships.some(m => m.status === 'ACTIVE')
    } else if (membershipFilter === 'ACTIF') {
      matchesMembership = user.memberships.some(m => m.status === 'ACTIVE' && m.type === 'ACTIF')
    } else if (membershipFilter === 'PASSIF') {
      matchesMembership = user.memberships.some(m => m.status === 'ACTIVE' && m.type === 'PASSIF')
    } else if (membershipFilter === 'EXPIRED') {
      matchesMembership = user.memberships.length > 0 && !user.memberships.some(m => m.status === 'ACTIVE')
    } else if (membershipFilter === 'NONE') {
      matchesMembership = user.memberships.length === 0
    }

    return matchesSearch && matchesRole && matchesMembership
  })

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      IMAM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      TEACHER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      STAFF: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      MANAGER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return colors[role] || colors.MEMBER
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      IMAM: 'Imam',
      TEACHER: 'Enseignant',
      STAFF: 'Personnel',
      MANAGER: 'Gestionnaire',
      MEMBER: 'Membre',
    }
    return labels[role] || role
  }

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        await fetchUsers()
        setShowRoleModal(false)
        setSelectedUser(null)
        setNewRole('')
        alert('Role modifie avec succes')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modification du role')
    } finally {
      setProcessing(false)
    }
  }

  const handleChangeMembershipStatus = async () => {
    if (!selectedUser) return
    const activeMembership = getActiveMembership(selectedUser)
    if (!activeMembership || !newStatus) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/memberships/${activeMembership.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        await fetchUsers()
        setShowStatusModal(false)
        setSelectedUser(null)
        setNewStatus('')
        alert('Statut modifie avec succes')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modification du statut')
    } finally {
      setProcessing(false)
    }
  }

  const handleSendReminder = async (user: User) => {
    if (!confirm(`Envoyer un rappel de cotisation a ${user.firstName} ${user.lastName} ?`)) return

    try {
      const res = await fetch(`/api/admin/users/${user.id}/send-reminder`, {
        method: 'POST',
      })

      if (res.ok) {
        alert('Rappel envoye avec succes')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi du rappel')
    }
  }

  const handleRefund = async (membership: Membership) => {
    if (!confirm('Etes-vous sur de vouloir effectuer un remboursement ? Cette action est irreversible.')) return

    try {
      const res = await fetch(`/api/admin/memberships/${membership.id}/refund`, {
        method: 'POST',
      })

      if (res.ok) {
        await fetchUsers()
        alert('Remboursement effectue avec succes')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du remboursement')
    }
  }

  const handleCloseMembership = async (membership: Membership) => {
    if (!confirm('Etes-vous sur de vouloir cloturer cette cotisation ?')) return

    try {
      const res = await fetch(`/api/admin/memberships/${membership.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'EXPIRED' }),
      })
      if (res.ok) {
        await fetchUsers()
        setShowDetailsModal(false)
        alert('Cotisation cloturee')
      } else {
        const data = await res.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la cloture')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Membres</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Liste et gestion des utilisateurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Utilisateurs</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Membres Actifs</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats.activeMembers}</p>
            </div>
            <UserCheck className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cotisations Expirees</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">{stats.expiredMembers}</p>
            </div>
            <Clock className="h-12 w-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sans Cotisation</p>
              <p className="text-3xl font-bold mt-2">{stats.noMembership}</p>
            </div>
            <UserX className="h-12 w-12 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prenom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="ALL">Tous les roles</option>
              <option value="MEMBER">Membres</option>
              <option value="MANAGER">Gestionnaires</option>
              <option value="ADMIN">Administrateurs</option>
              <option value="IMAM">Imams</option>
              <option value="TEACHER">Enseignants</option>
              <option value="STAFF">Personnel</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={membershipFilter}
              onChange={(e) => setMembershipFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="ALL">Toutes les cotisations</option>
              <option value="ACTIVE">Cotisations actives</option>
              <option value="ACTIF">Membres actifs</option>
              <option value="PASSIF">Membres passifs</option>
              <option value="EXPIRED">Cotisations expirees</option>
              <option value="NONE">Sans cotisation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut Cotisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Validite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucun membre trouve
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const membershipStatus = getMembershipStatus(user)
                  const activeMembership = getActiveMembership(user)
                  const StatusIcon = membershipStatus.icon

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 font-semibold">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4" />
                            <span className="truncate max-w-xs">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-5 w-5" />
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${membershipStatus.color}`}>
                            {membershipStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {activeMembership ? (
                          <div className="text-gray-900 dark:text-white">
                            Jusqu&apos;au {format(new Date(activeMembership.endDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        ) : user.memberships.length > 0 ? (
                          <div className="text-orange-600 dark:text-orange-400">
                            Expiree le {format(new Date(user.memberships[0].endDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDetailsModal(true)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setNewRole(user.role)
                              setShowRoleModal(true)
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="Changer role"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          {!activeMembership && user.memberships.length > 0 && (
                            <button
                              onClick={() => handleSendReminder(user)}
                              className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="Relancer"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Details */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Details du membre
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedUser(null)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informations personnelles
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Nom complet:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Telephone:</span>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedUser.phone || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Adresse:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedUser.address || selectedUser.profile ? (
                        <>
                          {selectedUser.address && <>{selectedUser.address}<br /></>}
                          {selectedUser.profile?.postalCode} {selectedUser.profile?.city}
                          {(selectedUser.profile?.postalCode || selectedUser.profile?.city) && <br />}
                          {selectedUser.profile?.country}
                        </>
                      ) : '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Inscrit le:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(selectedUser.createdAt), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Statistiques
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cotisations</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedUser.memberships.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dons</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedUser._count.donations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Evenements</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedUser._count.eventRegistrations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cours</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {selectedUser._count.enrollments}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedUser.memberships.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Historique des cotisations
                </h3>
                <div className="space-y-3">
                  {selectedUser.memberships.map((membership) => (
                    <div key={membership.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {membership.type === 'ACTIF' ? 'Membre Actif' : membership.type === 'PASSIF' ? 'Membre Passif' : membership.type}
                          </span>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(membership.startDate), 'dd MMM yyyy', { locale: fr })} - {format(new Date(membership.endDate), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900 dark:text-white">
                            {membership.amount.toFixed(2)} CHF
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              membership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              membership.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {membership.status}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              membership.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {membership.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      {membership.status === 'ACTIVE' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setSelectedUser(selectedUser)
                              setNewStatus(membership.status)
                              setShowStatusModal(true)
                              setShowDetailsModal(false)
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Edit2 className="h-4 w-4" />
                            Modifier statut
                          </button>
                          <button
                            onClick={() => handleRefund(membership)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Rembourser
                          </button>
                          <button
                            onClick={() => handleCloseMembership(membership)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            <Ban className="h-4 w-4" />
                            Cloturer
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changer Role */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Changer le role</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Membre: {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Nouveau role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500"
              >
                <option value="MEMBER">Membre</option>
                <option value="MANAGER">Gestionnaire</option>
                <option value="STAFF">Personnel</option>
                <option value="TEACHER">Enseignant</option>
                <option value="IMAM">Imam</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedUser(null)
                  setNewRole('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleChangeRole}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? 'Modification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changer Statut Cotisation */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Modifier le statut</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Membre: {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Nouveau statut
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500"
              >
                <option value="ACTIVE">Actif</option>
                <option value="EXPIRED">Expire</option>
                <option value="PENDING">En attente</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedUser(null)
                  setNewStatus('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={processing}
              >
                Annuler
              </button>
              <button
                onClick={handleChangeMembershipStatus}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? 'Modification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Affichage de {filteredUsers.length} membre{filteredUsers.length > 1 ? 's' : ''} sur {stats.total}
      </div>
    </div>
  )
}
