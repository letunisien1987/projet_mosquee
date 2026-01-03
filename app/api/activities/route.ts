import { NextResponse } from 'next/server'
import { getActiveActivities } from '@/lib/content'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'

// GET - Liste les activités actives (public)
export async function GET() {
  try {
    const activities = await getActiveActivities()

    // Retourner toutes les informations nécessaires pour l'affichage
    const formattedActivities = activities.map((activity) => ({
      id: String(activity.id),
      title: activity.title,
      category: activity.category,
      schedule: activity.schedule || '',
      schedule_rules: [],  // Plus utilisé - le schedule est une chaîne simple
      instructor: activity.instructorName || '',
      age_group: activity.ageGroup || '',
      description: activity.description || '',
      price: activity.price || 0,
      enrollment_open: activity.enrollmentOpen !== false,
      requires_approval: activity.requiresApproval || false,
      active: activity.active !== false,
      // Garder levels pour compatibilité avec le formulaire d'inscription
      levels: [
        {
          id: String(activity.id),
          name: activity.level || 'Niveau unique',
          schedule: activity.schedule || '',
          price: activity.price || null,
        }
      ]
    }))

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error('Erreur GET /api/activities:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
