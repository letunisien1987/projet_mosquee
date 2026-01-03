'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Save,
  Loader2,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Settings,
  Info,
  CreditCard,
  UserCheck,
  Percent,
  Gift,
  RefreshCcw,
  Mail,
} from 'lucide-react'

type ItemType = 'EVENT' | 'ACTIVITY'
type EventCategory = 'religieux' | 'communaute' | 'education' | 'charite'
type ActivityCategory = 'coran' | 'arabe' | 'ecole' | 'tajweed' | 'hifz' | 'halaqat' | 'autre'
type PaymentType = 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
type SubscriptionInterval = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
type ParticipationType = 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
type AllowedGender = 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
}

interface FormData {
  itemType: ItemType
  title: string
  slug: string
  description: string
  content: string
  category: EventCategory
  registrationRequired: boolean
  maxCapacity: number | ''
  requiresApproval: boolean
  published: boolean
  featured: boolean
  date: string
  startTime: string
  endTime: string
  location: string
  image: string
  registrationDeadline: string
  activityCategory: ActivityCategory
  level: string
  ageGroup: string
  schedule: string
  instructor: string
  enrollmentOpen: boolean
  price: string
  paymentType: PaymentType
  subscriptionInterval: SubscriptionInterval
  // Tarification avancée
  pricingEnabled: boolean
  pricing: {
    adultPrice: string
    childPrice: string
    childFreeUntilAge: string
    groupDiscountEnabled: boolean
    groupDiscountFromPersons: string
    groupDiscountPercent: string
    familyMaxPrice: string
    earlyBirdEnabled: boolean
    earlyBirdUntilDate: string
    earlyBirdDiscountPercent: string
  }
  allowRefund: boolean
  cancellationDeadlineDays: string
  managerId: string
  // Contact organisateur
  showOrganizerName: boolean
  showOrganizerEmail: boolean
  showOrganizerPhone: boolean
  restrictionsEnabled: boolean
  participationType: ParticipationType
  allowedGender: AllowedGender
  minAge: string
  maxAge: string
}

const eventCategories: { value: EventCategory; label: string }[] = [
  { value: 'religieux', label: 'Religieux' },
  { value: 'communaute', label: 'Communauté' },
  { value: 'education', label: 'Éducation' },
  { value: 'charite', label: 'Charité' },
]

const activityCategories: { value: ActivityCategory; label: string }[] = [
  { value: 'coran', label: 'Coran' },
  { value: 'arabe', label: 'Arabe' },
  { value: 'ecole', label: 'École' },
  { value: 'tajweed', label: 'Tajweed' },
  { value: 'hifz', label: 'Hifz' },
  { value: 'halaqat', label: 'Halaqat' },
  { value: 'autre', label: 'Autre' },
]

