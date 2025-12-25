'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  Save,
  CreditCard,
  Users,
  Percent,
  Gift,
  Clock,
} from 'lucide-react'

const categories = [
  { value: 'coran', label: 'Coran' },
  { value: 'arabe', label: 'Arabe' },
  { value: 'ecole', label: 'École' },
  { value: 'tajweed', label: 'Tajweed' },
  { value: 'hifz', label: 'Hifz' },
  { value: 'halaqat', label: 'Halaqat' },
  { value: 'autre', label: 'Autre' },
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

interface PricingConfig {
  adult_price: number
  child_price: number
  child_free_until_age: number
  group_discount: {
    enabled: boolean
    from_persons: number
    discount_percent: number
  }
  family_max_price: number | null
  early_bird: {
    enabled: boolean
    until_date: string | null
    discount_percent: number
  }
}

interface Activity {
  id: string
  title: string
  slug: string
  category: string
  description?: string
  content?: string
  level?: string
  age_group?: string
  schedule?: string
  instructor?: string
  max_participants?: number
  price?: number
  payment_type?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  subscription_interval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  pricing?: PricingConfig | null
  active: boolean
  enrollment_open: boolean
  requires_approval: boolean
  restrictions?: {
    enabled: boolean
    participation_type: 'INDIVIDUAL' | 'FAMILY' | 'MIXED'
    allowed_gender: 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'
    min_age: number | null
    max_age: number | null
  }
}

export default function ModifierActivitePage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const activityId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'coran',
    description: '',
    content: '',
    level: '',
    age_group: '',
    schedule: '',
    instructor: '',
    max_participants: '',
    price: '',
    // Paiement
    payment_type: 'FREE' as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION',
    subscription_interval: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    // Tarification avancée
    pricing_enabled: false,
    pricing: {
      adult_price: '',
      child_price: '',
      child_free_until_age: '',
      group_discount_enabled: false,
      group_discount_from_persons: '4',
      group_discount_percent: '10',
      family_max_price: '',
      early_bird_enabled: false,
      early_bird_until_date: '',
      early_bird_discount_percent: '15',
    },
    active: true,
    enrollment_open: true,
    requires_approval: false,
    restrictions: {
      enabled: false,
      participation_type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'FAMILY' | 'MIXED',
      allowed_gender: 'ALL' as 'MALE' | 'FEMALE' | 'CHILD' | 'ALL',
      min_age: '',
      max_age: '',
    },
  })

  useEffect(() => {
    if (activityId) {
      fetchActivity()
    }
  }, [activityId])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/admin/activites/${activityId}`)
      if (res.ok) {
        const data = await res.json()
        const activity: Activity = data.activity

        setFormData({
          title: activity.title || '',
          slug: activity.slug || '',
          category: activity.category || 'coran',
          description: activity.description || '',
          content: activity.content || '',
          level: activity.level || '',
          age_group: activity.age_group || '',
          schedule: activity.schedule || '',
          instructor: activity.instructor || '',
          max_participants: activity.max_participants?.toString() || '',
          price: activity.price?.toString() || '',
          // Paiement
          payment_type: activity.payment_type || 'FREE',
          subscription_interval: activity.subscription_interval || 'MONTHLY',
          // Tarification avancée
          pricing_enabled: !!activity.pricing,
          pricing: {
            adult_price: activity.pricing?.adult_price?.toString() || '',
            child_price: activity.pricing?.child_price?.toString() || '',
            child_free_until_age: activity.pricing?.child_free_until_age?.toString() || '',
            group_discount_enabled: activity.pricing?.group_discount?.enabled ?? false,
            group_discount_from_persons: activity.pricing?.group_discount?.from_persons?.toString() || '4',
            group_discount_percent: activity.pricing?.group_discount?.discount_percent?.toString() || '10',
            family_max_price: activity.pricing?.family_max_price?.toString() || '',
            early_bird_enabled: activity.pricing?.early_bird?.enabled ?? false,
            early_bird_until_date: activity.pricing?.early_bird?.until_date || '',
            early_bird_discount_percent: activity.pricing?.early_bird?.discount_percent?.toString() || '15',
          },
          active: activity.active ?? true,
          enrollment_open: activity.enrollment_open ?? true,
          requires_approval: activity.requires_approval ?? false,
          restrictions: {
            enabled: activity.restrictions?.enabled ?? false,
            participation_type: activity.restrictions?.participation_type || 'INDIVIDUAL',
            allowed_gender: activity.restrictions?.allowed_gender || 'ALL',
            min_age: activity.restrictions?.min_age?.toString() || '',
            max_age: activity.restrictions?.max_age?.toString() || '',
          },
        })
      } else {
        setError('Activité non trouvée')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

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

      const payload = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        subscription_interval: formData.payment_type === 'SUBSCRIPTION' ? formData.subscription_interval : undefined,
        pricing: pricingPayload,
        restrictions: formData.restrictions.enabled ? {
          ...formData.restrictions,
          min_age: formData.restrictions.min_age ? parseInt(formData.restrictions.min_age) : null,
          max_age: formData.restrictions.max_age ? parseInt(formData.restrictions.max_age) : null,
        } : undefined,
      }

      // Nettoyer les champs du formulaire qui ne doivent pas être envoyés
      delete (payload as any).pricing_enabled

      const res = await fetch(`/api/admin/activites/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/dashboard/admin/activites')
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !formData.title) {
    return (
      <div className="p-8">
        <Link
          href="/dashboard/admin/activites"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux activités
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/admin/activites"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux activités
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          Modifier l&apos;Activité
        </h1>
        <p className="text-gray-500 mt-1">
          Modifiez les informations de l&apos;activité
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations de base */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Informations de base</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Cours de Coran pour enfants"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="cours-coran-enfants"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Enseignant</label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Nom de l'enseignant"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Description courte</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Brève description de l'activité"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Contenu détaillé</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Description complète, programme, objectifs..."
            />
          </div>
        </div>

        {/* Horaires et capacité */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Horaires et capacité</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Horaire</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Samedi 10h-12h"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Niveau</label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Débutant, Intermédiaire, Avancé"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Groupe d&apos;âge</label>
              <input
                type="text"
                value={formData.age_group}
                onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="6-12 ans"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Capacité max</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="20"
              />
            </div>
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Paiement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Type de paiement</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({
                  ...formData,
                  payment_type: e.target.value as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION',
                  price: e.target.value === 'FREE' ? '' : formData.price,
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                {paymentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.payment_type !== 'FREE' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prix (CHF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="25.00"
                />
              </div>
            )}

            {formData.payment_type === 'SUBSCRIPTION' && (
              <div>
                <label className="block text-sm font-medium mb-2">Intervalle de paiement</label>
                <select
                  value={formData.subscription_interval}
                  onChange={(e) => setFormData({
                    ...formData,
                    subscription_interval: e.target.value as 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
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
        {formData.payment_type !== 'FREE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Tarification avancée
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pricing_enabled}
                  onChange={(e) => setFormData({ ...formData, pricing_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Activer</span>
              </label>
            </div>

            {formData.pricing_enabled ? (
              <div className="space-y-6">
                {/* Prix par personne */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prix adulte (CHF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing.adult_price}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, adult_price: e.target.value }
                      })}
                      required={formData.pricing_enabled}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Prix enfant (CHF)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricing.child_price}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, child_price: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enfants gratuits jusqu&apos;à (ans)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={formData.pricing.child_free_until_age}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, child_free_until_age: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="5"
                    />
                    <p className="mt-1 text-xs text-gray-500">0 = pas de gratuité</p>
                  </div>
                </div>

                {/* Réduction groupe */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.pricing.group_discount_enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, group_discount_enabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-green-600" />
                      Réduction groupe
                    </span>
                  </label>

                  {formData.pricing.group_discount_enabled && (
                    <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          À partir de (personnes)
                        </label>
                        <input
                          type="number"
                          min="2"
                          value={formData.pricing.group_discount_from_persons}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, group_discount_from_persons: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="4"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Réduction (%)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.pricing.group_discount_percent}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, group_discount_percent: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Plafond famille */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-purple-600" />
                    <label className="block text-sm font-medium">
                      Plafond famille (CHF)
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricing.family_max_price}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, family_max_price: e.target.value }
                    })}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="150"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Prix maximum pour une famille. Laisser vide pour désactiver.
                  </p>
                </div>

                {/* Early bird */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.pricing.early_bird_enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, early_bird_enabled: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Réduction Early Bird
                    </span>
                  </label>

                  {formData.pricing.early_bird_enabled && (
                    <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Date limite Early Bird
                        </label>
                        <input
                          type="date"
                          value={formData.pricing.early_bird_until_date}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, early_bird_until_date: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Réduction (%)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.pricing.early_bird_discount_percent}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, early_bird_discount_percent: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="15"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Aperçu */}
                <div className="border-t pt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-4">
                  <h3 className="text-sm font-medium mb-2">Aperçu des tarifs</h3>
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
              <p className="text-sm text-gray-500">
                Activez la tarification avancée pour configurer des prix différenciés.
              </p>
            )}
          </div>
        )}

        {/* Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Options</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Activité active</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enrollment_open}
                onChange={(e) => setFormData({ ...formData, enrollment_open: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Inscriptions ouvertes</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_approval}
                onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Validation manuelle des inscriptions requise</span>
            </label>
          </div>
        </div>

        {/* Restrictions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Restrictions</h2>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={formData.restrictions.enabled}
              onChange={(e) => setFormData({
                ...formData,
                restrictions: { ...formData.restrictions, enabled: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Activer les restrictions</span>
          </label>

          {formData.restrictions.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-2">Type de participation</label>
                <select
                  value={formData.restrictions.participation_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, participation_type: e.target.value as 'INDIVIDUAL' | 'FAMILY' | 'MIXED' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="INDIVIDUAL">Individuel</option>
                  <option value="FAMILY">Famille</option>
                  <option value="MIXED">Mixte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Genre autorisé</label>
                <select
                  value={formData.restrictions.allowed_gender}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, allowed_gender: e.target.value as 'MALE' | 'FEMALE' | 'CHILD' | 'ALL' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="ALL">Tous</option>
                  <option value="MALE">Hommes</option>
                  <option value="FEMALE">Femmes</option>
                  <option value="CHILD">Enfants</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Âge minimum</label>
                <input
                  type="number"
                  value={formData.restrictions.min_age}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, min_age: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Aucun"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Âge maximum</label>
                <input
                  type="number"
                  value={formData.restrictions.max_age}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, max_age: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Aucun"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/admin/activites"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </Link>
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
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
