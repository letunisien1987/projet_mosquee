'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Monitor,
  Mail,
  Globe,
  Smartphone,
} from 'lucide-react'

// Types
interface Logo {
  id: string
  name: string
  type: string
  colorVariant: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  width: number | null
  height: number | null
  isDefault: boolean
  createdAt: string
  locationConfigs: LocationConfig[]
}

interface LocationConfig {
  id: string
  location: string
  logoId: string
  className: string | null
  logo?: Logo
}

type TabType = 'gallery' | 'upload' | 'locations'

// Labels pour les enums
const TYPE_LABELS: Record<string, string> = {
  PRIMARY: 'Principal',
  HORIZONTAL: 'Horizontal',
  ICON: 'Icone',
  FAVICON: 'Favicon',
  EMAIL: 'Email',
}

const COLOR_LABELS: Record<string, string> = {
  COLOR: 'Couleur',
  WHITE: 'Blanc',
  DARK: 'Sombre',
}

const LOCATION_LABELS: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  HEADER: { label: 'En-tete', icon: <Monitor className="h-4 w-4" />, description: 'Navigation principale du site' },
  FOOTER: { label: 'Pied de page', icon: <Globe className="h-4 w-4" />, description: 'Bas de toutes les pages' },
  DASHBOARD: { label: 'Dashboard', icon: <Settings className="h-4 w-4" />, description: 'Menu lateral admin/membre' },
  DASHBOARD_MOBILE: { label: 'Dashboard Mobile', icon: <Smartphone className="h-4 w-4" />, description: 'En-tete mobile du dashboard' },
  EMAIL_HEADER: { label: 'Email (haut)', icon: <Mail className="h-4 w-4" />, description: 'En-tete des emails' },
  EMAIL_FOOTER: { label: 'Email (bas)', icon: <Mail className="h-4 w-4" />, description: 'Pied des emails' },
  OG_IMAGE: { label: 'Image Partage', icon: <Globe className="h-4 w-4" />, description: 'Image OpenGraph pour reseaux sociaux' },
  FAVICON: { label: 'Favicon', icon: <ImageIcon className="h-4 w-4" />, description: 'Icone du navigateur' },
}

// Options de taille predefinies
const SIZE_OPTIONS = [
  { value: 'h-6 w-auto', label: 'Petit (24px)' },
  { value: 'h-8 w-auto', label: 'Moyen (32px)' },
  { value: 'h-10 w-auto', label: 'Grand (40px)' },
  { value: 'h-12 w-auto', label: 'Tres grand (48px)' },
  { value: 'h-16 w-auto', label: 'Extra large (64px)' },
  { value: 'custom', label: 'Personnalise...' },
]

