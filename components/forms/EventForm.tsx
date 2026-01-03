'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  ArrowLeft,
  Loader2,
  Save,
  CreditCard,
  UserCheck,
  Users,
  Percent,
  Gift,
  Clock,
  RefreshCcw,
  Info,
  MapPin,
  Settings,
  Mail,
} from 'lucide-react'

const categories = [
  { value: 'religieux', label: 'Religieux' },
  { value: 'communaute', label: 'Communauté' },
  { value: 'education', label: 'Éducation' },
  { value: 'charite', label: 'Charité' },
]

const paymentTypes = [
  { value: 'FREE', label: 'Gratuit' },
  { value: 'ONE_TIME', label: 'Paiement unique' },
  { value: 'SUBSCRIPTION', label: 'Abonnement' },
]

const subscriptionIntervals = [
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'YEARLY', label: 'Annuel' },
]

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
}

interface PricingConfig {
  adultPrice: number
  childPrice: number
  childFreeUntilAge: number
  groupDiscount: {
    enabled: boolean
    fromPersons: number
    discountPercent: number
  }
  familyMaxPrice: number | null
  earlyBird: {
    enabled: boolean
    untilDate: string | null
    discountPercent: number
  }
}

export interface EventData {
  id?: string
  title: string
  slug: string
  category: string
  description?: string
  content?: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  maxCapacity?: number
  registrationRequired: boolean
  requiresApproval: boolean
  registrationDeadline?: string
  featured: boolean
  published: boolean
  price?: number
  paymentType?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscriptionInterval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  pricing?: PricingConfig | null
  allowRefund?: boolean
  cancellationDeadlineDays?: number
  managerId?: string
  managerEmail?: string
  showOrganizerName?: boolean
  showOrganizerEmail?: boolean
  showOrganizerPhone?: boolean
  restrictions?: {
    enabled: boolean
    participationType: 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
    allowedGender: 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'
    minAge: number | null
    maxAge: number | null
  }
}

interface EventFormProps {
  event?: EventData
  mode: 'create' | 'edit'
  apiEndpoint: string
  backUrl: string
  successUrl: string
  showManagerField?: boolean
  title?: string
}

