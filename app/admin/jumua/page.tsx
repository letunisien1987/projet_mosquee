'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpenText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  ArrowLeft,
  Clock,
  CalendarDays,
  GripVertical,
  Save,
  Info,
  ExternalLink,
  Upload,
  ImageIcon,
} from 'lucide-react'

interface JumuaMessage {
  id: string
  title: string
  message: string
  image?: string
  is_active: boolean
  order: number
  valid_from?: string
  valid_until?: string
}

interface MawaqitJumuaTimes {
  jumua?: string[]
}

export default function JumuaAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [messages, setMessages] = useState<JumuaMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [mawaqitTimes, setMawaqitTimes] = useState<string[]>([])
  const [loadingMawaqit, setLoadingMawaqit] = useState(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingMessage, setEditingMessage] = useState<JumuaMessage | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: '',
    is_active: true,
    order: 0,
    valid_from: '',
    valid_until: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchMessages()
      fetchMawaqitTimes()
    }
  }, [session])

  const fetchMawaqitTimes = async () => {
    try {
      const res = await fetch('/api/prayer-times')
      if (res.ok) {
        const data = await res.json()
        if (data.specialInfo?.jumua) {
          setMawaqitTimes(data.specialInfo.jumua)
        }
      }
    } catch (err) {
      console.error('Erreur chargement horaires Mawaqit:', err)
    } finally {
      setLoadingMawaqit(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/jumua')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      } else {
        setError('Erreur lors du chargement')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (msg: JumuaMessage) => {
    if (!confirm(`Supprimer le message "${msg.title}" ?`)) return

    setDeleteLoading(msg.id)
    try {
      const res = await fetch(`/api/admin/jumua/${msg.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessages(messages.filter(m => m.id !== msg.id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setDeleteLoading(null)
    }
  }

  const openCreateModal = () => {
    setEditingMessage(null)
    setFormData({
      title: '',
      message: '',
      image: '',
      is_active: true,
      order: messages.length,
      valid_from: '',
      valid_until: '',
    })
    setImagePreview(null)
    setShowModal(true)
  }

  const openEditModal = (msg: JumuaMessage) => {
    setEditingMessage(msg)
    setFormData({
      title: msg.title,
      message: msg.message,
      image: msg.image || '',
      is_active: msg.is_active,
      order: msg.order,
      valid_from: msg.valid_from ? msg.valid_from.split('T')[0] : '',
      valid_until: msg.valid_until ? msg.valid_until.split('T')[0] : '',
    })
    // Définir l'aperçu de l'image existante via le proxy API
    setImagePreview(msg.image ? `/api/assets/${msg.image}` : null)
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP.')
      return
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux. Maximum 5MB.')
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, image: data.fileId })
        // Utiliser le proxy API pour l'aperçu
        setImagePreview(`/api/assets/${data.fileId}`)
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de l\'upload')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' })
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        image: formData.image && formData.image.trim() !== '' ? formData.image : undefined,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
      }

      const url = editingMessage
        ? `/api/admin/jumua/${editingMessage.id}`
        : '/api/admin/jumua'

      const method = editingMessage ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        fetchMessages()
        setShowModal(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      alert('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const activeCount = messages.filter(m => m.is_active).length

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BookOpenText className="h-7 w-7 text-primary" />
              Messages Jumua
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez les messages affichés pour la prière du vendredi
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau message
          </button>
        </div>
      </div>

      {/* Horaires Mawaqit */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">Horaires Jumua (depuis Mawaqit)</h3>
            <p className="text-sm text-white/80 mb-4">
              Ces horaires sont automatiquement récupérés depuis l&apos;API Mawaqit et affichés dans le slider de la page d&apos;accueil.
            </p>
            {loadingMawaqit ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : mawaqitTimes.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {mawaqitTimes.map((time, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xl font-bold">{time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/70">Aucun horaire Jumua configuré dans Mawaqit</p>
            )}
          </div>
          <a
            href="https://mawaqit.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Mawaqit
          </a>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Comment ça fonctionne :</strong> Créez des messages qui s&apos;afficheront dans le slider de la page d&apos;accueil.
          Les horaires de prière Jumua sont automatiquement récupérés depuis Mawaqit et affichés sous chaque message.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpenText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total messages</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des messages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold w-12">#</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Message</th>
              <th className="px-6 py-4 text-left text-sm font-semibold w-20">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Validité</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Statut</th>
              <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {messages.sort((a, b) => a.order - b.order).map((msg) => (
              <tr key={msg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical className="h-4 w-4" />
                    {msg.order + 1}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{msg.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-md">
                    {msg.message.substring(0, 100)}{msg.message.length > 100 && '...'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {msg.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={`/api/assets/${msg.image}?width=48&height=48&fit=cover`}
                        alt="Miniature"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatDate(msg.valid_from)}</span>
                    <span>→</span>
                    <span>{formatDate(msg.valid_until)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {msg.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                      <Check className="h-3 w-3" /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                      <X className="h-3 w-3" /> Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(msg)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(msg)}
                      disabled={deleteLoading === msg.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deleteLoading === msg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {messages.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Aucun message créé
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpenText className="h-5 w-5 text-primary" />
                {editingMessage ? 'Modifier le message' : 'Nouveau message'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Horaires Jumua"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Contenu du message..."
                />
              </div>

              {/* Upload d'image */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Image (optionnel)
                </label>

                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Supprimer l'image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                        <span className="text-sm text-gray-500">Upload en cours...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Cliquez pour uploader une image</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP (max 5MB)</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Info sur les horaires Mawaqit */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-emerald-800">
                  <strong>Horaires de prière :</strong> Les horaires Jumua ({mawaqitTimes.length > 0 ? mawaqitTimes.join(', ') : 'non disponibles'})
                  sont automatiquement récupérés depuis Mawaqit et affichés sous ce message.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valide à partir du</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Valide jusqu&apos;au</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ordre d&apos;affichage</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Message actif</span>
              </label>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingMessage ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
