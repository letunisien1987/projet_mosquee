'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Link from 'next/link'

function AdhesionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Optionnel : Vérifier la session Stripe si besoin
    if (!sessionId) {
      console.warn('Pas de session_id dans les paramètres')
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Animation de succès */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg
                className="w-16 h-16 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="absolute -top-4 -right-4">
              <span className="flex h-8 w-8">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-8 w-8 bg-red-500"></span>
              </span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenue dans la famille !
          </h1>

          <p className="text-xl text-gray-600 mb-2">
            Votre adhésion a été confirmée avec succès
          </p>

          <p className="text-lg text-red-600 font-semibold">
            Barakallahou fikoum
          </p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-full text-lg font-bold mb-4">
              Paiement réussi - 120 CHF
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800 mb-2">
                  Que se passe-t-il maintenant ?
                </h3>
                <ul className="text-sm text-red-700 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Un email de confirmation avec votre reçu vous a été envoyé</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Votre compte membre est maintenant actif</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Vous avez accès à votre espace membre en ligne</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-3">
                <svg
                  className="w-8 h-8 text-blue-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h3 className="font-bold text-blue-900">Compte créé</h3>
              </div>
              <p className="text-sm text-blue-700">
                Si vous n'aviez pas encore de compte, il a été automatiquement créé. Utilisez "Mot de passe oublié" pour le configurer.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-3">
                <svg
                  className="w-8 h-8 text-purple-600 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                <h3 className="font-bold text-purple-900">Avantages actifs</h3>
              </div>
              <p className="text-sm text-purple-700">
                Tous les avantages membres sont immédiatement disponibles. Profitez-en dès maintenant !
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              Prochaines étapes recommandées
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs mr-3 flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    Accédez à votre espace membre
                  </p>
                  <p className="text-sm text-gray-600">
                    Consultez votre profil, vos avantages et l'historique de votre adhésion
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs mr-3 flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    Explorez nos activités
                  </p>
                  <p className="text-sm text-gray-600">
                    Découvrez tous les cours, événements et services disponibles
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs mr-3 flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    Rejoignez la communauté
                  </p>
                  <p className="text-sm text-gray-600">
                    Participez aux groupes WhatsApp/Telegram et aux événements exclusifs
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/membre/dashboard"
            className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition-colors text-center font-bold flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Mon espace
          </Link>

          <Link
            href="/activites"
            className="bg-white border-2 border-red-600 text-red-600 px-6 py-4 rounded-lg hover:bg-red-50 transition-colors text-center font-bold flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Activités
          </Link>

          <Link
            href="/"
            className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-lg hover:bg-gray-50 transition-colors text-center font-bold flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Accueil
          </Link>
        </div>

        {/* Citation */}
        <div className="mt-8 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-6 text-center">
          <p className="text-lg italic mb-2">
            "Les croyants ne sont que des frères"
          </p>
          <p className="text-sm opacity-90">Sourate Al-Hujurat (49:10)</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Besoin d'aide ?{' '}
            <Link href="/contact" className="text-red-600 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdhesionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <AdhesionSuccessContent />
    </Suspense>
  )
}
