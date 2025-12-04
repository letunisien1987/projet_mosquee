/**
 * API Membre Organisateur: Détails d'une activité
 * GET /api/membre/organisateur/activity/[id]
 * PATCH /api/membre/organisateur/activity/[id] - Modifier l'activité
 * Returns activity details and enrollments for the manager
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById, updateOffering } from '@/lib/directus'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer l'activité depuis Directus
    const activity = await getOfferingById(id)

    if (!activity || activity.item_type !== 'ACTIVITY') {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien le responsable
    const isManager =
      activity.manager_id === user.id ||
      activity.manager_email?.toLowerCase() === user.email?.toLowerCase() ||
      ['ADMIN', 'IMAM', 'STAFF'].includes(user.role)

    if (!isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer les inscriptions depuis PostgreSQL
    const enrollments = await prisma.enrollment.findMany({
      where: { activityId: id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        child: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formater les inscriptions
    const formattedEnrollments = enrollments.map((enrollment) => ({
      id: enrollment.id,
      firstName: enrollment.child?.firstName || enrollment.user?.firstName || '',
      lastName: enrollment.child?.lastName || enrollment.user?.lastName || '',
      email: enrollment.user?.email || '',
      phone: enrollment.user?.phone || null,
      status: enrollment.status,
      paymentAmount: enrollment.paymentAmount ? Number(enrollment.paymentAmount) : null,
      paymentId: enrollment.paymentId,
      notes: enrollment.notes,
      createdAt: enrollment.createdAt.toISOString(),
      isChild: !!enrollment.childId,
      childName: enrollment.child ? `${enrollment.child.firstName} ${enrollment.child.lastName}` : null,
    }))

    return NextResponse.json({
      activity: {
        id: activity.id,
        title: activity.title,
        slug: activity.slug,
        description: activity.description,
        content: activity.content,
        category: activity.category,
        schedule: activity.schedule,
        price: activity.price,
        payment_type: activity.payment_type,
        max_capacity: activity.max_capacity,
        enrollment_open: activity.enrollment_open,
        requires_approval: activity.requires_approval,
        published: activity.published,
        restrictions: activity.restrictions,
      },
      enrollments: formattedEnrollments,
    })
  } catch (error) {
    console.error('Erreur GET /api/membre/organisateur/activity/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH - Modifier l'activité
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer l'activité
    const activity = await getOfferingById(id)

    if (!activity || activity.item_type !== 'ACTIVITY') {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien le responsable
    const isManager =
      activity.manager_id === user.id ||
      activity.manager_email?.toLowerCase() === user.email?.toLowerCase() ||
      ['ADMIN', 'IMAM', 'STAFF'].includes(user.role)

    if (!isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {}

    // Champs modifiables
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.schedule !== undefined) updateData.schedule = body.schedule
    if (body.max_capacity !== undefined) updateData.max_capacity = body.max_capacity
    if (body.enrollment_open !== undefined) updateData.enrollment_open = body.enrollment_open
    if (body.requires_approval !== undefined) updateData.requires_approval = body.requires_approval
    if (body.published !== undefined) updateData.published = body.published
    if (body.price !== undefined) updateData.price = body.price
    if (body.payment_type !== undefined) updateData.payment_type = body.payment_type
    if (body.restrictions !== undefined) updateData.restrictions = body.restrictions

    // Mettre à jour dans Directus
    const updatedActivity = await updateOffering(id, updateData)

    if (!updatedActivity) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Activité mise à jour avec succès',
      activity: updatedActivity,
    })
  } catch (error) {
    console.error('Erreur PATCH /api/membre/organisateur/activity/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
