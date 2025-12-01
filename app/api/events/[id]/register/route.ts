import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getEventById } from '@/lib/directus'
import { sendEventRegistrationEmail } from '@/lib/email'
import { validateRestrictions, type EventRegistrationFormData } from '@/types/restrictions'

const registerSchema = z.object({
  // Type de participation
  participationType: z.enum(['INDIVIDUAL', 'FAMILY']).default('INDIVIDUAL'),
  // Contact
  contactFirstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  contactLastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(10, 'Numéro de téléphone invalide'),
  notes: z.string().optional(),
  // Pour INDIVIDUAL
  participantGender: z.enum(['MALE', 'FEMALE', 'CHILD']).optional(),
  participantBirthDate: z.string().optional(),
  // Pour CHILD - Parent/Tuteur
  parentRelation: z.enum(['PERE', 'MERE', 'TUTEUR', 'AUTRE']).optional(),
  // Pour FAMILY
  numberOfAdults: z.number().min(1).optional(),
  numberOfChildren: z.number().min(0).optional(),
  // Ancienne API (rétrocompatibilité)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  attendees: z.number().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Support ancien format (rétrocompatibilité)
    const formData: EventRegistrationFormData = {
      participationType: validatedData.participationType,
      contactFirstName: validatedData.contactFirstName || validatedData.firstName || '',
      contactLastName: validatedData.contactLastName || validatedData.lastName || '',
      contactEmail: validatedData.contactEmail || validatedData.email || '',
      contactPhone: validatedData.contactPhone || validatedData.phone || '',
      notes: validatedData.notes,
      participantGender: validatedData.participantGender,
      participantBirthDate: validatedData.participantBirthDate,
      numberOfAdults: validatedData.numberOfAdults,
      numberOfChildren: validatedData.numberOfChildren,
    }

    // VALIDATION: Pour les enfants, la relation parent est OBLIGATOIRE
    if (formData.participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD') {
      if (!validatedData.parentRelation) {
        return NextResponse.json(
          { error: 'Pour les inscriptions d\'enfants, la relation avec le parent/tuteur est obligatoire' },
          { status: 400 }
        )
      }
    }

    // Récupérer les infos de l'événement depuis Directus
    const event = await getEventById(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Événement introuvable' },
        { status: 404 }
      )
    }

    if (!event.registration_required) {
      return NextResponse.json(
        { error: 'Cet événement ne nécessite pas d\'inscription' },
        { status: 400 }
      )
    }

    // VALIDATION DES RESTRICTIONS
    if (event.restrictions?.enabled) {
      const validationResult = validateRestrictions(event.restrictions, formData)
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: validationResult.error, code: validationResult.errorCode },
          { status: 400 }
        )
      }
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
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline)
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
        email: formData.contactEmail,
        status: { not: 'CANCELLED' },
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Vous êtes déjà inscrit à cet événement' },
        { status: 400 }
      )
    }

    // Calculer le nombre total de participants
    const totalAttendees = formData.participationType === 'FAMILY'
      ? (formData.numberOfAdults || 1) + (formData.numberOfChildren || 0)
      : 1

    // Vérifier les places disponibles
    if (event.max_capacity) {
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
      const availableSpots = event.max_capacity - currentAttendees

      if (availableSpots < totalAttendees) {
        return NextResponse.json(
          {
            error: `Places insuffisantes. Il reste ${availableSpots} place(s) disponible(s)`,
          },
          { status: 400 }
        )
      }
    }

    // Créer l'inscription
    const status = event.requires_approval ? 'PENDING' : 'CONFIRMED'

    // Ajouter la relation parent aux notes si c'est un enfant
    let notesWithParentInfo = formData.notes || ''
    if (formData.participationType === 'INDIVIDUAL' && formData.participantGender === 'CHILD' && validatedData.parentRelation) {
      const relationLabels: Record<string, string> = {
        PERE: 'Père',
        MERE: 'Mère',
        TUTEUR: 'Tuteur légal',
        AUTRE: 'Autre'
      }
      const relationLabel = relationLabels[validatedData.parentRelation] || validatedData.parentRelation
      notesWithParentInfo = `[Relation parent: ${relationLabel}]${notesWithParentInfo ? '\n' + notesWithParentInfo : ''}`
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        eventTitle: event.title,
        firstName: formData.contactFirstName,
        lastName: formData.contactLastName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
        attendees: totalAttendees,
        notes: notesWithParentInfo,
        status,
      },
    })

    // Envoyer l'email de confirmation (seulement si confirmé automatiquement)
    if (status === 'CONFIRMED') {
      const eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      await sendEventRegistrationEmail(
        formData.contactEmail,
        formData.contactFirstName,
        event.title,
        eventDate
      )
    }

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
