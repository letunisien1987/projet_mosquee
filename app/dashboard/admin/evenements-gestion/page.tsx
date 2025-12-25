import { redirect } from 'next/navigation'

/**
 * Cette page redirige vers la gestion unifiée avec le filtre événements.
 * La gestion des événements se fait maintenant via /dashboard/admin/gestion
 */
export default function EvenementsGestionPage() {
  redirect('/dashboard/admin/gestion?type=event')
}
