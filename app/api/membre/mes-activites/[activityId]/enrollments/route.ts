/**
 * API: Liste des inscriptions d'une activité gérée
 * GET /api/membre/mes-activites/[activityId]/enrollments
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isActivityManager } from '@/lib/directus'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { activityId } = await params
    const userId = session.user.id

    // Vérifier que l'utilisateur est responsable de cette activité
    const isManager = await isActivityManager(activityId, userId)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas responsable de cette activité' },
        { status: 403 }
      )
    }

    // Filtres depuis les query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Construire le filtre
    const where: any = {
      activityId: activityId.toString(),
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Récupérer les inscriptions
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filtrer par recherche si nécessaire (nom, email)
    let filteredEnrollments = enrollments
    if (search) {
      const searchLower = search.toLowerCase()
      filteredEnrollments = enrollments.filter((e) => {
        const userName = `${e.user?.firstName || ''} ${e.user?.lastName || ''}`.toLowerCase()
        const userEmail = (e.user?.email || '').toLowerCase()
        const childName = `${e.child?.firstName || ''} ${e.child?.lastName || ''}`.toLowerCase()
        return (
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          childName.includes(searchLower)
        )
      })
    }

    return NextResponse.json({
      enrollments: filteredEnrollments,
      count: filteredEnrollments.length,
    })
  } catch (error) {
    console.error('Erreur GET /api/membre/mes-activites/[activityId]/enrollments:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
