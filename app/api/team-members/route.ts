import { NextResponse } from 'next/server'
import { getTeamMembers } from '@/lib/content'

export async function GET() {
  try {
    const teamMembers = await getTeamMembers()
    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error('Erreur lors de la récupération des membres de l\'équipe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
