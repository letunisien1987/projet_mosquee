import { NextResponse } from 'next/server'
import { getActivities } from '@/lib/directus'

// GET - Liste les activités actives (public)
export async function GET() {
  try {
    const activities = await getActivities()

    // Retourner toutes les informations nécessaires pour l'affichage
    const formattedActivities = activities.map((activity: any) => ({
      id: String(activity.id),
      title: activity.title,
      category: activity.category,
      schedule: activity.schedule || '',
      schedule_rules: activity.schedule_rules || [],
      instructor: activity.instructor || '',
      age_group: activity.age_group || '',
      description: activity.description || '',
      price: activity.price || 0,
      enrollment_open: activity.enrollment_open !== false,
      requires_approval: activity.requires_approval || false,
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
