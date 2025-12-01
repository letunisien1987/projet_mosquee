import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Download, Calendar, CreditCard, BookOpen, Heart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/connexion')
  }

  // Récupérer les données pour générer les documents
  const [donations, memberships, enrollments] = await Promise.all([
    prisma.donation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.membership.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const currentYear = new Date().getFullYear()
  const donationsThisYear = donations.filter(d =>
    new Date(d.createdAt).getFullYear() === currentYear
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mes Documents
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Téléchargez vos attestations et reçus
        </p>
      </div>

      {/* Documents fiscaux */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Documents fiscaux
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reçu fiscal annuel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Reçu fiscal {currentYear}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Récapitulatif de vos dons
                  </p>
                  {donationsThisYear.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {donationsThisYear.length} don(s) - Total: {donationsThisYear.reduce((s, d) => s + d.amount, 0).toFixed(2)} CHF
                    </p>
                  )}
                </div>
              </div>
            </div>
            {donationsThisYear.length > 0 ? (
              <form action="/api/membre/dons/export" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                >
                  <Download className="h-4 w-4" />
                  Télécharger (PDF)
                </button>
              </form>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                Aucun don en {currentYear}
              </div>
            )}
          </div>

          {/* Reçus de dons individuels */}
          {donations.slice(0, 3).map((donation) => (
            <div key={donation.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Reçu de don
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(donation.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {donation.amount.toFixed(2)} CHF - {donation.type}
                    </p>
                  </div>
                </div>
              </div>
              <form action="/api/membre/dons/export" method="POST">
                <input type="hidden" name="donationId" value={donation.id} />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <Download className="h-4 w-4" />
                  Télécharger (PDF)
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Attestations de cotisation */}
      {memberships.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Attestations de cotisation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map((membership) => (
              <div key={membership.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Attestation {membership.type}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(membership.startDate).toLocaleDateString('fr-FR')} - {new Date(membership.endDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {membership.amount.toFixed(2)} CHF - {membership.status}
                      </p>
                    </div>
                  </div>
                </div>
                <form action="/api/membre/cotisation/attestation" method="POST">
                  <input type="hidden" name="membershipId" value={membership.id} />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger (PDF)
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attestations d'inscription */}
      {enrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Attestations d'inscription
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {enrollment.activityTitle}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Inscription active
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Depuis le {new Date(enrollment.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
                <form action="/api/membre/inscriptions/attestation" method="POST">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger (PDF)
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {donations.length === 0 && memberships.length === 0 && enrollments.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun document disponible
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vos documents apparaîtront ici une fois que vous aurez des dons, cotisations ou inscriptions
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/dons"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <Heart className="h-5 w-5" />
              Faire un don
            </a>
            <a
              href="/activites"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <BookOpen className="h-5 w-5" />
              Voir les activités
            </a>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              À propos de vos documents
            </h3>
            <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>• Tous les documents sont générés au format PDF</li>
              <li>• Les reçus fiscaux sont disponibles uniquement pour les dons payés</li>
              <li>• Conservez précieusement ces documents pour votre déclaration fiscale</li>
              <li>• En cas de problème, contactez-nous à info@mosquee-alnour.ch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
