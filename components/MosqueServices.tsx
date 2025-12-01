import { Users2, Heart, CalendarDays, GraduationCap, BookOpen, UtensilsCrossed, Accessibility, Droplets, Car } from 'lucide-react'

export interface MosqueServicesProps {
  womenSpace: boolean
  janazaPrayer: boolean
  aidPrayer: boolean
  childrenCourses: boolean
  adultCourses: boolean
  ramadanMeal: boolean
  handicapAccessibility: boolean
  ablutions: boolean
  parking: boolean
}

const serviceConfig = {
  womenSpace: {
    icon: Users2,
    label: 'Espace femmes',
    description: 'Espace dédié aux femmes',
    unavailableDescription: null,
    color: 'primary'
  },
  janazaPrayer: {
    icon: Heart,
    label: 'Prière janaza',
    description: 'Prières funéraires organisées',
    unavailableDescription: null,
    color: 'primary'
  },
  aidPrayer: {
    icon: CalendarDays,
    label: 'Prière de l\'Aïd',
    description: 'Prières de l\'Aïd organisées',
    unavailableDescription: null,
    color: 'primary'
  },
  childrenCourses: {
    icon: GraduationCap,
    label: 'Cours enfants',
    description: 'Cours pour enfants disponibles',
    unavailableDescription: null,
    color: 'primary'
  },
  adultCourses: {
    icon: BookOpen,
    label: 'Cours adultes',
    description: 'Cours pour adultes disponibles',
    unavailableDescription: null,
    color: 'primary'
  },
  ramadanMeal: {
    icon: UtensilsCrossed,
    label: 'Iftar Ramadan',
    description: 'Repas du Ramadan proposés',
    unavailableDescription: null,
    color: 'primary'
  },
  handicapAccessibility: {
    icon: Accessibility,
    label: 'Accès PMR',
    description: 'Accessible aux personnes à mobilité réduite',
    unavailableDescription: null,
    color: 'primary'
  },
  ablutions: {
    icon: Droplets,
    label: 'Ablutions',
    description: 'Installations pour les ablutions',
    unavailableDescription: null,
    color: 'primary'
  },
  parking: {
    icon: Car,
    label: 'Parking',
    description: 'Parking disponible',
    unavailableDescription: 'Pas de parking dédié. Évitez de bloquer l\'entrée et arrivez en avance pour trouver une place.',
    color: 'primary'
  },
}

export default function MosqueServices({
  womenSpace,
  janazaPrayer,
  aidPrayer,
  childrenCourses,
  adultCourses,
  ramadanMeal,
  handicapAccessibility,
  ablutions,
  parking
}: MosqueServicesProps) {
  const services = {
    womenSpace,
    janazaPrayer,
    aidPrayer,
    childrenCourses,
    adultCourses,
    ramadanMeal,
    handicapAccessibility,
    ablutions,
    parking
  }

  // Récupérer tous les services (disponibles et non disponibles avec description)
  const allServices = Object.entries(services)
    .map(([key, available]) => ({
      key: key as keyof typeof serviceConfig,
      available
    }))
    .filter(({ key, available }) => {
      // Afficher si disponible OU si non disponible mais avec une explication
      return available || serviceConfig[key].unavailableDescription
    })

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Services & Équipements</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Découvrez les services disponibles dans notre mosquée
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allServices.map(({ key: serviceKey, available }) => {
          const config = serviceConfig[serviceKey]
          const Icon = config.icon
          const isAvailable = available

          return (
            <div
              key={serviceKey}
              className={`rounded-xl shadow-md hover:shadow-lg transition-all p-6 border ${
                isAvailable
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isAvailable
                      ? 'bg-green-100 dark:bg-green-900/40'
                      : 'bg-red-100 dark:bg-red-900/40'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isAvailable
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{config.label}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {isAvailable ? config.description : config.unavailableDescription}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isAvailable ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-600 dark:bg-red-500 rounded-full">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {allServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun service disponible pour le moment
          </p>
        </div>
      )}
    </section>
  )
}
