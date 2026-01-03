/**
 * API Membre Organisateur: Détail d'un événement
 * GET /api/membre/organisateur/event/[id]
 * PATCH /api/membre/organisateur/event/[id] - Modifier l'événement
 */

import { NextRequest, NextResponse } from 'next/server'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById, updateOffering } from '@/lib/content'

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
      event.managerId === user.id ||
      event.managerEmail?.toLowerCase() === user.email?.toLowerCase() ||
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
        start_time: event.startTime,
        end_time: event.endTime,
        location: event.location,
        price: event.price,
        payment_type: event.paymentType,
        max_capacity: event.maxCapacity,
        registration_required: event.registrationRequired,
        requires_approval: event.requiresApproval,
        registration_deadline: event.registrationDeadline,
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
      event.managerId === user.id ||
      event.managerEmail?.toLowerCase() === user.email?.toLowerCase() ||
      ['ADMIN', 'IMAM', 'STAFF'].includes(user.role)

    if (!isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()

    // Préparer les données de mise à jour
    // Accepter camelCase OU snake_case pour compatibilité avec les formulaires
    const updateData: Record<string, unknown> = {}

    // Champs modifiables par l'organisateur
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.description !== undefined) updateData.description = body.description
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.date !== undefined) updateData.date = body.date

    // Accepter les deux conventions de nommage
    const startTime = body.startTime ?? body.start_time
    const endTime = body.endTime ?? body.end_time
    const maxCapacity = body.maxCapacity ?? body.max_capacity
    const registrationRequired = body.registrationRequired ?? body.registration_required
    const requiresApproval = body.requiresApproval ?? body.requires_approval
    const registrationDeadline = body.registrationDeadline ?? body.registration_deadline
    const paymentType = body.paymentType ?? body.payment_type
    const subscriptionInterval = body.subscriptionInterval ?? body.subscription_interval
    const allowRefund = body.allowRefund ?? body.allow_refund
    const cancellationDeadlineDays = body.cancellationDeadlineDays ?? body.cancellation_deadline_days
    const showOrganizerName = body.showOrganizerName ?? body.show_organizer_name
    const showOrganizerEmail = body.showOrganizerEmail ?? body.show_organizer_email
    const showOrganizerPhone = body.showOrganizerPhone ?? body.show_organizer_phone

    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (body.location !== undefined) updateData.location = body.location
    if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity
    if (registrationRequired !== undefined) updateData.registrationRequired = registrationRequired
    if (requiresApproval !== undefined) updateData.requiresApproval = requiresApproval
    if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline
    if (body.published !== undefined) updateData.published = body.published
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.price !== undefined) updateData.price = body.price
    if (paymentType !== undefined) updateData.paymentType = paymentType
    if (subscriptionInterval !== undefined) updateData.subscriptionInterval = subscriptionInterval
    if (allowRefund !== undefined) updateData.allowRefund = allowRefund
    if (cancellationDeadlineDays !== undefined) updateData.cancellationDeadlineDays = cancellationDeadlineDays
    if (showOrganizerName !== undefined) updateData.showOrganizerName = showOrganizerName
    if (showOrganizerEmail !== undefined) updateData.showOrganizerEmail = showOrganizerEmail
    if (showOrganizerPhone !== undefined) updateData.showOrganizerPhone = showOrganizerPhone
    if (body.restrictions !== undefined) updateData.restrictions = body.restrictions
    if (body.pricing !== undefined) updateData.pricing = body.pricing

    // Mettre à jour via lib/content.ts
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
