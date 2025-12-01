import { NextResponse } from 'next/server'
import { getActivities } from '@/lib/directus'

// GET - Liste les activités actives (public)
export async function GET() {
  try {
    const activities = await getActivities()

    // Adapter le format pour le formulaire d'inscription
    // Chaque activité Directus devient une activité avec un seul niveau
    const formattedActivities = activities.map((activity: any) => ({
      id: String(activity.id), // Convertir en string pour la cohérence
      title: activity.title,
      category: activity.category,
      levels: [
        {
          id: String(activity.id), // Utiliser le même ID que l'activité
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