export default function ModifierOffrePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Charger la liste des utilisateurs pour le responsable
  useEffect(() => {
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
  }, [])

  useEffect(() => {
    fetchOffering()
  }, [resolvedParams.id])

  const fetchOffering = async () => {
    try {
      const response = await fetch(`/api/admin/offerings/${resolvedParams.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      const offering = data.offering
      const pricing = offering.pricing || {}

      const formValues: FormData = {
        // L'API retourne en camelCase
        itemType: offering.itemType || 'EVENT',
        title: offering.title || '',
        slug: offering.slug || '',
        description: offering.description || '',
        content: offering.content || '',
        category: offering.category || 'communaute',
        registrationRequired: offering.registrationRequired ?? true,
        maxCapacity: offering.maxCapacity || '',
        requiresApproval: offering.requiresApproval ?? false,
        published: offering.published ?? false,
        featured: offering.featured ?? false,
        date: offering.date ? offering.date.split('T')[0] : '',
        startTime: offering.startTime || '',
        endTime: offering.endTime || '',
        location: offering.location || '',
        image: offering.image || '',
        registrationDeadline: offering.registrationDeadline ? offering.registrationDeadline.split('T')[0] : '',
        activityCategory: offering.activityCategory || 'coran',
        level: offering.level || '',
        ageGroup: offering.ageGroup || '',
        schedule: offering.schedule || '',
        instructor: offering.instructor || '',
        enrollmentOpen: offering.enrollmentOpen ?? true,
        price: offering.price?.toString() || '',
        paymentType: offering.paymentType || 'FREE',
        subscriptionInterval: offering.subscriptionInterval || 'MONTHLY',
        // Tarification avancée (pricing JSON peut être en snake_case ou camelCase)
        pricingEnabled: !!(pricing.adultPrice || pricing.adult_price),
        pricing: {
          adultPrice: (pricing.adultPrice ?? pricing.adult_price)?.toString() || '',
          childPrice: (pricing.childPrice ?? pricing.child_price)?.toString() || '',
          childFreeUntilAge: (pricing.childFreeUntilAge ?? pricing.child_free_until_age)?.toString() || '',
          groupDiscountEnabled: pricing.groupDiscount?.enabled ?? pricing.group_discount?.enabled ?? false,
          groupDiscountFromPersons: (pricing.groupDiscount?.fromPersons ?? pricing.group_discount?.from_persons)?.toString() || '4',
          groupDiscountPercent: (pricing.groupDiscount?.discountPercent ?? pricing.group_discount?.discount_percent)?.toString() || '10',
          familyMaxPrice: (pricing.familyMaxPrice ?? pricing.family_max_price)?.toString() || '',
          earlyBirdEnabled: pricing.earlyBird?.enabled ?? pricing.early_bird?.enabled ?? false,
          earlyBirdUntilDate: (pricing.earlyBird?.untilDate ?? pricing.early_bird?.until_date) ? (pricing.earlyBird?.untilDate ?? pricing.early_bird?.until_date).split('T')[0] : '',
          earlyBirdDiscountPercent: (pricing.earlyBird?.discountPercent ?? pricing.early_bird?.discount_percent)?.toString() || '15',
        },
        allowRefund: offering.allowRefund ?? true,
        cancellationDeadlineDays: offering.cancellationDeadlineDays?.toString() || '7',
        managerId: offering.managerId || '',
        // Contact organisateur
        showOrganizerName: offering.showOrganizerName ?? false,
        showOrganizerEmail: offering.showOrganizerEmail ?? false,
        showOrganizerPhone: offering.showOrganizerPhone ?? false,
        restrictionsEnabled: offering.restrictions?.enabled ?? false,
        participationType: offering.restrictions?.participationType || offering.restrictions?.participation_type || 'INDIVIDUAL',
        allowedGender: offering.restrictions?.allowedGender || offering.restrictions?.allowed_gender || 'ALL',
        minAge: (offering.restrictions?.minAge ?? offering.restrictions?.min_age)?.toString() || '',
        maxAge: (offering.restrictions?.maxAge ?? offering.restrictions?.max_age)?.toString() || '',
      }

      setFormData(formValues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSaving(true)
    setError(null)

    try {
      // Construire l'objet pricing si activé (envoyé en camelCase à l'API)
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
        itemType: formData.itemType,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        registrationRequired: formData.registrationRequired,
        maxCapacity: formData.maxCapacity || undefined,
        requiresApproval: formData.requiresApproval,
        published: formData.published,
        featured: formData.featured,
        price: formData.price ? parseFloat(formData.price) : 0,
        paymentType: formData.paymentType,
        pricing: pricingPayload,
        allowRefund: formData.paymentType !== 'FREE' ? formData.allowRefund : undefined,
        cancellationDeadlineDays: formData.paymentType !== 'FREE' && formData.allowRefund
          ? parseInt(formData.cancellationDeadlineDays) || 7
          : undefined,
        managerId: formData.managerId || undefined,
        // Contact organisateur
        showOrganizerName: formData.showOrganizerName,
        showOrganizerEmail: formData.showOrganizerEmail,
        showOrganizerPhone: formData.showOrganizerPhone,
      }

      if (formData.itemType === 'EVENT') {
        payload.date = formData.date || null
        payload.startTime = formData.startTime || null
        payload.endTime = formData.endTime || null
        payload.location = formData.location || undefined
        payload.image = formData.image || undefined
        payload.registrationDeadline = formData.registrationDeadline || null
      } else {
        payload.activityCategory = formData.activityCategory
        payload.level = formData.level || undefined
        payload.ageGroup = formData.ageGroup || undefined
        payload.schedule = formData.schedule || undefined
        payload.instructor = formData.instructor || undefined
        payload.enrollmentOpen = formData.enrollmentOpen
      }

      if (formData.paymentType === 'SUBSCRIPTION') {
        payload.subscriptionInterval = formData.subscriptionInterval
      }

      if (formData.restrictionsEnabled) {
        payload.restrictions = {
          enabled: true,
          participationType: formData.participationType,
          allowedGender: formData.allowedGender,
          minAge: formData.minAge ? parseInt(formData.minAge) : null,
          maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
        }
      } else {
        payload.restrictions = null
      }

      const response = await fetch(`/api/admin/offerings/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      router.push(`/dashboard/admin/gestion/${resolvedParams.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <Link
          href="/dashboard/admin/gestion"
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </div>
    )
  }

  if (!formData) return null

  const isEvent = formData.itemType === 'EVENT'
  const typeLabel = isEvent ? 'événement' : 'activité'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/admin/gestion/${resolvedParams.id}`}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Modifier l&apos;offre
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formData.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Section: Type (lecture seule) */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Type d&apos;offre</h2>
                  <p className="text-sm text-gray-500">Le type ne peut pas être modifié</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 inline-flex items-center gap-3 ${
                isEvent ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              }`}>
                {isEvent ? (
                  <Calendar className="h-6 w-6 text-indigo-600" />
                ) : (
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                )}
                <span className={`font-semibold ${isEvent ? 'text-indigo-700' : 'text-emerald-700'}`}>
                  {isEvent ? 'Événement' : 'Activité'}
                </span>
              </div>
            </div>
          </section>

          {/* Section: Informations générales */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, slug: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, category: e.target.value as EventCategory } : null)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    {eventCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {!isEvent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type d&apos;activité
                    </label>
                    <select
                      value={formData.activityCategory}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, activityCategory: e.target.value as ActivityCategory } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      {activityCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description courte
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contenu détaillé
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, published: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Publié</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, featured: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mis en avant</span>
                </label>
              </div>
            </div>
          </section>

          {/* Section: Date et lieu (Événements) / Horaires (Activités) */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEvent ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                  {isEvent ? (
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEvent ? 'Date et lieu' : 'Horaires et détails'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isEvent ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, date: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Heure de début
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Heure de fin
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Lieu
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date limite d&apos;inscription
                    </label>
                    <input
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, registrationDeadline: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Horaire récurrent
                      </label>
                      <input
                        type="text"
                        value={formData.schedule}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, schedule: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Ex: Samedi 10h-12h"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instructeur / Enseignant
                      </label>
                      <input
                        type="text"
                        value={formData.instructor}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, instructor: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Niveau
                      </label>
                      <input
                        type="text"
                        value={formData.level}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, level: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Groupe d&apos;âge
                      </label>
                      <input
                        type="text"
                        value={formData.ageGroup}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, ageGroup: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enrollmentOpen}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, enrollmentOpen: e.target.checked } : null)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Inscriptions ouvertes</span>
                  </label>
                </>
              )}
            </div>
          </section>

          {/* Section: Inscriptions */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inscriptions</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacité maximale
                </label>
                <input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, maxCapacity: e.target.value ? parseInt(e.target.value) : '' } : null)}
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Laisser vide pour illimité"
                  min="1"
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.registrationRequired}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, registrationRequired: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Inscription requise</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, requiresApproval: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Approbation requise</span>
                </label>
              </div>
            </div>
          </section>

          {/* Section: Paiement de base */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Paiement</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de paiement
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'FREE', label: 'Gratuit' },
                    { value: 'ONE_TIME', label: 'Paiement unique' },
                    { value: 'SUBSCRIPTION', label: 'Abonnement' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => prev ? { ...prev, paymentType: option.value as PaymentType } : null)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        formData.paymentType === option.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.paymentType !== 'FREE' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix de base (CHF)
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, price: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {formData.paymentType === 'SUBSCRIPTION' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fréquence
                        </label>
                        <select
                          value={formData.subscriptionInterval}
                          onChange={(e) => setFormData(prev => prev ? { ...prev, subscriptionInterval: e.target.value as SubscriptionInterval } : null)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="WEEKLY">Hebdomadaire</option>
                          <option value="MONTHLY">Mensuel</option>
                          <option value="YEARLY">Annuel</option>
                        </select>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Section: Tarification avancée (uniquement si payant) */}
          {formData.paymentType !== 'FREE' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                      onChange={(e) => setFormData(prev => prev ? { ...prev, pricingEnabled: e.target.checked } : null)}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">Activer</span>
                  </label>
                </div>
              </div>

              {formData.pricingEnabled ? (
                <div className="p-6 space-y-6">
                  {/* Prix par personne */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix adulte (CHF) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.adultPrice}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, adultPrice: e.target.value }
                        } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prix enfant (CHF)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.childPrice}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, childPrice: e.target.value }
                        } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="25"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enfants gratuits jusqu&apos;à (ans)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="18"
                        value={formData.pricing.childFreeUntilAge}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, childFreeUntilAge: e.target.value }
                        } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        placeholder="5"
                      />
                    </div>
                  </div>

                  {/* Réduction groupe */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={formData.pricing.groupDiscountEnabled}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, groupDiscountEnabled: e.target.checked }
                        } : null)}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Réduction groupe</span>
                      </span>
                    </label>

                    {formData.pricing.groupDiscountEnabled && (
                      <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            À partir de (personnes)
                          </label>
                          <input
                            type="number"
                            min="2"
                            value={formData.pricing.groupDiscountFromPersons}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, groupDiscountFromPersons: e.target.value }
                            } : null)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Réduction (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.pricing.groupDiscountPercent}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, groupDiscountPercent: e.target.value }
                            } : null)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plafond famille */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Plafond famille (CHF)
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing.familyMaxPrice}
                      onChange={(e) => setFormData(prev => prev ? {
                        ...prev,
                        pricing: { ...prev.pricing, familyMaxPrice: e.target.value }
                      } : null)}
                      className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="150"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Prix maximum pour une famille. Laisser vide pour désactiver.
                    </p>
                  </div>

                  {/* Early bird */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={formData.pricing.earlyBirdEnabled}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, earlyBirdEnabled: e.target.checked }
                        } : null)}
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Réduction Early Bird</span>
                      </span>
                    </label>

                    {formData.pricing.earlyBirdEnabled && (
                      <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date limite Early Bird
                          </label>
                          <input
                            type="date"
                            value={formData.pricing.earlyBirdUntilDate}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, earlyBirdUntilDate: e.target.value }
                            } : null)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Réduction (%)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.pricing.earlyBirdDiscountPercent}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, earlyBirdDiscountPercent: e.target.value }
                            } : null)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Aperçu des tarifs */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-4">
                    <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Aperçu des tarifs</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>• Adulte: <strong>{formData.pricing.adultPrice || '0'} CHF</strong></p>
                      <p>• Enfant: <strong>{formData.pricing.childPrice || '0'} CHF</strong></p>
                      {formData.pricing.childFreeUntilAge && parseInt(formData.pricing.childFreeUntilAge) > 0 && (
                        <p>• Enfants ≤{formData.pricing.childFreeUntilAge} ans: <strong className="text-green-600">Gratuit</strong></p>
                      )}
                      {formData.pricing.groupDiscountEnabled && (
                        <p>• À partir de {formData.pricing.groupDiscountFromPersons} pers.: <strong className="text-green-600">-{formData.pricing.groupDiscountPercent}%</strong></p>
                      )}
                      {formData.pricing.familyMaxPrice && (
                        <p>• Plafond famille: <strong className="text-purple-600">{formData.pricing.familyMaxPrice} CHF max</strong></p>
                      )}
                      {formData.pricing.earlyBirdEnabled && formData.pricing.earlyBirdUntilDate && (
                        <p>• Early bird jusqu&apos;au {new Date(formData.pricing.earlyBirdUntilDate).toLocaleDateString('fr-FR')}: <strong className="text-orange-600">-{formData.pricing.earlyBirdDiscountPercent}%</strong></p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    Activez la tarification avancée pour configurer des prix différenciés.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Section: Politique de remboursement (uniquement si payant) */}
          {formData.paymentType !== 'FREE' && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <RefreshCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Politique de remboursement</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowRefund}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, allowRefund: e.target.checked } : null)}
                    className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium">Autoriser les remboursements</span>
                </label>

                {formData.allowRefund && (
                  <div className="ml-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Délai de remboursement automatique (jours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.cancellationDeadlineDays}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, cancellationDeadlineDays: e.target.value } : null)}
                      className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section: Responsable */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <UserCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Responsable</h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement...
                </div>
              ) : (
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, managerId: e.target.value } : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Moi-même (par défaut) --</option>
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
          </section>

          {/* Section: Contact Organisateur */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                Les visiteurs pourront voir ces informations sur la page de l&apos;offre et vous contacter directement.
              </p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showOrganizerName}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, showOrganizerName: e.target.checked } : null)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Afficher mon nom</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showOrganizerEmail}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, showOrganizerEmail: e.target.checked } : null)}
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
                  onChange={(e) => setFormData(prev => prev ? { ...prev, showOrganizerPhone: e.target.checked } : null)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Afficher mon téléphone</span>
              </label>
            </div>
          </section>

          {/* Section: Restrictions */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Settings className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Restrictions</h2>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.restrictionsEnabled}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, restrictionsEnabled: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activer</span>
                </label>
              </div>
            </div>

            {formData.restrictionsEnabled && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de participation
                    </label>
                    <select
                      value={formData.participationType}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, participationType: e.target.value as ParticipationType } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="INDIVIDUAL">Individuel</option>
                      <option value="FAMILY">Famille</option>
                      <option value="MIXED">Mixte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Genre autorisé
                    </label>
                    <select
                      value={formData.allowedGender}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, allowedGender: e.target.value as AllowedGender } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="ALL">Tous</option>
                      <option value="MALE">Hommes</option>
                      <option value="FEMALE">Femmes</option>
                      <option value="CHILD">Enfants</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Âge minimum
                    </label>
                    <input
                      type="number"
                      value={formData.minAge}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, minAge: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Pas de minimum"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Âge maximum
                    </label>
                    <input
                      type="number"
                      value={formData.maxAge}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, maxAge: e.target.value } : null)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Pas de maximum"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <Link
            href={`/dashboard/admin/gestion/${resolvedParams.id}`}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.title || !formData.slug}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
