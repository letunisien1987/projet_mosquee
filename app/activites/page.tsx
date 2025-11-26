import { BookOpen, GraduationCap, Users, Clock, Calendar, MapPin, Phone } from 'lucide-react'

export default function ActivitesPage() {
  const activities = [
    {
      title: 'Cours de Coran',
      icon: BookOpen,
      description: 'Apprentissage de la lecture du Coran avec tajweed pour tous les niveaux',
      levels: [
        {
          name: 'Débutants',
          schedule: 'Samedi 10h00 - 12h00',
          instructor: 'Cheikh Abdallah',
          participants: '15-20 étudiants',
          details: 'Apprentissage des bases : alphabet arabe, prononciation, et premières sourates',
        },
        {
          name: 'Intermédiaire',
          schedule: 'Samedi 14h00 - 16h00',
          instructor: 'Hafidh Ibrahim',
          participants: '12-15 étudiants',
          details: 'Perfectionnement du tajweed et mémorisation de Juz Amma',
        },
        {
          name: 'Avancé (Hifz)',
          schedule: 'Samedi & Dimanche 9h00 - 11h00',
          instructor: 'Hafidh Youssef',
          participants: '8-10 étudiants',
          details: 'Programme de mémorisation complète du Coran',
        },
      ],
      color: 'primary',
    },
    {
      title: 'Cours d\'Arabe',
      icon: GraduationCap,
      description: 'Apprentissage de la langue arabe littéraire pour enfants et adultes',
      levels: [
        {
          name: 'Enfants (6-10 ans)',
          schedule: 'Mercredi 14h00 - 15h30',
          instructor: 'Mme Fatima',
          participants: '15-18 enfants',
          details: 'Apprentissage ludique : alphabet, vocabulaire de base, et phrases simples',
        },
        {
          name: 'Adolescents (11-17 ans)',
          schedule: 'Mercredi 16h00 - 17h30',
          instructor: 'M. Youssef',
          participants: '12-15 étudiants',
          details: 'Grammaire, conjugaison, lecture et conversation',
        },
        {
          name: 'Adultes Débutants',
          schedule: 'Jeudi 19h00 - 20h30',
          instructor: 'M. Ahmed',
          participants: '10-12 étudiants',
          details: 'Base de la langue arabe : lecture, écriture et grammaire élémentaire',
        },
        {
          name: 'Adultes Avancés',
          schedule: 'Mardi 19h00 - 20h30',
          instructor: 'Dr. Karim',
          participants: '8-10 étudiants',
          details: 'Étude de textes classiques, littérature arabe et conversation avancée',
        },
      ],
      color: 'accent',
    },
    {
      title: 'École du Dimanche',
      icon: Users,
      description: 'Éducation islamique complète pour les enfants de 5 à 15 ans',
      levels: [
        {
          name: 'Petit Groupe (5-7 ans)',
          schedule: 'Dimanche 10h00 - 11h30',
          instructor: 'Mme Aïcha & Mme Khadija',
          participants: '20-25 enfants',
          details: 'Histoires des Prophètes, bonnes manières islamiques, prières de base',
        },
        {
          name: 'Moyen Groupe (8-11 ans)',
          schedule: 'Dimanche 10h00 - 12h00',
          instructor: 'M. Omar & Mme Hafsa',
          participants: '25-30 enfants',
          details: 'Aqida, Fiqh, histoire islamique, et valeurs morales',
        },
        {
          name: 'Grand Groupe (12-15 ans)',
          schedule: 'Dimanche 14h00 - 16h00',
          instructor: 'Cheikh Mohammed & M. Hassan',
          participants: '15-20 jeunes',
          details: 'Islam contemporain, débats, questions-réponses, et projets communautaires',
        },
      ],
      color: 'primary',
    },
  ]

  const additionalActivities = [
    {
      title: 'Cercles d\'Étude (Halaqat)',
      schedule: 'Tous les vendredis après Asr',
      description: 'Discussion et apprentissage sur des sujets islamiques variés',
      icon: Users,
    },
    {
      title: 'Cours pour Femmes',
      schedule: 'Samedis 15h00 - 16h30',
      description: 'Enseignements islamiques et discussions dans un cadre réservé aux sœurs',
      icon: BookOpen,
    },
    {
      title: 'Soutien Scolaire',
      schedule: 'Mercredis & Samedis 17h00 - 18h30',
      description: 'Aide aux devoirs pour les élèves du primaire et collège',
      icon: GraduationCap,
    },
  ]

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

                        <div className="flex items-start gap-2">
                          <Users className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold">Participants</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{level.participants}</p>
                          </div>
                        </div>
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
                  <div className="flex items-center gap-2 text-sm text-primary mb-3">
                    <Clock className="h-4 w-4" />
                    <span>{activity.schedule}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{activity.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Inscription Info */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary text-white rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">Comment s'inscrire ?</h2>
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
