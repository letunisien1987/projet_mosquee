import { NextResponse } from 'next/server'
import { getProjects } from '@/lib/content'

export async function GET() {
  try {
    const projects = await getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