export default function LogosPage() {
  const [logos, setLogos] = useState<Logo[]>([])
  const [locationConfigs, setLocationConfigs] = useState<LocationConfig[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('gallery')

  // Upload form state
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('PRIMARY')
  const [uploadColorVariant, setUploadColorVariant] = useState('COLOR')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Size configuration state
  const [customClassNames, setCustomClassNames] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})

  // Fetch logos
  const fetchLogos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/logos')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setLogos(data.logos || [])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch location configs
  const fetchLocationConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/logos/locations')
      const data = await response.json()
      if (!response.ok) {
        console.error('Erreur API locations:', data)
        // Ne pas afficher d'erreur si juste pas authentifié - les configs sont optionnelles
        return
      }
      setLocationConfigs(data.configs || [])
      setAvailableLocations(data.locations || [])
    } catch (err) {
      console.error('Erreur chargement locations:', err)
    }
  }, [])

  useEffect(() => {
    fetchLogos()
    fetchLocationConfigs()
  }, [fetchLogos, fetchLocationConfigs])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon']
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non autorise. Utilisez PNG, JPG, SVG, WEBP ou ICO.')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux. Maximum 5MB.')
      return
    }

    setUploadFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Auto-fill name if empty
    if (!uploadName) {
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      setUploadName(baseName)
    }
  }

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadFile) {
      setError('Selectionnez un fichier')
      return
    }

    if (!uploadName.trim()) {
      setError('Entrez un nom pour le logo')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('name', uploadName.trim())
      formData.append('type', uploadType)
      formData.append('colorVariant', uploadColorVariant)

      const response = await fetch('/api/admin/logos', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      setSuccess('Logo uploade avec succes!')
      setUploadFile(null)
      setUploadPreview(null)
      setUploadName('')
      if (fileInputRef.current) fileInputRef.current.value = ''

      fetchLogos()

      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  // Handle delete
  const handleDelete = async (logoId: string) => {
    if (!confirm('Supprimer ce logo ?')) return

    try {
      const response = await fetch(`/api/admin/logos?id=${logoId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      setSuccess('Logo supprime')
      fetchLogos()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    }
  }

  // Handle location assignment
  const handleLocationAssign = async (location: string, logoId: string, className?: string) => {
    try {
      const config = locationConfigs.find(c => c.location === location)
      const response = await fetch('/api/admin/logos/locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          logoId,
          className: className ?? config?.className ?? 'h-8 w-auto'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la configuration')
      }

      setSuccess(`Logo assigne a ${LOCATION_LABELS[location]?.label || location}`)
      fetchLocationConfigs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    }
  }

  // Handle size change
  const handleSizeChange = async (location: string, className: string) => {
    // Si "custom" est sélectionné, montrer l'input personnalisé
    if (className === 'custom') {
      setShowCustomInput(prev => ({ ...prev, [location]: true }))
      return
    }

    setShowCustomInput(prev => ({ ...prev, [location]: false }))

    const currentLogo = getLogoForLocation(location)
    if (!currentLogo) {
      setError('Selectionnez d\'abord un logo pour cet emplacement')
      return
    }

    try {
      const response = await fetch('/api/admin/logos/locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          logoId: currentLogo.id,
          className
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise a jour')
      }

      setSuccess(`Taille mise a jour pour ${LOCATION_LABELS[location]?.label || location}`)
      fetchLocationConfigs()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
    }
  }

  // Handle custom className
  const handleCustomClassNameSave = async (location: string) => {
    const className = customClassNames[location]
    if (!className?.trim()) {
      setError('Entrez une classe CSS valide')
      return
    }

    await handleSizeChange(location, className.trim())
    setShowCustomInput(prev => ({ ...prev, [location]: false }))
  }

  // Get current className for location
  const getClassNameForLocation = (location: string): string => {
    const config = locationConfigs.find(c => c.location === location)
    return config?.className || 'h-8 w-auto'
  }

  // Check if current className is a predefined size
  const isPresetSize = (className: string): boolean => {
    return SIZE_OPTIONS.some(opt => opt.value === className && opt.value !== 'custom')
  }

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get current logo for location
  const getLogoForLocation = (location: string) => {
    const config = locationConfigs.find(c => c.location === location)
    if (!config) return null
    return logos.find(l => l.id === config.logoId)
  }

  const tabs = [
    { id: 'gallery' as const, label: 'Galerie', icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'upload' as const, label: 'Upload', icon: <Upload className="h-4 w-4" /> },
    { id: 'locations' as const, label: 'Emplacements', icon: <MapPin className="h-4 w-4" /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerez les logos et leur affichage sur le site
          </p>
        </div>
        <button
          onClick={() => { fetchLogos(); fetchLocationConfigs(); }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Galerie */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Logos disponibles ({logos.length})
              </h2>

              {logos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun logo uploade</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 text-primary hover:underline"
                  >
                    Uploader un logo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logos.map((logo) => (
                    <div
                      key={logo.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      {/* Preview */}
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center h-32">
                        <Image
                          src={logo.filePath}
                          alt={logo.name}
                          width={logo.width || 200}
                          height={logo.height || 60}
                          className="max-h-full max-w-full object-contain"
                          unoptimized={logo.mimeType === 'image/svg+xml'}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{logo.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {TYPE_LABELS[logo.type] || logo.type}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {COLOR_LABELS[logo.colorVariant] || logo.colorVariant}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {formatSize(logo.fileSize)}
                          </span>
                        </div>
                        {logo.locationConfigs.length > 0 && (
                          <p className="text-xs text-green-600 mt-2">
                            Utilise dans {logo.locationConfigs.length} emplacement(s)
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDelete(logo.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                          disabled={logo.locationConfigs.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Upload */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUpload} className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Uploader un nouveau logo
              </h2>

              {/* File input */}
              <div>
                <label className="block text-sm font-medium mb-2">Fichier *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    uploadPreview
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {uploadPreview ? (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded p-4 inline-block">
                        <Image
                          src={uploadPreview}
                          alt="Preview"
                          width={200}
                          height={60}
                          className="max-h-20 object-contain"
                        />
                      </div>
                      <p className="text-sm text-gray-600">{uploadFile?.name}</p>
                      <p className="text-xs text-gray-500">Cliquez pour changer</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">Cliquez pour selectionner un fichier</p>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG, SVG, WEBP ou ICO (max 5MB)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Nom du logo *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Ex: Logo principal couleur"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              {/* Type and Variant */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                  >
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Variante couleur *</label>
                  <select
                    value={uploadColorVariant}
                    onChange={(e) => setUploadColorVariant(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                  >
                    {Object.entries(COLOR_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Upload en cours...' : 'Uploader le logo'}
              </button>
            </form>
          )}

          {/* Tab: Emplacements */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Configuration des emplacements
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choisissez quel logo afficher a chaque emplacement du site.
              </p>

              {logos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Uploadez d'abord des logos pour les configurer</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 text-primary hover:underline"
                  >
                    Uploader un logo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableLocations.map((location) => {
                    const currentLogo = getLogoForLocation(location)
                    const locationInfo = LOCATION_LABELS[location]
                    const currentClassName = getClassNameForLocation(location)
                    const isCustom = !isPresetSize(currentClassName) && currentLogo

                    return (
                      <div
                        key={location}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Row 1: Location info + Logo selector */}
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Location info */}
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                {locationInfo?.icon || <MapPin className="h-4 w-4" />}
                              </div>
                              <div>
                                <h3 className="font-medium">{locationInfo?.label || location}</h3>
                                <p className="text-xs text-gray-500">{locationInfo?.description}</p>
                              </div>
                            </div>

                            {/* Current logo preview */}
                            <div className="flex-1">
                              {currentLogo ? (
                                <div className="flex items-center gap-3">
                                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 h-12 flex items-center">
                                    <Image
                                      src={currentLogo.filePath}
                                      alt={currentLogo.name}
                                      width={80}
                                      height={32}
                                      className="max-h-8 object-contain"
                                      unoptimized={currentLogo.mimeType === 'image/svg+xml'}
                                    />
                                  </div>
                                  <span className="text-sm text-gray-600">{currentLogo.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Aucun logo configure</span>
                              )}
                            </div>

                            {/* Logo selector */}
                            <div className="min-w-[200px]">
                              <label className="block text-xs text-gray-500 mb-1">Logo</label>
                              <select
                                value={currentLogo?.id || ''}
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleLocationAssign(location, e.target.value)
                                  }
                                }}
                                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                              >
                                <option value="">Selectionner un logo...</option>
                                {logos.map((logo) => (
                                  <option key={logo.id} value={logo.id}>
                                    {logo.name} ({TYPE_LABELS[logo.type]})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Size configuration (only if logo is selected) */}
                          {currentLogo && (
                            <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2 min-w-[200px]">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Taille:</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 flex-1">
                                {/* Preset size selector */}
                                <select
                                  value={isCustom || showCustomInput[location] ? 'custom' : currentClassName}
                                  onChange={(e) => handleSizeChange(location, e.target.value)}
                                  className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                                >
                                  {SIZE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>

                                {/* Custom className input */}
                                {(showCustomInput[location] || isCustom) && (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="ex: h-10 w-auto"
                                      value={customClassNames[location] ?? currentClassName}
                                      onChange={(e) => setCustomClassNames(prev => ({
                                        ...prev,
                                        [location]: e.target.value
                                      }))}
                                      className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 w-40"
                                    />
                                    <button
                                      onClick={() => handleCustomClassNameSave(location)}
                                      className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
                                    >
                                      OK
                                    </button>
                                  </div>
                                )}

                                {/* Current className display */}
                                <span className="text-xs text-gray-400 ml-2">
                                  Classe: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{currentClassName}</code>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
