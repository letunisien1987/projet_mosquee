import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEventById } from '@/lib/directus'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params

    // Récupérer les infos de l'événement depuis Directus
    const event = await getEventById(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      )
    }

    // Compter les places prises (nombre total de participants: adultes + enfants)
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: { not: 'CANCELLED' },
      },
      select: {
        numberOfAdults: true,
        numberOfChildren: true,
      },
    })

    const registeredCount = registrations.reduce(
      (total, r) => total + r.numberOfAdults + r.numberOfChildren,
      0
    )
    const maxCapacity = event.max_capacity || null
    const availableSpots = maxCapacity ? maxCapacity - registeredCount : null
    const isFull = maxCapacity ? registeredCount >= maxCapacity : false

    // Vérifier si l'événement est passé
    const eventDate = event.date ? new Date(event.date) : null
    const isPast = eventDate ? eventDate < new Date() : false

    // Vérifier la deadline
    let isDeadlinePassed = false
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline)
      isDeadlinePassed = new Date() > deadline
    }

    const canRegister =
      event.registration_required &&
      !isPast &&
      !isFull &&
      !isDeadlinePassed

    return NextResponse.json({
      registrationRequired: event.registration_required,
      requiresApproval: event.requires_approval,
      maxCapacity,
      registeredCount,
      availableSpots,
      isFull,
      isPast,
      isDeadlinePassed,
      canRegister,
      registrationDeadline: event.registration_deadline,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
