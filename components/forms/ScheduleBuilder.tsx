'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Calendar, Plus, X, Sun, Moon, Clock, Loader2 } from 'lucide-react'

// Types pour le planning
export interface ScheduleRule {
  id: string
  dayPattern: DayPattern
  timePattern: TimePattern
}

export interface DayPattern {
  type: 'specific_days' | 'weekly' | 'monthly_position' | 'daily'
  days?: string[] // ['lundi', 'mercredi']
  weeklyDays?: string[] // pour récurrence hebdomadaire
  monthlyPosition?: 'first' | 'second' | 'third' | 'fourth' | 'last'
  monthlyDay?: string // 'samedi'
}

export interface TimePattern {
  type: 'fixed' | 'after_prayer' | 'before_prayer' | 'between_prayers'
  fixedTime?: string // '10:00'
  prayer?: string // 'maghreb', 'isha', etc.
  prayerEnd?: string // pour 'between_prayers'
  offset?: number // minutes (positif = après, négatif = avant)
  offsetStart?: number // décalage après la première prière (pour between_prayers)
  offsetEnd?: number // décalage avant la deuxième prière (pour between_prayers)
  duration?: number // durée en minutes
}

// Type pour les horaires de prière
interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

const DAYS_OF_WEEK = [
  { value: 'lundi', label: 'Lundi' },
  { value: 'mardi', label: 'Mardi' },
  { value: 'mercredi', label: 'Mercredi' },
  { value: 'jeudi', label: 'Jeudi' },
  { value: 'vendredi', label: 'Vendredi' },
  { value: 'samedi', label: 'Samedi' },
  { value: 'dimanche', label: 'Dimanche' },
]

const MONTHLY_POSITIONS = [
  { value: 'first', label: 'Premier' },
  { value: 'second', label: 'Deuxième' },
  { value: 'third', label: 'Troisième' },
  { value: 'fourth', label: 'Quatrième' },
  { value: 'last', label: 'Dernier' },
]

// Mapping entre nos valeurs et les clés de l'API
const PRAYER_API_KEYS: Record<string, keyof PrayerTimes> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghreb: 'Maghrib',
  isha: 'Isha',
}

// Liste statique des prières (pour les fonctions utilitaires)
const PRAYERS_STATIC = [
  { value: 'fajr', label: 'Fajr' },
  { value: 'dhuhr', label: 'Dhuhr' },
  { value: 'asr', label: 'Asr' },
  { value: 'maghreb', label: 'Maghreb' },
  { value: 'isha', label: 'Isha' },
]

// Fonction pour ajouter des minutes à une heure
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, mins + minutes, 0, 0)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Fonction pour calculer la durée entre deux heures (en minutes)
function getDurationBetweenTimes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return (endH * 60 + endM) - (startH * 60 + startM)
}

