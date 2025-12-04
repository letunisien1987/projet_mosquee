'use client'

import { useState, useEffect } from 'react'
import { BookOpen, GraduationCap, Users, MapPin, Phone, Heart } from 'lucide-react'
import Link from 'next/link'
import { CategoryFilter, activityCategoryStyles } from '@/components/CategoryFilter'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ItemCard, activityCategoryColors } from '@/components/ItemCard'
import type { ScheduleRule } from '@/components/forms/ScheduleBuilder'

type ActivityCategory = 'Tous' | 'Coran' | 'Arabe' | 'École' | 'Autres'

// Types pour les horaires de prière
interface PrayerTimes {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
}

// Mapping des prières
const PRAYER_API_KEYS: Record<string, keyof PrayerTimes> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghreb: 'Maghrib',
  isha: 'Isha',
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghreb: 'Maghreb',
  isha: 'Isha',
}

const MONTHLY_POSITIONS: Record<string, string> = {
  first: 'Premier',
  second: 'Deuxième',
  third: 'Troisième',
  fourth: 'Quatrième',
  last: 'Dernier',
}

// Fonction pour ajouter des minutes à une heure
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, mins + minutes, 0, 0)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Calculer la durée entre deux heures
function getDurationBetweenTimes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  return (endH * 60 + endM) - (startH * 60 + startM)
}

