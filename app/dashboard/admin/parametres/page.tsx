'use client'

import { useEffect, useState } from 'react'
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  Wallet,
  Share2,
  Clock,
  History,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MosqueSettings {
  id: string
  name: string
  description?: string
  address_street?: string
  address_city?: string
  address_postal_code?: string
  address_country?: string
  contact_email?: string
  contact_phone?: string
  contact_phone2?: string
  donation_email?: string
  bank_iban?: string
  bank_bic?: string
  bank_account_holder?: string
  bank_name?: string
  twint?: string
  social_facebook?: string
  social_instagram?: string
  social_youtube?: string
  social_twitter?: string
  opening_hours?: string
  capacity?: number
  membership_monthly_price?: number
  membership_annual_price?: number
  membership_full_price?: number
}

interface HistoryEntry {
  id: string
  settingKey: string
  settingLabel: string
  oldValue: string | null
  newValue: string | null
  changedBy: string
  changedAt: string
}

type TabType = 'general' | 'address' | 'contact' | 'bank' | 'pricing' | 'social' | 'advanced' | 'history'

export default function ParametresPage() {
  const [settings, setSettings] = useState<MosqueSettings | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('general')

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/parametres')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paramètres')
      }
      const data = await response.json()
      setSettings(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/admin/parametres/history?limit=50')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSuccess(`Paramètres enregistrés avec succès (${data.changesCount} modification(s))`)

      // Rafraîchir l'historique si on est sur cet onglet
      if (activeTab === 'history') {
        fetchHistory()
      }

      // Effacer le message après 5 secondes
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof MosqueSettings, value: any) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'Général', icon: <Building2 className="h-4 w-4" /> },
    { id: 'address', label: 'Adresse', icon: <MapPin className="h-4 w-4" /> },
    { id: 'contact', label: 'Contact', icon: <Phone className="h-4 w-4" /> },
    { id: 'bank', label: 'Banque', icon: <Wallet className="h-4 w-4" /> },
    { id: 'pricing', label: 'Tarifs', icon: <Settings className="h-4 w-4" /> },
    { id: 'social', label: 'Réseaux', icon: <Share2 className="h-4 w-4" /> },
    { id: 'advanced', label: 'Avancé', icon: <Clock className="h-4 w-4" /> },
    { id: 'history', label: 'Historique', icon: <History className="h-4 w-4" /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700">
          Impossible de charger les paramètres. Vérifiez que Directus est démarré et que la collection
          mosque_settings existe.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configuration générale de la mosquée
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
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
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Tab: Général */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informations générales
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom de la mosquée *</label>
                    <input
                      type="text"
                      value={settings.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={settings.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Adresse */}
            {activeTab === 'address' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Adresse
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Rue</label>
                    <input
                      type="text"
                      value={settings.address_street || ''}
                      onChange={(e) => updateField('address_street', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Code postal</label>
                    <input
                      type="text"
                      value={settings.address_postal_code || ''}
                      onChange={(e) => updateField('address_postal_code', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Ville</label>
                    <input
                      type="text"
                      value={settings.address_city || ''}
                      onChange={(e) => updateField('address_city', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Pays</label>
                    <input
                      type="text"
                      value={settings.address_country || ''}
                      onChange={(e) => updateField('address_country', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Contact */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Coordonnées de contact
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email principal</label>
                    <input
                      type="email"
                      value={settings.contact_email || ''}
                      onChange={(e) => updateField('contact_email', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email dons</label>
                    <input
                      type="email"
                      value={settings.donation_email || ''}
                      onChange={(e) => updateField('donation_email', e.target.value)}
                      placeholder="dons@..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone principal</label>
                    <input
                      type="tel"
                      value={settings.contact_phone || ''}
                      onChange={(e) => updateField('contact_phone', e.target.value)}
                      placeholder="+41 32 ..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone secondaire</label>
                    <input
                      type="tel"
                      value={settings.contact_phone2 || ''}
                      onChange={(e) => updateField('contact_phone2', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Numéro TWINT</label>
                    <input
                      type="tel"
                      value={settings.twint || ''}
                      onChange={(e) => updateField('twint', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Banque */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Coordonnées bancaires
                </h2>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Ces informations seront affichées sur la page des dons et dans les reçus fiscaux.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">IBAN *</label>
                    <input
                      type="text"
                      value={settings.bank_iban || ''}
                      onChange={(e) => updateField('bank_iban', e.target.value)}
                      placeholder="CH00 0000 0000 0000 0000 0"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">BIC/SWIFT</label>
                    <input
                      type="text"
                      value={settings.bank_bic || ''}
                      onChange={(e) => updateField('bank_bic', e.target.value)}
                      placeholder="POFICHBEXXX"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Nom de la banque</label>
                    <input
                      type="text"
                      value={settings.bank_name || ''}
                      onChange={(e) => updateField('bank_name', e.target.value)}
                      placeholder="PostFinance SA"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Titulaire du compte</label>
                    <input
                      type="text"
                      value={settings.bank_account_holder || ''}
                      onChange={(e) => updateField('bank_account_holder', e.target.value)}
                      placeholder="Association Mosquée Madretsch"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Tarification */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Tarification des adhésions
                </h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Ces montants sont utilisés pour le calcul des cotisations et les paiements Stripe.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cotisation mensuelle (CHF)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={settings.membership_monthly_price || 20}
                      onChange={(e) => updateField('membership_monthly_price', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cotisation annuelle (CHF)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={settings.membership_annual_price || 200}
                      onChange={(e) => updateField('membership_annual_price', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Montant adhésion (CHF)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={settings.membership_full_price || 120}
                      onChange={(e) => updateField('membership_full_price', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Montant utilisé pour le paiement de l'adhésion
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Réseaux sociaux */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Réseaux sociaux
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Facebook</label>
                    <input
                      type="url"
                      value={settings.social_facebook || ''}
                      onChange={(e) => updateField('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Instagram</label>
                    <input
                      type="url"
                      value={settings.social_instagram || ''}
                      onChange={(e) => updateField('social_instagram', e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">YouTube</label>
                    <input
                      type="url"
                      value={settings.social_youtube || ''}
                      onChange={(e) => updateField('social_youtube', e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter/X</label>
                    <input
                      type="url"
                      value={settings.social_twitter || ''}
                      onChange={(e) => updateField('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Avancé */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Paramètres avancés
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Capacité (personnes)</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.capacity || 0}
                      onChange={(e) => updateField('capacity', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Horaires d'ouverture</label>
                    <textarea
                      value={settings.opening_hours || ''}
                      onChange={(e) => updateField('opening_hours', e.target.value)}
                      rows={4}
                      placeholder="Lundi - Vendredi: 09:00 - 20:00&#10;Samedi - Dimanche: 10:00 - 18:00"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Historique */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Historique des modifications
                </h2>

                {history.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune modification enregistrée</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Paramètre
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ancienne valeur
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nouvelle valeur
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Modifié par
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {history.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                              {format(new Date(entry.changedAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {entry.settingLabel}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                              {entry.oldValue || <span className="italic">vide</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {entry.newValue || <span className="italic">vide</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {entry.changedBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {activeTab !== 'history' && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
