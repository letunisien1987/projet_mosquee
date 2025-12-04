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
  item_type: ItemType
  title: string
  slug: string
  description: string
  content: string
  category: EventCategory
  registration_required: boolean
  max_capacity: number | ''
  requires_approval: boolean
  published: boolean
  featured: boolean
  date: string
  start_time: string
  end_time: string
  location: string
  image: string
  registration_deadline: string
  activity_category: ActivityCategory
  level: string
  age_group: string
  schedule: string
  instructor: string
  enrollment_open: boolean
  price: string
  payment_type: PaymentType
  subscription_interval: SubscriptionInterval
  // Tarification avancée
  pricing_enabled: boolean
  pricing: {
    adult_price: string
    child_price: string
    child_free_until_age: string
    group_discount_enabled: boolean
    group_discount_from_persons: string
    group_discount_percent: string
    family_max_price: string
    early_bird_enabled: boolean
    early_bird_until_date: string
    early_bird_discount_percent: string
  }
  allow_refund: boolean
  cancellation_deadline_days: string
  manager_id: string
  restrictions_enabled: boolean
  participation_type: ParticipationType
  allowed_gender: AllowedGender
  min_age: string
  max_age: string
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
        item_type: offering.item_type || 'EVENT',
        title: offering.title || '',
        slug: offering.slug || '',
        description: offering.description || '',
        content: offering.content || '',
        category: offering.category || 'communaute',
        registration_required: offering.registration_required ?? true,
        max_capacity: offering.max_capacity || '',
        requires_approval: offering.requires_approval ?? false,
        published: offering.published ?? false,
        featured: offering.featured ?? false,
        date: offering.date ? offering.date.split('T')[0] : '',
        start_time: offering.start_time || '',
        end_time: offering.end_time || '',
        location: offering.location || '',
        image: offering.image || '',
        registration_deadline: offering.registration_deadline ? offering.registration_deadline.split('T')[0] : '',
        activity_category: offering.activity_category || 'coran',
        level: offering.level || '',
        age_group: offering.age_group || '',
        schedule: offering.schedule || '',
        instructor: offering.instructor || '',
        enrollment_open: offering.enrollment_open ?? true,
        price: offering.price?.toString() || '',
        payment_type: offering.payment_type || 'FREE',
        subscription_interval: offering.subscription_interval || 'MONTHLY',
        // Tarification avancée
        pricing_enabled: !!pricing.adult_price,
        pricing: {
          adult_price: pricing.adult_price?.toString() || '',
          child_price: pricing.child_price?.toString() || '',
          child_free_until_age: pricing.child_free_until_age?.toString() || '',
          group_discount_enabled: pricing.group_discount?.enabled ?? false,
          group_discount_from_persons: pricing.group_discount?.from_persons?.toString() || '4',
          group_discount_percent: pricing.group_discount?.discount_percent?.toString() || '10',
          family_max_price: pricing.family_max_price?.toString() || '',
          early_bird_enabled: pricing.early_bird?.enabled ?? false,
          early_bird_until_date: pricing.early_bird?.until_date ? pricing.early_bird.until_date.split('T')[0] : '',
          early_bird_discount_percent: pricing.early_bird?.discount_percent?.toString() || '15',
        },
        allow_refund: offering.allow_refund ?? true,
        cancellation_deadline_days: offering.cancellation_deadline_days?.toString() || '7',
        manager_id: offering.manager_id || '',
        restrictions_enabled: offering.restrictions?.enabled ?? false,
        participation_type: offering.restrictions?.participation_type || 'INDIVIDUAL',
        allowed_gender: offering.restrictions?.allowed_gender || 'ALL',
        min_age: offering.restrictions?.min_age?.toString() || '',
        max_age: offering.restrictions?.max_age?.toString() || '',
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
      // Construire l'objet pricing si activé
      const pricingPayload = formData.pricing_enabled && formData.payment_type !== 'FREE' ? {
        adult_price: formData.pricing.adult_price ? parseFloat(formData.pricing.adult_price) : 0,
        child_price: formData.pricing.child_price ? parseFloat(formData.pricing.child_price) : 0,
        child_free_until_age: formData.pricing.child_free_until_age ? parseInt(formData.pricing.child_free_until_age) : 0,
        group_discount: {
          enabled: formData.pricing.group_discount_enabled,
          from_persons: parseInt(formData.pricing.group_discount_from_persons) || 4,
          discount_percent: parseInt(formData.pricing.group_discount_percent) || 10,
        },
        family_max_price: formData.pricing.family_max_price ? parseFloat(formData.pricing.family_max_price) : null,
        early_bird: {
          enabled: formData.pricing.early_bird_enabled,
          until_date: formData.pricing.early_bird_until_date || null,
          discount_percent: parseInt(formData.pricing.early_bird_discount_percent) || 15,
        },
      } : null

      const payload: Record<string, any> = {
        item_type: formData.item_type,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        registration_required: formData.registration_required,
        max_capacity: formData.max_capacity || undefined,
        requires_approval: formData.requires_approval,
        published: formData.published,
        featured: formData.featured,
        price: formData.price ? parseFloat(formData.price) : 0,
        payment_type: formData.payment_type,
        pricing: pricingPayload,
        allow_refund: formData.payment_type !== 'FREE' ? formData.allow_refund : undefined,
        cancellation_deadline_days: formData.payment_type !== 'FREE' && formData.allow_refund
          ? parseInt(formData.cancellation_deadline_days) || 7
          : undefined,
        manager_id: formData.manager_id || undefined,
      }

      if (formData.item_type === 'EVENT') {
        payload.date = formData.date || null
        payload.start_time = formData.start_time || null
        payload.end_time = formData.end_time || null
        payload.location = formData.location || undefined
        payload.image = formData.image || undefined
        payload.registration_deadline = formData.registration_deadline || null
      } else {
        payload.activity_category = formData.activity_category
        payload.level = formData.level || undefined
        payload.age_group = formData.age_group || undefined
        payload.schedule = formData.schedule || undefined
        payload.instructor = formData.instructor || undefined
        payload.enrollment_open = formData.enrollment_open
      }

      if (formData.payment_type === 'SUBSCRIPTION') {
        payload.subscription_interval = formData.subscription_interval
      }

      if (formData.restrictions_enabled) {
        payload.restrictions = {
          enabled: true,
          participation_type: formData.participation_type,
          allowed_gender: formData.allowed_gender,
          min_age: formData.min_age ? parseInt(formData.min_age) : null,
          max_age: formData.max_age ? parseInt(formData.max_age) : null,
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

      router.push(`/admin/gestion/${resolvedParams.id}`)
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
          href="/admin/gestion"
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>
      </div>
    )
  }

  if (!formData) return null

  const isEvent = formData.item_type === 'EVENT'
  const typeLabel = isEvent ? 'événement' : 'activité'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/gestion/${resolvedParams.id}`}
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
                      value={formData.activity_category}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, activity_category: e.target.value as ActivityCategory } : null)}
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
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Heure de fin
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, end_time: e.target.value } : null)}
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
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, registration_deadline: e.target.value } : null)}
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
                        value={formData.age_group}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, age_group: e.target.value } : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enrollment_open}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, enrollment_open: e.target.checked } : null)}
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
                  value={formData.max_capacity}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, max_capacity: e.target.value ? parseInt(e.target.value) : '' } : null)}
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Laisser vide pour illimité"
                  min="1"
                />
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.registration_required}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, registration_required: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Inscription requise</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_approval}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, requires_approval: e.target.checked } : null)}
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
                      onClick={() => setFormData(prev => prev ? { ...prev, payment_type: option.value as PaymentType } : null)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        formData.payment_type === option.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.payment_type !== 'FREE' && (
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

                    {formData.payment_type === 'SUBSCRIPTION' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fréquence
                        </label>
                        <select
                          value={formData.subscription_interval}
                          onChange={(e) => setFormData(prev => prev ? { ...prev, subscription_interval: e.target.value as SubscriptionInterval } : null)}
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
          {formData.payment_type !== 'FREE' && (
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
                      checked={formData.pricing_enabled}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, pricing_enabled: e.target.checked } : null)}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium">Activer</span>
                  </label>
                </div>
              </div>

              {formData.pricing_enabled ? (
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
                        value={formData.pricing.adult_price}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, adult_price: e.target.value }
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
                        value={formData.pricing.child_price}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, child_price: e.target.value }
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
                        value={formData.pricing.child_free_until_age}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, child_free_until_age: e.target.value }
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
                        checked={formData.pricing.group_discount_enabled}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, group_discount_enabled: e.target.checked }
                        } : null)}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Réduction groupe</span>
                      </span>
                    </label>

                    {formData.pricing.group_discount_enabled && (
                      <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            À partir de (personnes)
                          </label>
                          <input
                            type="number"
                            min="2"
                            value={formData.pricing.group_discount_from_persons}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, group_discount_from_persons: e.target.value }
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
                            value={formData.pricing.group_discount_percent}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, group_discount_percent: e.target.value }
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
                      value={formData.pricing.family_max_price}
                      onChange={(e) => setFormData(prev => prev ? {
                        ...prev,
                        pricing: { ...prev.pricing, family_max_price: e.target.value }
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
                        checked={formData.pricing.early_bird_enabled}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          pricing: { ...prev.pricing, early_bird_enabled: e.target.checked }
                        } : null)}
                        className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Réduction Early Bird</span>
                      </span>
                    </label>

                    {formData.pricing.early_bird_enabled && (
                      <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date limite Early Bird
                          </label>
                          <input
                            type="date"
                            value={formData.pricing.early_bird_until_date}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, early_bird_until_date: e.target.value }
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
                            value={formData.pricing.early_bird_discount_percent}
                            onChange={(e) => setFormData(prev => prev ? {
                              ...prev,
                              pricing: { ...prev.pricing, early_bird_discount_percent: e.target.value }
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
                      <p>• Adulte: <strong>{formData.pricing.adult_price || '0'} CHF</strong></p>
                      <p>• Enfant: <strong>{formData.pricing.child_price || '0'} CHF</strong></p>
                      {formData.pricing.child_free_until_age && parseInt(formData.pricing.child_free_until_age) > 0 && (
                        <p>• Enfants ≤{formData.pricing.child_free_until_age} ans: <strong className="text-green-600">Gratuit</strong></p>
                      )}
                      {formData.pricing.group_discount_enabled && (
                        <p>• À partir de {formData.pricing.group_discount_from_persons} pers.: <strong className="text-green-600">-{formData.pricing.group_discount_percent}%</strong></p>
                      )}
                      {formData.pricing.family_max_price && (
                        <p>• Plafond famille: <strong className="text-purple-600">{formData.pricing.family_max_price} CHF max</strong></p>
                      )}
                      {formData.pricing.early_bird_enabled && formData.pricing.early_bird_until_date && (
                        <p>• Early bird jusqu&apos;au {new Date(formData.pricing.early_bird_until_date).toLocaleDateString('fr-FR')}: <strong className="text-orange-600">-{formData.pricing.early_bird_discount_percent}%</strong></p>
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
          {formData.payment_type !== 'FREE' && (
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
                    checked={formData.allow_refund}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, allow_refund: e.target.checked } : null)}
                    className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-medium">Autoriser les remboursements</span>
                </label>

                {formData.allow_refund && (
                  <div className="ml-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Délai de remboursement automatique (jours)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.cancellation_deadline_days}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, cancellation_deadline_days: e.target.value } : null)}
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
                  value={formData.manager_id}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, manager_id: e.target.value } : null)}
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
                    checked={formData.restrictions_enabled}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, restrictions_enabled: e.target.checked } : null)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Activer</span>
                </label>
              </div>
            </div>

            {formData.restrictions_enabled && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type de participation
                    </label>
                    <select
                      value={formData.participation_type}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, participation_type: e.target.value as ParticipationType } : null)}
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
                      value={formData.allowed_gender}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, allowed_gender: e.target.value as AllowedGender } : null)}
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
                      value={formData.min_age}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, min_age: e.target.value } : null)}
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
                      value={formData.max_age}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, max_age: e.target.value } : null)}
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
            href={`/admin/gestion/${resolvedParams.id}`}
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
