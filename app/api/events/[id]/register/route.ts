import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { client } from '@/sanity/lib/client'

const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide'),
  attendees: z.number().min(1).default(1),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

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

    if (!event.registrationRequired) {
      return NextResponse.json(
        { error: 'Cet événement ne nécessite pas d\'inscription' },
        { status: 400 }
      )
    }

    // Vérifier si l'événement est passé
    const eventDate = new Date(event.date)
    if (eventDate < new Date()) {
      return NextResponse.json(
        { error: 'Cet événement est terminé' },
        { status: 400 }
      )
    }

    // Vérifier la deadline d'inscription
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline)
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'La date limite d\'inscription est dépassée' },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        email: validatedData.email,
        status: { not: 'CANCELLED' },
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement' },
        { status: 400 }
      )
    }

    // Vérifier les places disponibles
    if (event.maxCapacity) {
      const totalRegistered = await prisma.eventRegistration.aggregate({
        where: {
          eventId,
          status: { not: 'CANCELLED' },
        },
        _sum: {
          attendees: true,
        },
      })

      const currentAttendees = totalRegistered._sum.attendees || 0
      const availableSpots = event.maxCapacity - currentAttendees

      if (availableSpots < validatedData.attendees) {
        return NextResponse.json(
          {
            error: `Places insuffisantes. Il reste ${availableSpots} place(s) disponible(s)`,
          },
          { status: 400 }
        )
      }
    }

    // Créer l'inscription
    const status = event.requiresApproval ? 'PENDING' : 'CONFIRMED'

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        eventTitle: event.title,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        attendees: validatedData.attendees,
        notes: validatedData.notes,
        status,
      },
    })

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        status: registration.status,
        message:
          status === 'PENDING'
            ? 'Votre inscription a été enregistrée et sera confirmée par un administrateur'
            : 'Votre inscription a été confirmée avec succès',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}
