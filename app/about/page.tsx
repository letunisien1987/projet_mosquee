import { Heart, Target, Users, Award, BookOpen, HandHeart } from 'lucide-react'

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Imam Mohammed Benali',
      role: 'Imam et Directeur Spirituel',
      description: 'Diplômé de l\'Université Al-Azhar, avec 15 ans d\'expérience dans l\'enseignement islamique',
    },
    {
      name: 'Dr. Fatima Zahri',
      role: 'Responsable des Activités Féminines',
      description: 'Docteur en Sciences Islamiques, spécialisée dans l\'éducation des enfants',
    },
    {
      name: 'Ahmed Karim',
      role: 'Président de l\'Association',
      description: 'Entrepreneur engagé dans le développement de la communauté musulmane',
    },
    {
      name: 'Youssef Mansour',
      role: 'Professeur d\'Arabe',
      description: 'Enseignant certifié avec 10 ans d\'expérience dans l\'enseignement de la langue arabe',
    },
  ]

  const values = [
    {
      icon: Heart,
      title: 'Fraternité',
      description: 'Cultiver l\'entraide et la solidarité au sein de notre communauté',
    },
    {
      icon: BookOpen,
      title: 'Connaissance',
      description: 'Promouvoir l\'apprentissage du Coran, de la langue arabe et des sciences islamiques',
    },
    {
      icon: HandHeart,
      title: 'Générosité',
      description: 'Encourager la charité et le soutien aux plus démunis',
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Créer un espace accueillant pour tous les musulmans de Paris',
    },
  ]

  return (
    <div className="islamic-pattern min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">À Propos de la Mosquée Al-Nour</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Une communauté unie par la foi, l'apprentissage et le service
          </p>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              Notre Histoire
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                La Mosquée Al-Nour a été fondée en 1995 par un groupe de musulmans dévoués
                cherchant à créer un lieu de culte et de rassemblement pour la communauté
                musulmane grandissante de Paris.
              </p>
              <p>
                Depuis nos modestes débuts dans un petit local de prière, nous avons grandi
                pour devenir l'un des centres islamiques les plus actifs de la région,
                accueillant des centaines de fidèles chaque semaine.
              </p>
              <p>
                En 2010, grâce à la générosité de nos membres et de nos donateurs, nous avons
                pu acquérir notre bâtiment actuel, nous permettant d'étendre considérablement
                nos services et nos activités communautaires.
              </p>
              <p>
                Aujourd'hui, la Mosquée Al-Nour est bien plus qu'un simple lieu de prière.
                C'est un centre d'apprentissage, de culture et de solidarité qui sert la
                communauté musulmane dans toute sa diversité.
              </p>
            </div>
          </div>
          <div className="bg-primary/5 rounded-xl p-8 border border-primary/20">
            <div className="space-y-6">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">1995</div>
                <div className="text-gray-700 dark:text-gray-300">Année de fondation</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-gray-700 dark:text-gray-300">Fidèles réguliers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">25+</div>
                <div className="text-gray-700 dark:text-gray-300">Programmes et activités</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">150+</div>
                <div className="text-gray-700 dark:text-gray-300">Étudiants en cours d'arabe et de Coran</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Notre Mission
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nous nous engageons à servir la communauté musulmane en fournissant un
              environnement spirituel enrichissant et accueillant
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-primary/10 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Notre Équipe</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Des personnes dévouées au service de la communauté
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-primary/10 hover:shadow-xl transition-shadow"
            >
              <div className="bg-gradient-to-br from-primary to-primary-dark h-48 flex items-center justify-center">
                <Users className="h-24 w-24 text-white/30" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-primary font-semibold mb-3 text-sm">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Rejoignez Notre Communauté</h2>
          <p className="text-xl text-white/90 mb-8">
            Que vous soyez nouveau dans la région ou à la recherche d'une communauté
            spirituelle, nous vous accueillons à bras ouverts
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Nous Contacter
            </a>
            <a
              href="/dons"
              className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
            >
              Faire un Don
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
