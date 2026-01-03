'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Page de redirection vers l'interface unifiee de gestion
 * Cette page existe pour maintenir la retrocompatibilite avec les anciens liens
 */
export default function OrganiserRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/admin/gestion')
  }, [router])

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">
        Redirection vers la gestion des offres...
      </p>
    </div>
  )
}
