import { XCircle, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function StripeCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {/* Icône d'annulation */}
        <div className="mb-6 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4">
            <XCircle className="h-16 w-16 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Don annulé
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Votre don n&apos;a pas été effectué. Aucun montant n&apos;a été débité de votre compte.
        </p>

        {/* Message encouragement */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Si vous avez rencontré un problème, n&apos;hésitez pas à nous contacter ou à réessayer plus tard.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/dons"
            className="block w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Retour aux dons
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

        {/* Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Besoin d&apos;aide ?
          </p>
          <a
            href="mailto:dons@mosque-madretsch.ch"
            className="text-primary hover:underline font-medium"
          >
            dons@mosque-madretsch.ch
          </a>
        </div>
      </div>
    </div>
  )
}