// Formater une durée
function formatDuration(minutes: number): string {
  if (minutes < 0) return ''
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`
}

// Générer le texte d'horaire enrichi avec les heures de prière
function formatScheduleWithPrayerTimes(rules: ScheduleRule[], prayerTimes: PrayerTimes | null): string {
  if (!rules || rules.length === 0) return ''

  return rules.map(rule => {
    let dayText = ''
    let timeText = ''

    // Format des jours
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
        const posLabel = MONTHLY_POSITIONS[rule.dayPattern.monthlyPosition || 'first']
        dayText = `${posLabel} ${rule.dayPattern.monthlyDay} du mois`
        break
    }

    // Format de l'horaire
    switch (rule.timePattern.type) {
      case 'fixed':
        timeText = `à ${rule.timePattern.fixedTime}`
        break
      case 'after_prayer':
        const prayerAfter = PRAYER_LABELS[rule.timePattern.prayer || 'maghreb']
        const offsetAfter = rule.timePattern.offset || 0
        if (prayerTimes) {
          const prayerKey = PRAYER_API_KEYS[rule.timePattern.prayer || 'maghreb']
          const prayerTime = prayerTimes[prayerKey]
          const calculatedTime = addMinutesToTime(prayerTime, offsetAfter)
          timeText = offsetAfter > 0
            ? `${offsetAfter} min après ${prayerAfter} ${prayerTime} → ${calculatedTime}`
            : `après ${prayerAfter} ${prayerTime}`
        } else {
          timeText = offsetAfter > 0
            ? `${offsetAfter} min après ${prayerAfter}`
            : `après ${prayerAfter}`
        }
        break
      case 'before_prayer':
        const prayerBefore = PRAYER_LABELS[rule.timePattern.prayer || 'maghreb']
        const offsetBefore = rule.timePattern.offset || 0
        if (prayerTimes) {
          const prayerKeyBefore = PRAYER_API_KEYS[rule.timePattern.prayer || 'maghreb']
          const prayerTimeBefore = prayerTimes[prayerKeyBefore]
          const calculatedTimeBefore = addMinutesToTime(prayerTimeBefore, -offsetBefore)
          timeText = offsetBefore > 0
            ? `${offsetBefore} min avant ${prayerBefore} ${prayerTimeBefore} → ${calculatedTimeBefore}`
            : `avant ${prayerBefore} ${prayerTimeBefore}`
        } else {
          timeText = offsetBefore > 0
            ? `${offsetBefore} min avant ${prayerBefore}`
            : `avant ${prayerBefore}`
        }
        break
      case 'between_prayers':
        const prayerStart = PRAYER_LABELS[rule.timePattern.prayer || 'maghreb']
        const prayerEnd = PRAYER_LABELS[rule.timePattern.prayerEnd || 'isha']
        const offsetStart = rule.timePattern.offsetStart || 0
        const offsetEnd = rule.timePattern.offsetEnd || 0

        if (prayerTimes) {
          const startKey = PRAYER_API_KEYS[rule.timePattern.prayer || 'maghreb']
          const endKey = PRAYER_API_KEYS[rule.timePattern.prayerEnd || 'isha']
          const startPrayerTime = prayerTimes[startKey]
          const endPrayerTime = prayerTimes[endKey]
          const startTime = addMinutesToTime(startPrayerTime, offsetStart)
          const endTime = addMinutesToTime(endPrayerTime, -offsetEnd)
          const duration = getDurationBetweenTimes(startTime, endTime)
          const durationText = formatDuration(duration)

          const startText = offsetStart > 0
            ? `${prayerStart} ${startPrayerTime} (+${offsetStart}min) → ${startTime}`
            : `${prayerStart} ${startPrayerTime}`
          const endText = offsetEnd > 0
            ? `${prayerEnd} ${endPrayerTime} (-${offsetEnd}min) → ${endTime}`
            : `${prayerEnd} ${endPrayerTime}`

          timeText = `entre ${startText} et ${endText}${durationText ? ` (${durationText})` : ''}`
        } else {
          const startOffsetText = offsetStart > 0 ? ` (+${offsetStart})` : ''
          const endOffsetText = offsetEnd > 0 ? ` (-${offsetEnd})` : ''
          timeText = `entre ${prayerStart}${startOffsetText} et ${prayerEnd}${endOffsetText}`
        }
        break
    }

    return `${dayText} ${timeText}`
  }).join(' | ')
}

// Mapping des catégories vers les icônes
const categoryIcons: Record<string, any> = {
  coran: BookOpen,
  arabe: GraduationCap,
  ecole: Users,
  tajweed: BookOpen,
  hifz: BookOpen,
  halaqat: Users,
  autre: BookOpen,
}

// Mapping des catégories API vers les catégories de filtre
const categoryMapping: Record<string, ActivityCategory> = {
  coran: 'Coran',
  arabe: 'Arabe',
  ecole: 'École',
  tajweed: 'Autres',
  hifz: 'Autres',
  halaqat: 'Autres',
  autre: 'Autres',
}

interface Activity {
  id: string
  title: string
  category: string
  schedule?: string
  schedule_rules?: ScheduleRule[]
  instructor?: string
  age_group?: string
  description?: string
  price?: number
  enrollment_open?: boolean
  requires_approval?: boolean
  active?: boolean
}

export default function ActivitesPage() {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('Tous')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)

  const categories: ActivityCategory[] = ['Tous', 'Coran', 'Arabe', 'École', 'Autres']

  useEffect(() => {
    fetchActivities()
    fetchPrayerTimes()
  }, [])

  const fetchPrayerTimes = async () => {
    try {
      const res = await fetch('/api/prayer-times')
      if (res.ok) {
        const data = await res.json()
        setPrayerTimes(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des horaires de prière:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities')
      if (!response.ok) throw new Error('Erreur réseau')
      const data = await response.json()
      const activeActivities = (data || []).filter((a: Activity) => a.active !== false)
      setActivities(activeActivities)
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = selectedCategory === 'Tous'
    ? activities
    : activities.filter(activity => categoryMapping[activity.category] === selectedCategory)

  if (loading) {
    return <LoadingSpinner message="Chargement des activités..." />
  }

  return (
    <div className="islamic-pattern min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Nos Activités</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Des programmes d'apprentissage et de développement pour toute la famille
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        styles={activityCategoryStyles}
        resultCount={filteredActivities.length}
        resultLabel="activité"
      />

      {/* Activities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const categoryConfig = activityCategoryColors[activity.category] || activityCategoryColors.autre
            const Icon = categoryIcons[activity.category] || BookOpen

            // Utiliser le texte enrichi avec horaires de prière si schedule_rules existe
            const scheduleText = activity.schedule_rules && activity.schedule_rules.length > 0
              ? formatScheduleWithPrayerTimes(activity.schedule_rules, prayerTimes)
              : activity.schedule

            return (
              <ItemCard
                key={activity.id}
                id={activity.id}
                title={activity.title}
                href={`/activites/${activity.id}`}
                description={activity.description}
                categoryConfig={categoryConfig}
                icon={Icon}
                infos={[
                  ...(scheduleText ? [{ icon: 'clock' as const, label: 'Horaire', value: scheduleText }] : []),
                  ...(activity.instructor ? [{ icon: 'instructor' as const, label: 'Enseignant', value: activity.instructor }] : []),
                  ...(activity.age_group ? [{ icon: 'users' as const, label: 'Participants', value: activity.age_group }] : []),
                ]}
                price={{
                  amount: activity.price || 0,
                }}
                badge={activity.requires_approval ? {
                  text: 'Sur validation',
                  variant: 'warning',
                } : undefined}
                status={activity.enrollment_open !== false ? {
                  type: 'available',
                } : {
                  type: 'closed',
                }}
              />
            )
          })}
        </div>

        {filteredActivities.length === 0 && (
          <EmptyState
            icon={BookOpen}
            message="Aucune activité trouvée pour cette catégorie"
          />
        )}
      </section>

      {/* Inscription Info */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary text-white rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Comment s'inscrire ?</h2>

          <div className="mb-6 text-center">
            <Link href="/activites/inscription">
              <button className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-white/90 transition-all inline-flex items-center gap-2">
                <Heart className="h-5 w-5" />
                S'inscrire en ligne
              </button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Sur Place
              </h3>
              <p className="text-white/90 text-sm">
                Venez nous rencontrer à la mosquée après les prières du vendredi
                ou pendant les heures d'ouverture (9h-20h)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Par Téléphone
              </h3>
              <p className="text-white/90 text-sm">
                Appelez-nous au 01 23 45 67 89 du lundi au samedi de 9h à 18h
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-sm">
            <p className="mb-2">
              <strong>Tarifs :</strong>
            </p>
            <ul className="space-y-1 text-white/90">
              <li>• Cours individuels : 30€/mois</li>
              <li>• Plusieurs cours : 50€/mois par enfant</li>
              <li>• Réductions familiales disponibles (3 enfants ou plus)</li>
              <li>• Bourses disponibles sur demande pour les familles en difficulté</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
