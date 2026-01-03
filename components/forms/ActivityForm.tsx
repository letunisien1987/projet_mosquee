'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
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
  Settings,
  Calendar,
  Info,
  Mail,
} from 'lucide-react'
import ScheduleBuilder, { ScheduleRule, scheduleRulesToText } from './ScheduleBuilder'

// Catégorie générale (comme dans /admin/gestion)
const categories = [
  { value: 'religieux', label: 'Religieux' },
  { value: 'communaute', label: 'Communauté' },
  { value: 'education', label: 'Éducation' },
  { value: 'charite', label: 'Charité' },
]

// Type d'activité spécifique (affiché uniquement pour les activités)
const activityTypes = [
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

export interface ActivityData {
  id?: string
  title: string
  slug: string
  category: string
  description?: string
  content?: string
  schedule?: string // texte lisible (généré automatiquement)
  scheduleRules?: ScheduleRule[] // règles de planning structurées
  maxCapacity?: number
  enrollmentOpen: boolean
  requiresApproval: boolean
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

interface ActivityFormProps {
  activity?: ActivityData
  mode: 'create' | 'edit'
  apiEndpoint: string
  backUrl: string
  successUrl: string
  showManagerField?: boolean
  title?: string
}

export default function ActivityForm({
  activity,
  mode,
  apiEndpoint,
  backUrl,
  successUrl,
  showManagerField = false,
  title = mode === 'create' ? 'Nouvelle activité' : "Modifier l'activité",
}: ActivityFormProps) {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(showManagerField)

  const [formData, setFormData] = useState({
    title: activity?.title || '',
    slug: activity?.slug || '',
    category: activity?.category || 'education',
    activityCategory: (activity as any)?.activityCategory || 'coran',
    description: activity?.description || '',
    content: activity?.content || '',
    schedule: activity?.schedule || '',
    scheduleRules: activity?.scheduleRules || [] as ScheduleRule[],
    maxCapacity: activity?.maxCapacity?.toString() || '',
    enrollmentOpen: activity?.enrollmentOpen ?? true,
    requiresApproval: activity?.requiresApproval ?? false,
    published: activity?.published ?? true,
    paymentType: (activity?.paymentType || 'FREE') as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION',
    price: activity?.price?.toString() || '',
    subscriptionInterval: (activity?.subscriptionInterval || 'MONTHLY') as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    pricingEnabled: !!activity?.pricing,
    pricing: {
      adultPrice: activity?.pricing?.adultPrice?.toString() || '',
      childPrice: activity?.pricing?.childPrice?.toString() || '',
      childFreeUntilAge: activity?.pricing?.childFreeUntilAge?.toString() || '',
      groupDiscountEnabled: activity?.pricing?.groupDiscount?.enabled ?? false,
      groupDiscountFromPersons: activity?.pricing?.groupDiscount?.fromPersons?.toString() || '4',
      groupDiscountPercent: activity?.pricing?.groupDiscount?.discountPercent?.toString() || '10',
      familyMaxPrice: activity?.pricing?.familyMaxPrice?.toString() || '',
      earlyBirdEnabled: activity?.pricing?.earlyBird?.enabled ?? false,
      earlyBirdUntilDate: activity?.pricing?.earlyBird?.untilDate || '',
      earlyBirdDiscountPercent: activity?.pricing?.earlyBird?.discountPercent?.toString() || '15',
    },
    allowRefund: activity?.allowRefund ?? true,
    cancellationDeadlineDays: activity?.cancellationDeadlineDays?.toString() || '7',
    managerId: activity?.managerId || '',
    showOrganizerName: activity?.showOrganizerName ?? false,
    showOrganizerEmail: activity?.showOrganizerEmail ?? false,
    showOrganizerPhone: activity?.showOrganizerPhone ?? false,
    restrictions: {
      enabled: activity?.restrictions?.enabled ?? false,
      participationType: (activity?.restrictions?.participationType || 'INDIVIDUAL') as 'INDIVIDUAL' | 'FAMILY' | 'MIXED',
      allowedGender: (activity?.restrictions?.allowedGender || 'ALL') as 'MALE' | 'FEMALE' | 'CHILD' | 'ALL',
      minAge: activity?.restrictions?.minAge?.toString() || '',
      maxAge: activity?.restrictions?.maxAge?.toString() || '',
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
        itemType: 'ACTIVITY', // Toujours ACTIVITY pour ce formulaire
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
        setSuccess(mode === 'create' ? 'Activité créée avec succès' : 'Activité mise à jour avec succès')
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
          <BookOpen className="h-7 w-7 text-blue-600" />
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Informations de base</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Cours de Coran"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="cours-de-coran"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                Type d&apos;activité
              </label>
              <select
                value={formData.activityCategory}
                onChange={(e) => setFormData({ ...formData, activityCategory: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Description courte</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brève description de l'activité"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Contenu détaillé</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Description complète, programme..."
              />
            </div>
          </div>
        </div>

        {/* Planning / Horaires */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planning & Horaires</h2>
                <p className="text-sm text-gray-500">Configurez quand cette activité a lieu</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <ScheduleBuilder
              value={formData.scheduleRules}
              onChange={(rules) => setFormData({
                ...formData,
                scheduleRules: rules,
                schedule: scheduleRulesToText(rules)
              })}
            />

            {/* Affichage du résumé textuel */}
            {formData.schedule && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Résumé :</strong> {formData.schedule}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Inscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="h-5 w-5 text-blue-600" />
            Inscriptions
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enrollmentOpen}
                onChange={(e) => setFormData({ ...formData, enrollmentOpen: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Inscriptions ouvertes</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Capacité max</label>
                <input
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="20"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Validation manuelle des inscriptions requise</span>
            </label>
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Paiement
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type de paiement</label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({
                  ...formData,
                  paymentType: e.target.value as 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION',
                  price: e.target.value === 'FREE' ? '' : formData.price,
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {paymentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="50.00"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="h-5 w-5 text-blue-600" />
                Tarification avancée
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pricingEnabled}
                  onChange={(e) => setFormData({ ...formData, pricingEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Activer</span>
              </label>
            </div>

            {formData.pricingEnabled ? (
              <div className="space-y-6">
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Activez pour configurer prix adultes/enfants, réductions groupe, plafond famille, etc.
              </p>
            )}
          </div>
        )}

        {/* Politique de remboursement */}
        {formData.paymentType !== 'FREE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <RefreshCcw className="h-5 w-5 text-blue-600" />
              Politique de remboursement
            </h2>

            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowRefund}
                  onChange={(e) => setFormData({ ...formData, allowRefund: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Autoriser les remboursements</span>
              </label>

              {formData.allowRefund && (
                <div className="ml-8 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Délai de remboursement (jours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.cancellationDeadlineDays}
                    onChange={(e) => setFormData({ ...formData, cancellationDeadlineDays: e.target.value })}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="7"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsable (admin only) */}
        {showManagerField && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Responsable
            </h2>

            <div>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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

        {/* Options */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Publication</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Publier l&apos;activité</span>
          </label>
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
              Les visiteurs pourront voir ces informations sur la page de l&apos;activité et vous contacter directement.
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="h-5 w-5 text-blue-600" />
            Restrictions
          </h2>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={formData.restrictions.enabled}
              onChange={(e) => setFormData({
                ...formData,
                restrictions: { ...formData.restrictions, enabled: e.target.checked }
              })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Activer les restrictions</span>
          </label>

          {formData.restrictions.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type de participation</label>
                <select
                  value={formData.restrictions.participationType}
                  onChange={(e) => setFormData({
                    ...formData,
                    restrictions: { ...formData.restrictions, participationType: e.target.value as 'INDIVIDUAL' | 'FAMILY' | 'MIXED' }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Aucun"
                />
              </div>
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
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
