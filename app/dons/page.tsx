import { Heart, Landmark, Users, Building, TrendingUp } from 'lucide-react'
import { getProjects, getDirectusImageUrl } from '@/lib/directus'
import IbanCopyButton from '@/components/IbanCopyButton'
import TamaroWidget from '@/components/TamaroWidget'

export const dynamic = 'force-dynamic'

export default async function DonsPage() {
  // Récupérer les projets actifs depuis Directus
  const projects = await getProjects()

  const donationTypes = [
    {
      title: 'Zakat',
      icon: Heart,
      description: 'Aumône obligatoire calculée sur vos biens (2.5% de votre épargne annuelle)',
      color: 'primary',
      details: [
        'Purification de vos biens',
        'Obligation religieuse annuelle',
        'Redistribuée aux nécessiteux',
        'Calcul personnalisé disponible',
      ],
    },
    {
      title: 'Sadaqa',
      icon: Heart,
      description: 'Charité volontaire pour gagner des récompenses auprès d\'Allah',
      color: 'accent',
      details: [
        'Don volontaire à tout moment',
        'Montant libre selon vos moyens',
        'Sadaqa Jariya (continue)',
        'Bénéfices spirituels permanents',
      ],
    },
    {
      title: 'Cotisation Membre',
      icon: Users,
      description: 'Contribution mensuelle ou annuelle pour le fonctionnement de la mosquée',
      color: 'primary',
      details: [
        'Soutien régulier de la mosquée',
        '20€/mois ou 200€/an',
        'Accès prioritaire aux événements',
        'Newsletter mensuelle',
      ],
    },
  ]

  const iban = 'FR76 1234 5678 9012 3456 7890 123'

  return (
    <div className="islamic-pattern min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Faire un Don</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-4">
            Soutenez votre mosquée et participez au bien-être de la communauté
          </p>
          <p className="text-lg text-white/80 italic arabic-text">
            "مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا"
          </p>
          <p className="text-sm text-white/70 mt-2">
            "Qui prêtera à Allah un prêt sincère ?" (Coran 57:11)
          </p>
        </div>
      </section>

      {/* Donation Types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Types de Dons</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {donationTypes.map((type, index) => {
            const Icon = type.icon
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10 hover:shadow-xl transition-all"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-${type.color}/10 rounded-full mb-4`}>
                  <Icon className={`h-8 w-8 text-${type.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{type.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{type.description}</p>
                <ul className="space-y-2">
                  {type.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Don en ligne via RaiseNow */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-primary/10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Faire un Don en Ligne</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Soutenez la mosquée en quelques clics de manière sécurisée
            </p>
          </div>

          {/* Widget Tamaro RaiseNow */}
          <TamaroWidget
            language="fr"
            testMode={false}
          />
        </div>
      </section>

      {/* Projects */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Projets en Cours</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Contribuez à nos projets communautaires
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {projects.map((project: any) => {
              const percentage = ((project.current_amount || 0) / (project.goal_amount || 1)) * 100
              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-primary/10"
                >
                  {project.image && typeof project.image === 'string' && getDirectusImageUrl(project.image) ? (
                    <div className="mb-4 rounded-lg overflow-hidden h-32">
                      <img
                        src={getDirectusImageUrl(project.image) || ''}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <Building className="h-12 w-12 text-primary mb-4" />
                  )}
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {project.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="font-semibold">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary-dark h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-primary font-bold">
                        {(project.current_amount || 0).toLocaleString('fr-FR')}€
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        sur {(project.goal_amount || 0).toLocaleString('fr-FR')}€
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* IBAN Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-primary/10">
          <div className="text-center mb-6">
            <Landmark className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Coordonnées Bancaires</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Pour effectuer un virement bancaire
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bénéficiaire</p>
                <p className="font-semibold">Association Mosquée Al-Nour</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">IBAN</p>
                <div className="relative">
                  <IbanCopyButton iban={iban} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">BIC</p>
                <p className="font-mono">BNPAFRPPXXX</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Important :</strong> N'oubliez pas d'indiquer dans le libellé du virement
              votre nom et le type de don (Zakat, Sadaqa, Cotisation, ou nom du projet).
            </p>
          </div>
        </div>
      </section>

      {/* Tax Benefits */}
      <section className="bg-accent/10 border-y border-accent/20 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Avantages Fiscaux</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Votre don à la Mosquée Al-Nour est déductible de vos impôts
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 inline-block">
            <p className="text-3xl font-bold text-primary mb-2">66%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              de réduction d'impôts dans la limite de 20% du revenu imposable
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Un reçu fiscal vous sera automatiquement envoyé en début d'année
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Questions ?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Pour toute question concernant les dons, n'hésitez pas à nous contacter
          </p>
          <div className="space-y-2">
            <p>
              <strong>Email :</strong>{' '}
              <a href="mailto:dons@mosquee-alnour.fr" className="text-primary hover:underline">
                dons@mosquee-alnour.fr
              </a>
            </p>
            <p>
              <strong>Téléphone :</strong>{' '}
              <a href="tel:0123456789" className="text-primary hover:underline">
                01 23 45 67 89
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
