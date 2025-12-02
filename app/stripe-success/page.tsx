import { CheckCircle, Home, Receipt } from 'lucide-react'
import Link from 'next/link'

export default function StripeSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Icône de succès */}
        <div className="mb-6 flex justify-center">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Don effectué avec succès !
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Merci pour votre générosité. Votre don a été enregistré avec succès.
        </p>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Un reçu de confirmation vous a été envoyé par email.
        </p>

        {/* Citation coranique */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-emerald-800 dark:text-emerald-300 italic arabic-text mb-2">
            &quot;مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا&quot;
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            &quot;Qui prêtera à Allah un prêt sincère ?&quot; (Coran 57:11)
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/dons"
            className="block w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <Receipt className="h-5 w-5" />
              Faire un autre don
            </span>
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <Home className="h-5 w-5" />
              Retour à l&apos;accueil
            </span>
          </Link>
        </div>

        {/* Note fiscale */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          Votre reçu fiscal sera généré automatiquement en début d&apos;année prochaine.
        </p>
      </div>
    </div>
  )
}
