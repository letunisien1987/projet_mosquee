import { BookOpen, GraduationCap, Users, Clock, MapPin, Phone, Heart } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Mapping des catégories vers les icônes par défaut
const categoryIcons: Record<string, any> = {
  QURAN: BookOpen,
  ARABIC: GraduationCap,
  SUNDAY_SCHOOL: Users,
  HALAQAT: Users,
  WOMEN: BookOpen,
  SUPPORT: GraduationCap,
  OTHER: BookOpen,
}

export default async function ActivitesPage() {
  // Récupérer les activités principales depuis la base de données
  const mainActivities = await prisma.activity.findMany({
    where: {
      status: 'ACTIVE',
      category: {
        in: ['QURAN', 'ARABIC', 'SUNDAY_SCHOOL'],
      },
    },
    include: {
      levels: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  // Récupérer les autres activités
  const otherActivities = await prisma.activity.findMany({
    where: {
      status: 'ACTIVE',
      category: {
        notIn: ['QURAN', 'ARABIC', 'SUNDAY_SCHOOL'],
      },
    },
    include: {
      levels: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  // Transformer les données pour le rendu
  const activities = mainActivities.map(activity => {
    // Déterminer l'icône à utiliser
    let IconComponent = categoryIcons[activity.category]
    if (activity.icon && activity.icon in LucideIcons) {
      IconComponent = (LucideIcons as any)[activity.icon]
    }

    return {
      title: activity.title,
      icon: IconComponent,
      description: activity.description,
      color: activity.color || 'primary',
      levels: activity.levels.map(level => ({
        name: level.name,
        schedule: level.schedule,
        instructor: level.instructor,
        participants: level.participants || '',
        details: level.details,
      })),
    }
  })

  const additionalActivities = otherActivities.map(activity => {
    let IconComponent = categoryIcons[activity.category]
    if (activity.icon && activity.icon in LucideIcons) {
      IconComponent = (LucideIcons as any)[activity.icon]
    }

    // Prendre le premier niveau pour les infos
    const firstLevel = activity.levels[0]

    return {
      title: activity.title,
      schedule: firstLevel?.schedule || '',
      description: activity.description,
      icon: IconComponent,
    }
  })

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

      {/* Main Activities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div key={index}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">{activity.title}</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300">{activity.description}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activity.levels.map((level, levelIndex) => (
                    <div
                      key={levelIndex}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:border-primary transition-all hover:shadow-xl"
                    >
                      <h3 className="text-xl font-bold mb-4 text-primary">{level.name}</h3>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold">Horaire</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{level.schedule}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <GraduationCap className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold">Enseignant</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{level.instructor}</p>
                          </div>
                        </div>

                        {level.participants && (
                          <div className="flex items-start gap-2">
                            <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold">Participants</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{level.participants}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {level.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Additional Activities */}
      {additionalActivities.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Autres Activités</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {additionalActivities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10"
                  >
                    <Icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-2">{activity.title}</h3>
                    {activity.schedule && (
                      <div className="flex items-center gap-2 text-sm text-primary mb-3">
                        <Clock className="h-4 w-4" />
                        <span>{activity.schedule}</span>
                      </div>
                    )}
                    <p className="text-gray-600 dark:text-gray-300">{activity.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Inscription Info avec lien vers formulaire */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary text-white rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Comment s'inscrire ?</h2>

          {/* Bouton d'inscription en ligne */}
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
