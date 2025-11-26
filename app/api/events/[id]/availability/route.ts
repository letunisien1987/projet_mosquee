import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { client } from '@/sanity/lib/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params

    // Récupérer les infos de l'événement depuis Sanity
    const event = await client.fetch(
      `*[_type == "event" && _id == $eventId][0] {
        _id,
        title,
        registrationRequired,
        maxCapacity,
        requiresApproval,
        registrationDeadline,
        date
      }`,
      { eventId }
    )

    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      )
    }

    // Compter les places prises
    const totalRegistered = await prisma.eventRegistration.aggregate({
      where: {
        eventId,
        status: { not: 'CANCELLED' },
      },
      _sum: {
        attendees: true,
      },
    })

    const registeredCount = totalRegistered._sum.attendees || 0
    const maxCapacity = event.maxCapacity || null
    const availableSpots = maxCapacity ? maxCapacity - registeredCount : null
    const isFull = maxCapacity ? registeredCount >= maxCapacity : false

    // Vérifier si l'événement est passé
    const eventDate = new Date(event.date)
    const isPast = eventDate < new Date()

    // Vérifier la deadline
    let isDeadlinePassed = false
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline)
      isDeadlinePassed = new Date() > deadline
    }

    const canRegister =
      event.registrationRequired &&
      !isPast &&
      !isFull &&
      !isDeadlinePassed

    return NextResponse.json({
      registrationRequired: event.registrationRequired,
      requiresApproval: event.requiresApproval,
      maxCapacity,
      registeredCount,
      availableSpots,
      isFull,
      isPast,
      isDeadlinePassed,
      canRegister,
      registrationDeadline: event.registrationDeadline,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