// Formater une durée en minutes vers "Xh Ymin"
function formatDuration(minutes: number): string {
  if (minutes < 0) return '0min'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`
}

interface ScheduleBuilderProps {
  value: ScheduleRule[]
  onChange: (rules: ScheduleRule[]) => void
  className?: string
}

export default function ScheduleBuilder({ value, onChange, className = '' }: ScheduleBuilderProps) {
  const [rules, setRules] = useState<ScheduleRule[]>(value || [])
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [loadingPrayers, setLoadingPrayers] = useState(true)

  // Récupérer les horaires de prière depuis l'API
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const res = await fetch('/api/prayer-times')
        if (res.ok) {
          const data = await res.json()
          setPrayerTimes(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des horaires de prière:', error)
      } finally {
        setLoadingPrayers(false)
      }
    }
    fetchPrayerTimes()
  }, [])

  // Construire la liste des prières avec leurs horaires
  const PRAYERS = [
    { value: 'fajr', label: 'Fajr', time: prayerTimes?.Fajr },
    { value: 'dhuhr', label: 'Dhuhr', time: prayerTimes?.Dhuhr },
    { value: 'asr', label: 'Asr', time: prayerTimes?.Asr },
    { value: 'maghreb', label: 'Maghreb', time: prayerTimes?.Maghrib },
    { value: 'isha', label: 'Isha', time: prayerTimes?.Isha },
  ]

  // Calculer l'heure effective pour une règle
  const getCalculatedTime = useCallback((rule: ScheduleRule): string | null => {
    if (!prayerTimes) return null
    const { timePattern } = rule

    if (timePattern.type === 'fixed') {
      return timePattern.fixedTime || null
    }

    const prayerKey = PRAYER_API_KEYS[timePattern.prayer || 'maghreb']
    const prayerTime = prayerTimes[prayerKey]
    if (!prayerTime) return null

    if (timePattern.type === 'after_prayer') {
      return addMinutesToTime(prayerTime, timePattern.offset || 0)
    }

    if (timePattern.type === 'before_prayer') {
      return addMinutesToTime(prayerTime, -(timePattern.offset || 0))
    }

    if (timePattern.type === 'between_prayers') {
      const prayerEndKey = PRAYER_API_KEYS[timePattern.prayerEnd || 'isha']
      const prayerEndTime = prayerTimes[prayerEndKey]
      if (prayerEndTime) {
        // Appliquer les décalages si définis
        const startTime = timePattern.offsetStart
          ? addMinutesToTime(prayerTime, timePattern.offsetStart)
          : prayerTime
        const endTime = timePattern.offsetEnd
          ? addMinutesToTime(prayerEndTime, -(timePattern.offsetEnd))
          : prayerEndTime
        // Calculer la durée
        const durationMinutes = getDurationBetweenTimes(startTime, endTime)
        const durationText = formatDuration(durationMinutes)
        return `${startTime} - ${endTime} (${durationText})`
      }
      return prayerTime
    }

    return null
  }, [prayerTimes])

  // Utiliser une ref pour stocker onChange et éviter les boucles infinies
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Tracker si c'est le premier render
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Ne pas appeler onChange au premier render (les valeurs viennent du parent)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    onChangeRef.current(rules)
  }, [rules])

  const addRule = () => {
    const newRule: ScheduleRule = {
      id: Date.now().toString(),
      dayPattern: { type: 'specific_days', days: ['samedi'] },
      timePattern: { type: 'fixed', fixedTime: '10:00' },
    }
    setRules([...rules, newRule])
  }

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id))
  }

  const updateRule = (id: string, updates: Partial<ScheduleRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const formatRule = (rule: ScheduleRule): string => {
    let dayText = ''
    let timeText = ''

    // Format day pattern
    switch (rule.dayPattern.type) {
      case 'daily':
        dayText = 'Tous les jours'
        break
      case 'specific_days':
        if (rule.dayPattern.days?.length === 1) {
          dayText = `Chaque ${rule.dayPattern.days[0]}`
        } else {
          dayText = `Les ${rule.dayPattern.days?.join(', ')}`
        }
        break
      case 'monthly_position':
        dayText = `${MONTHLY_POSITIONS.find(p => p.value === rule.dayPattern.monthlyPosition)?.label} ${rule.dayPattern.monthlyDay} du mois`
        break
    }

    // Format time pattern
    switch (rule.timePattern.type) {
      case 'fixed':
        timeText = `à ${rule.timePattern.fixedTime}`
        break
      case 'after_prayer':
        const offsetAfter = rule.timePattern.offset || 0
        timeText = offsetAfter > 0
          ? `${offsetAfter} min après ${rule.timePattern.prayer}`
          : `après ${rule.timePattern.prayer}`
        break
      case 'before_prayer':
        const offsetBefore = rule.timePattern.offset || 0
        timeText = offsetBefore > 0
          ? `${offsetBefore} min avant ${rule.timePattern.prayer}`
          : `avant ${rule.timePattern.prayer}`
        break
      case 'between_prayers':
        const prayerStartLabel = PRAYERS_STATIC.find(p => p.value === rule.timePattern.prayer)?.label || rule.timePattern.prayer
        const prayerEndLabel = PRAYERS_STATIC.find(p => p.value === rule.timePattern.prayerEnd)?.label || rule.timePattern.prayerEnd
        const startOffsetText = rule.timePattern.offsetStart ? ` (+${rule.timePattern.offsetStart})` : ''
        const endOffsetText = rule.timePattern.offsetEnd ? ` (-${rule.timePattern.offsetEnd})` : ''
        timeText = `entre ${prayerStartLabel}${startOffsetText} et ${prayerEndLabel}${endOffsetText}`
        break
    }

    return `${dayText} ${timeText}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Affichage des horaires de prière du jour */}
      {loadingPrayers ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Chargement des horaires de prière...</span>
        </div>
      ) : prayerTimes && (
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2">
            <Sun className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Horaires de prière du jour</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {PRAYERS.map((prayer) => (
              <span key={prayer.value} className="px-2 py-1 bg-white dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300">
                {prayer.label}: <strong className="text-emerald-700 dark:text-emerald-400">{prayer.time || '--:--'}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Règles existantes */}
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              {/* Résumé de la règle avec heure calculée */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatRule(rule)}</span>
                </div>
                {/* Affichage de l'heure calculée */}
                {prayerTimes && rule.timePattern.type !== 'fixed' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Clock className="h-3 w-3 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {getCalculatedTime(rule)}
                    </span>
                  </div>
                )}
              </div>

              {/* Configuration du jour */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Récurrence</label>
                  <select
                    value={rule.dayPattern.type}
                    onChange={(e) => {
                      const type = e.target.value as DayPattern['type']
                      const newDayPattern: DayPattern = { type }
                      if (type === 'specific_days') {
                        newDayPattern.days = ['samedi']
                      } else if (type === 'monthly_position') {
                        newDayPattern.monthlyPosition = 'first'
                        newDayPattern.monthlyDay = 'samedi'
                      }
                      updateRule(rule.id, { dayPattern: newDayPattern })
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="daily">Tous les jours</option>
                    <option value="specific_days">Jours spécifiques</option>
                    <option value="monthly_position">Chaque mois (1er samedi, etc.)</option>
                  </select>
                </div>

                {/* Sélection des jours */}
                {rule.dayPattern.type === 'specific_days' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Jours</label>
                    <div className="flex flex-wrap gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const currentDays = rule.dayPattern.days || []
                            const newDays = currentDays.includes(day.value)
                              ? currentDays.filter(d => d !== day.value)
                              : [...currentDays, day.value]
                            updateRule(rule.id, {
                              dayPattern: { ...rule.dayPattern, days: newDays }
                            })
                          }}
                          className={`px-2 py-1 text-xs rounded-md transition-colors ${
                            rule.dayPattern.days?.includes(day.value)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                          }`}
                        >
                          {day.label.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Position mensuelle */}
                {rule.dayPattern.type === 'monthly_position' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Position</label>
                      <select
                        value={rule.dayPattern.monthlyPosition}
                        onChange={(e) => updateRule(rule.id, {
                          dayPattern: { ...rule.dayPattern, monthlyPosition: e.target.value as DayPattern['monthlyPosition'] }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {MONTHLY_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>{pos.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Jour</label>
                      <select
                        value={rule.dayPattern.monthlyDay}
                        onChange={(e) => updateRule(rule.id, {
                          dayPattern: { ...rule.dayPattern, monthlyDay: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Configuration de l'horaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Type d&apos;horaire</label>
                  <select
                    value={rule.timePattern.type}
                    onChange={(e) => {
                      const type = e.target.value as TimePattern['type']
                      const newTimePattern: TimePattern = { type }
                      if (type === 'fixed') {
                        newTimePattern.fixedTime = '10:00'
                      } else if (type === 'after_prayer' || type === 'before_prayer') {
                        newTimePattern.prayer = 'maghreb'
                        newTimePattern.offset = 15
                      } else if (type === 'between_prayers') {
                        newTimePattern.prayer = 'maghreb'
                        newTimePattern.prayerEnd = 'isha'
                      }
                      updateRule(rule.id, { timePattern: newTimePattern })
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="fixed">Heure fixe</option>
                    <option value="after_prayer">Après une prière</option>
                    <option value="before_prayer">Avant une prière</option>
                    <option value="between_prayers">Entre deux prières</option>
                  </select>
                </div>

                {/* Heure fixe */}
                {rule.timePattern.type === 'fixed' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Heure</label>
                    <input
                      type="time"
                      value={rule.timePattern.fixedTime}
                      onChange={(e) => updateRule(rule.id, {
                        timePattern: { ...rule.timePattern, fixedTime: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                )}

                {/* Après/Avant prière */}
                {(rule.timePattern.type === 'after_prayer' || rule.timePattern.type === 'before_prayer') && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Prière</label>
                      <select
                        value={rule.timePattern.prayer}
                        onChange={(e) => updateRule(rule.id, {
                          timePattern: { ...rule.timePattern, prayer: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {PRAYERS.map((prayer) => (
                          <option key={prayer.value} value={prayer.value}>
                            {prayer.label} {prayer.time ? `(${prayer.time})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Décalage (min)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={rule.timePattern.offset || 0}
                        onChange={(e) => updateRule(rule.id, {
                          timePattern: { ...rule.timePattern, offset: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {/* Entre deux prières */}
                {rule.timePattern.type === 'between_prayers' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">De (prière)</label>
                      <select
                        value={rule.timePattern.prayer}
                        onChange={(e) => updateRule(rule.id, {
                          timePattern: { ...rule.timePattern, prayer: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {PRAYERS.map((prayer) => (
                          <option key={prayer.value} value={prayer.value}>
                            {prayer.label} {prayer.time ? `(${prayer.time})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">+ min après</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={rule.timePattern.offsetStart || 0}
                        onChange={(e) => updateRule(rule.id, {
                          timePattern: { ...rule.timePattern, offsetStart: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">À (prière)</label>
                      <select
                        value={rule.timePattern.prayerEnd}
                        onChange={(e) => updateRule(rule.id, {
                          timePattern: { ...rule.timePattern, prayerEnd: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {PRAYERS.map((prayer) => (
                          <option key={prayer.value} value={prayer.value}>
                            {prayer.label} {prayer.time ? `(${prayer.time})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">- min avant</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={rule.timePattern.offsetEnd || 0}
                        onChange={(e) => updateRule(rule.id, {
                          timePattern: { ...rule.timePattern, offsetEnd: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {/* Durée - masquée pour "entre deux prières" car la durée est définie par l'intervalle */}
                {rule.timePattern.type !== 'between_prayers' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Durée (min)</label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={rule.timePattern.duration || 60}
                      onChange={(e) => updateRule(rule.id, {
                        timePattern: { ...rule.timePattern, duration: parseInt(e.target.value) || 60 }
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bouton supprimer */}
            <button
              type="button"
              onClick={() => removeRule(rule.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}

      {/* Bouton ajouter */}
      <button
        type="button"
        onClick={addRule}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        <Plus className="h-5 w-5" />
        <span>Ajouter un créneau</span>
      </button>

      {/* Exemples de présets */}
      {rules.length === 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Exemples de plannings :</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setRules([{
                  id: Date.now().toString(),
                  dayPattern: { type: 'specific_days', days: ['samedi'] },
                  timePattern: { type: 'fixed', fixedTime: '10:00', duration: 120 },
                }])
              }}
              className="px-3 py-1 text-xs bg-white dark:bg-gray-800 rounded-full border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
            >
              <Sun className="inline h-3 w-3 mr-1" />
              Chaque samedi 10h
            </button>
            <button
              type="button"
              onClick={() => {
                setRules([{
                  id: Date.now().toString(),
                  dayPattern: { type: 'specific_days', days: ['samedi', 'mercredi'] },
                  timePattern: { type: 'after_prayer', prayer: 'maghreb', offset: 15, duration: 60 },
                }])
              }}
              className="px-3 py-1 text-xs bg-white dark:bg-gray-800 rounded-full border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
            >
              <Moon className="inline h-3 w-3 mr-1" />
              Sam & Mer après Maghreb
            </button>
            <button
              type="button"
              onClick={() => {
                setRules([{
                  id: Date.now().toString(),
                  dayPattern: { type: 'monthly_position', monthlyPosition: 'first', monthlyDay: 'samedi' },
                  timePattern: { type: 'between_prayers', prayer: 'maghreb', prayerEnd: 'isha' },
                }])
              }}
              className="px-3 py-1 text-xs bg-white dark:bg-gray-800 rounded-full border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
            >
              <Calendar className="inline h-3 w-3 mr-1" />
              1er samedi entre Maghreb-Isha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour convertir les règles en texte lisible
export function scheduleRulesToText(rules: ScheduleRule[]): string {
  if (!rules || rules.length === 0) return ''

  return rules.map(rule => {
    let dayText = ''
    let timeText = ''

    switch (rule.dayPattern.type) {
      case 'daily':
        dayText = 'Tous les jours'
        break
      case 'specific_days':
        if (rule.dayPattern.days?.length === 1) {
          dayText = `Chaque ${rule.dayPattern.days[0]}`
        } else {
          dayText = `Les ${rule.dayPattern.days?.join(' et ')}`
        }
        break
      case 'monthly_position':
        const posLabel = MONTHLY_POSITIONS.find(p => p.value === rule.dayPattern.monthlyPosition)?.label
        dayText = `${posLabel} ${rule.dayPattern.monthlyDay} du mois`
        break
    }

    switch (rule.timePattern.type) {
      case 'fixed':
        timeText = `à ${rule.timePattern.fixedTime}`
        break
      case 'after_prayer':
        const offsetAfter = rule.timePattern.offset || 0
        const prayerLabelAfter = PRAYERS_STATIC.find(p => p.value === rule.timePattern.prayer)?.label
        timeText = offsetAfter > 0
          ? `${offsetAfter} min après ${prayerLabelAfter}`
          : `après ${prayerLabelAfter}`
        break
      case 'before_prayer':
        const offsetBefore = rule.timePattern.offset || 0
        const prayerLabelBefore = PRAYERS_STATIC.find(p => p.value === rule.timePattern.prayer)?.label
        timeText = offsetBefore > 0
          ? `${offsetBefore} min avant ${prayerLabelBefore}`
          : `avant ${prayerLabelBefore}`
        break
      case 'between_prayers':
        const prayerStart = PRAYERS_STATIC.find(p => p.value === rule.timePattern.prayer)?.label
        const prayerEnd = PRAYERS_STATIC.find(p => p.value === rule.timePattern.prayerEnd)?.label
        const offsetStartText = rule.timePattern.offsetStart ? ` (+${rule.timePattern.offsetStart})` : ''
        const offsetEndText = rule.timePattern.offsetEnd ? ` (-${rule.timePattern.offsetEnd})` : ''
        timeText = `entre ${prayerStart}${offsetStartText} et ${prayerEnd}${offsetEndText}`
        break
    }

    // Pas de durée affichée pour "entre deux prières" car c'est implicite
    if (rule.timePattern.type === 'between_prayers') {
      return `${dayText} ${timeText}`
    }

    const duration = rule.timePattern.duration || 60
    const durationText = duration >= 60
      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? duration % 60 : ''}`
      : `${duration} min`

    return `${dayText} ${timeText} (${durationText})`
  }).join(' • ')
}