export default function EventForm({
  event,
  mode,
  apiEndpoint,
  backUrl,
  successUrl,
  showManagerField = false,
  title = mode === 'create' ? 'Nouvel événement' : "Modifier l'événement",
}: EventFormProps) {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(showManagerField)

  const [formData, setFormData] = useState({
    title: event?.title || '',
    slug: event?.slug || '',
    category: event?.category || 'religieux',
    description: event?.description || '',
    content: event?.content || '',
    date: event?.date ? event.date.split('T')[0] : '',
    startTime: event?.startTime || '',
    endTime: event?.endTime || '',
    location: event?.location || '',
    maxCapacity: event?.maxCapacity?.toString() || '',
    registrationRequired: event?.registrationRequired ?? false,
    requiresApproval: event?.requiresApproval ?? false,
    registrationDeadline: event?.registrationDeadline ? event.registrationDeadline.split('T')[0] : '',
    featured: event?.featured ?? false,
    published: event?.published ?? true,
    paymentType: (event?.paymentType || 'FREE') as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION',
    price: event?.price?.toString() || '',
    subscriptionInterval: (event?.subscriptionInterval || 'MONTHLY') as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    pricingEnabled: !!event?.pricing,
    pricing: {
      adultPrice: event?.pricing?.adultPrice?.toString() || '',
      childPrice: event?.pricing?.childPrice?.toString() || '',
      childFreeUntilAge: event?.pricing?.childFreeUntilAge?.toString() || '',
      groupDiscountEnabled: event?.pricing?.groupDiscount?.enabled ?? false,
      groupDiscountFromPersons: event?.pricing?.groupDiscount?.fromPersons?.toString() || '4',
      groupDiscountPercent: event?.pricing?.groupDiscount?.discountPercent?.toString() || '10',
      familyMaxPrice: event?.pricing?.familyMaxPrice?.toString() || '',
      earlyBirdEnabled: event?.pricing?.earlyBird?.enabled ?? false,
      earlyBirdUntilDate: event?.pricing?.earlyBird?.untilDate || '',
      earlyBirdDiscountPercent: event?.pricing?.earlyBird?.discountPercent?.toString() || '15',
    },
    allowRefund: event?.allowRefund ?? true,
    cancellationDeadlineDays: event?.cancellationDeadlineDays?.toString() || '7',
    managerId: event?.managerId || '',
    showOrganizerName: event?.showOrganizerName ?? false,
    showOrganizerEmail: event?.showOrganizerEmail ?? false,
    showOrganizerPhone: event?.showOrganizerPhone ?? false,
    restrictions: {
      enabled: event?.restrictions?.enabled ?? false,
      participationType: (event?.restrictions?.participationType || 'INDIVIDUAL') as 'INDIVIDUAL' | 'FAMILY' | 'MIXED',
      allowedGender: (event?.restrictions?.allowedGender || 'ALL') as 'MALE' | 'FEMALE' | 'CHILD' | 'ALL',
      minAge: event?.restrictions?.minAge?.toString() || '',
      maxAge: event?.restrictions?.maxAge?.toString() || '',
    },
  })

  // Charger les utilisateurs pour le champ responsable
  useEffect(() => {
    if (showManagerField) {
      const fetchUsers = async () => {
        try {
          const res = await fetch('/api/admin/users')
          if (res.ok) {
            const data = await res.json()
            const eligibleUsers = (Array.isArray(data) ? data : []).filter((u: User) =>
              ['ADMIN', 'IMAM', 'STAFF', 'TEACHER', 'MANAGER'].includes(u.role)
            )
            setUsers(eligibleUsers)
          }
        } catch {
          console.error('Erreur chargement utilisateurs')
        } finally {
          setLoadingUsers(false)
        }
      }
      fetchUsers()
    }
  }, [showManagerField])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const pricingPayload = formData.pricingEnabled && formData.paymentType !== 'FREE' ? {
        adultPrice: formData.pricing.adultPrice ? parseFloat(formData.pricing.adultPrice) : 0,
        childPrice: formData.pricing.childPrice ? parseFloat(formData.pricing.childPrice) : 0,
        childFreeUntilAge: formData.pricing.childFreeUntilAge ? parseInt(formData.pricing.childFreeUntilAge) : 0,
        groupDiscount: {
          enabled: formData.pricing.groupDiscountEnabled,
          fromPersons: parseInt(formData.pricing.groupDiscountFromPersons) || 4,
          discountPercent: parseInt(formData.pricing.groupDiscountPercent) || 10,
        },
        familyMaxPrice: formData.pricing.familyMaxPrice ? parseFloat(formData.pricing.familyMaxPrice) : null,
        earlyBird: {
          enabled: formData.pricing.earlyBirdEnabled,
          untilDate: formData.pricing.earlyBirdUntilDate || null,
          discountPercent: parseInt(formData.pricing.earlyBirdDiscountPercent) || 15,
        },
      } : null

      const payload: Record<string, unknown> = {
        ...formData,
        itemType: 'EVENT', // Toujours EVENT pour ce formulaire
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        subscriptionInterval: formData.paymentType === 'SUBSCRIPTION' ? formData.subscriptionInterval : undefined,
        pricing: pricingPayload,
        allowRefund: formData.paymentType !== 'FREE' ? formData.allowRefund : undefined,
        cancellationDeadlineDays: formData.paymentType !== 'FREE' && formData.allowRefund
          ? parseInt(formData.cancellationDeadlineDays) || 7
          : undefined,
        managerId: formData.managerId || undefined,
        restrictions: formData.restrictions.enabled ? {
          ...formData.restrictions,
          minAge: formData.restrictions.minAge ? parseInt(formData.restrictions.minAge) : null,
          maxAge: formData.restrictions.maxAge ? parseInt(formData.restrictions.maxAge) : null,
        } : undefined,
      }

      delete payload.pricingEnabled

      const res = await fetch(apiEndpoint, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSuccess(mode === 'create' ? 'Événement créé avec succès' : 'Événement mis à jour avec succès')
        setTimeout(() => {
          router.push(successUrl)
        }, 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <Calendar className="h-7 w-7 text-emerald-600" />
          {title}
        </h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations de base */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informations générales</h2>
                <p className="text-sm text-gray-500">Titre, description et catégorie</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Conférence islamique"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="conference-islamique"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <MapPin className="inline h-4 w-4 mr-1" />
                Lieu
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Salle de prière principale"
              />
            </div>

              <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description courte</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brève description de l'événement"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contenu détaillé</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Description complète, programme, intervenants..."
              />
            </div>
          </div>
        </div>

        {/* Date et horaires */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Date et lieu</h2>
                <p className="text-sm text-gray-500">Quand et où se déroule l&apos;événement</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Heure de début</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Heure de fin</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date limite d&apos;inscription</label>
              <input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Inscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inscriptions</h2>
                <p className="text-sm text-gray-500">Capacité et approbation</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Capacité maximale</label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="Laisser vide pour illimité"
                min="1"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.registrationRequired}
                  onChange={(e) => setFormData({ ...formData, registrationRequired: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Inscription requise</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Approbation requise</span>
              </label>
            </div>
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Paiement</h2>
                <p className="text-sm text-gray-500">Type de paiement et prix de base</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type de paiement</label>
              <div className="grid grid-cols-3 gap-4">
                {paymentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      paymentType: type.value as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION',
                      price: type.value === 'FREE' ? '' : formData.price,
                    })}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      formData.paymentType === type.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.paymentType !== 'FREE' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Prix (CHF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="25.00"
                />
              </div>
            )}

            {formData.paymentType === 'SUBSCRIPTION' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Intervalle de paiement</label>
                <select
                  value={formData.subscriptionInterval}
                  onChange={(e) => setFormData({
                    ...formData,
                    subscriptionInterval: e.target.value as 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                >
                  {subscriptionIntervals.map((interval) => (
                    <option key={interval.value} value={interval.value}>
                      {interval.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tarification avancée */}
        {formData.paymentType !== 'FREE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tarification avancée</h2>
                    <p className="text-sm text-gray-500">Prix différenciés adultes/enfants, réductions groupe, plafond famille</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pricingEnabled}
                    onChange={(e) => setFormData({ ...formData, pricingEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">Activer</span>
                </label>
              </div>
            </div>

            {formData.pricingEnabled ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Prix adulte (CHF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing.adultPrice}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, adultPrice: e.target.value }
                      })}
                      required={formData.pricingEnabled}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Prix enfant (CHF)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing.childPrice}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, childPrice: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Gratuit jusqu&apos;à (ans)</label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={formData.pricing.childFreeUntilAge}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, childFreeUntilAge: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Réduction groupe */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.pricing.groupDiscountEnabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, groupDiscountEnabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Percent className="h-4 w-4 text-green-600" />
                      Réduction groupe
                    </span>
                  </label>

                  {formData.pricing.groupDiscountEnabled && (
                    <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">À partir de (pers.)</label>
                        <input
                          type="number"
                          min="2"
                          value={formData.pricing.groupDiscountFromPersons}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, groupDiscountFromPersons: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Réduction (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.pricing.groupDiscountPercent}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, groupDiscountPercent: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Plafond famille */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-purple-600" />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plafond famille (CHF)</label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricing.familyMaxPrice}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, familyMaxPrice: e.target.value }
                    })}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    placeholder="150"
                  />
                </div>

                {/* Early bird */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.pricing.earlyBirdEnabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, earlyBirdEnabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Réduction Early Bird
                    </span>
                  </label>

                  {formData.pricing.earlyBirdEnabled && (
                    <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Date limite</label>
                        <input
                          type="date"
                          value={formData.pricing.earlyBirdUntilDate}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, earlyBirdUntilDate: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Réduction (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.pricing.earlyBirdDiscountPercent}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, earlyBirdDiscountPercent: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Activez la tarification avancée pour configurer des prix différenciés (adultes/enfants), des réductions groupe, un plafond famille, etc.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Politique de remboursement */}
        {formData.paymentType !== 'FREE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <RefreshCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Politique de remboursement</h2>
                  <p className="text-sm text-gray-500">Conditions d&apos;annulation et remboursement</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowRefund}
                  onChange={(e) => setFormData({ ...formData, allowRefund: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">Autoriser les remboursements</span>
              </label>

              {formData.allowRefund && (
                <div className="ml-8 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Délai de remboursement automatique (jours avant l&apos;événement)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.cancellationDeadlineDays}
                    onChange={(e) => setFormData({ ...formData, cancellationDeadlineDays: e.target.value })}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                    placeholder="7"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Si un participant annule au moins <strong>{formData.cancellationDeadlineDays || 7} jours</strong> avant,
                    il sera automatiquement remboursé.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsable (admin only) */}
        {showManagerField && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <UserCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Responsable</h2>
                  <p className="text-sm text-gray-500">Personne en charge de cet événement</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Assigner un responsable
              </label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement...
                </div>
              ) : (
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Aucun --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email} ({user.role})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Options de publication */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Options de publication</h2>
                <p className="text-sm text-gray-500">Visibilité de l&apos;événement</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">Publier l&apos;événement</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">Événement à la une</span>
            </label>
          </div>
        </div>

        {/* Contact Organisateur */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Organisateur</h2>
                <p className="text-sm text-gray-500">Choisissez quelles informations afficher aux visiteurs</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Les visiteurs pourront voir ces informations sur la page de l&apos;événement et vous contacter directement.
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOrganizerName}
                onChange={(e) => setFormData({ ...formData, showOrganizerName: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Afficher mon nom</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOrganizerEmail}
                onChange={(e) => setFormData({ ...formData, showOrganizerEmail: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-gray-700 dark:text-gray-300">Afficher mon email</span>
                <p className="text-xs text-gray-500">Permet aux visiteurs de vous contacter via un formulaire</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOrganizerPhone}
                onChange={(e) => setFormData({ ...formData, showOrganizerPhone: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Afficher mon téléphone</span>
            </label>
          </div>
        </div>

        {/* Restrictions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Settings className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Restrictions</h2>
                  <p className="text-sm text-gray-500">Critères de participation (genre, âge, type)</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.restrictions.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium">Activer</span>
              </label>
            </div>
          </div>

          {formData.restrictions.enabled ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type de participation</label>
                <select
                  value={formData.restrictions.participationType}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, participationType: e.target.value as 'INDIVIDUAL' | 'FAMILY' | 'MIXED' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="INDIVIDUAL">Individuel</option>
                  <option value="FAMILY">Famille</option>
                  <option value="MIXED">Mixte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Genre autorisé</label>
                <select
                  value={formData.restrictions.allowedGender}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, allowedGender: e.target.value as 'MALE' | 'FEMALE' | 'CHILD' | 'ALL' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ALL">Tous</option>
                  <option value="MALE">Hommes</option>
                  <option value="FEMALE">Femmes</option>
                  <option value="CHILD">Enfants</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Âge minimum</label>
                <input
                  type="number"
                  value={formData.restrictions.minAge}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, minAge: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Aucun"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Âge maximum</label>
                <input
                  type="number"
                  value={formData.restrictions.maxAge}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, maxAge: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Aucun"
                />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activez les restrictions pour limiter qui peut s&apos;inscrire (par genre, âge, ou type de participation).
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href={backUrl}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
