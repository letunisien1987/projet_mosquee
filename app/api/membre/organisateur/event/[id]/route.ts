/**
 * API Membre Organisateur: Détail d'un événement
 * GET /api/membre/organisateur/event/[id]
 * PATCH /api/membre/organisateur/event/[id] - Modifier l'événement
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

    // Récupérer l'événement
    const event = await getOfferingById(id)

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien le responsable
    const isManager =
      event.manager_id === user.id ||
      event.manager_email?.toLowerCase() === user.email?.toLowerCase() ||
      ['ADMIN', 'IMAM', 'STAFF'].includes(user.role)

    if (!isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer les inscriptions
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        numberOfAdults: true,
        numberOfChildren: true,
        paymentAmount: true,
        paymentId: true,
        notes: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        content: event.content,
        category: event.category,
        date: event.date,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
        price: event.price,
        payment_type: event.payment_type,
        max_capacity: event.max_capacity,
        registration_required: event.registration_required,
        requires_approval: event.requires_approval,
        registration_deadline: event.registration_deadline,
        published: event.published,
      },
      registrations: registrations.map((r) => ({
        ...r,
        paymentAmount: r.paymentAmount ? Number(r.paymentAmount) : null,
      })),
    })
  } catch (error) {
    console.error('Erreur GET /api/membre/organisateur/event/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH - Modifier l'événement
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

    // Récupérer l'événement
    const event = await getOfferingById(id)

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien le responsable
    const isManager =
      event.manager_id === user.id ||
      event.manager_email?.toLowerCase() === user.email?.toLowerCase() ||
      ['ADMIN', 'IMAM', 'STAFF'].includes(user.role)

    if (!isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {}

    // Champs modifiables par l'organisateur
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.date !== undefined) updateData.date = body.date
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.location !== undefined) updateData.location = body.location
    if (body.max_capacity !== undefined) updateData.max_capacity = body.max_capacity
    if (body.registration_required !== undefined) updateData.registration_required = body.registration_required
    if (body.requires_approval !== undefined) updateData.requires_approval = body.requires_approval
    if (body.registration_deadline !== undefined) updateData.registration_deadline = body.registration_deadline
    if (body.published !== undefined) updateData.published = body.published
    if (body.price !== undefined) updateData.price = body.price
    if (body.payment_type !== undefined) updateData.payment_type = body.payment_type

    // Mettre à jour dans Directus
    const updatedEvent = await updateOffering(id, updateData)

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Événement mis à jour avec succès',
      event: updatedEvent,
    })
  } catch (error) {
    console.error('Erreur PATCH /api/membre/organisateur/event/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
