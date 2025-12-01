import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import MemberNav from '@/components/membre/MemberNav'

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Rediriger vers la page de connexion si non authentifié
  if (!session) {
    redirect('/connexion')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation membre */}
      <MemberNav user={session.user} />

      {/* Contenu principal */}
      <main className="lg:pl-64">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
