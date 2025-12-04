import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEventById } from '@/lib/directus'
import { sendEventRegistrationEmail, sendEventPaymentRequest } from '@/lib/email'
import { validateRestrictions, type EventRegistrationFormData, type EventRestrictions } from '@/types/restrictions'
import { calculatePrice, isPaidItem, type PricingConfig } from '@/lib/pricing'

const registerSchema = z.object({
  // === TYPE DE PARTICIPATION ===
  participationType: z.enum(['INDIVIDUAL', 'FAMILY'], {
    message: '⚠️ Choisissez votre type de participation: Individuel ou Famille'
  }).default('INDIVIDUAL'),

  // === INFORMATIONS DE CONTACT ===
  contactFirstName: z.string()
    .min(1, '⚠️ Votre prénom est requis pour l\'inscription')
    .min(2, '⚠️ Le prénom doit contenir au moins 2 caractères'),
  contactLastName: z.string()
    .min(1, '⚠️ Votre nom de famille est requis pour l\'inscription')
    .min(2, '⚠️ Le nom doit contenir au moins 2 caractères'),
  contactEmail: z.string()
    .min(1, '⚠️ Votre email est requis - nous l\'utiliserons pour vous envoyer la confirmation')
    .email('⚠️ Adresse email invalide - vérifiez le format (ex: prenom.nom@email.com)'),
  contactPhone: z.string()
    .min(1, '⚠️ Votre numéro de téléphone est requis pour vous contacter en cas de changement')
    .min(8, '⚠️ Le numéro de téléphone doit contenir au moins 8 chiffres (ex: 079 123 45 67)'),
  notes: z.string()
    .optional()
    .refine(val => !val || val.length <= 500, {
      message: '💡 Les notes sont limitées à 500 caractères'
    }),

  // === POUR INSCRIPTION INDIVIDUELLE ===
  participantGender: z.enum(['MALE', 'FEMALE', 'CHILD'], {
    message: '⚠️ Indiquez si vous êtes un homme, une femme ou un enfant'
  }).optional(),
  participantBirthDate: z.string()
    .optional()
    .refine(val => {
      if (!val) return true
      const date = new Date(val)
      return date <= new Date()
    }, { message: '⚠️ La date de naissance ne peut pas être dans le futur' }),

  // === POUR INSCRIPTION ENFANT - Parent/Tuteur ===
  parentRelation: z.enum(['PERE', 'MERE', 'TUTEUR', 'AUTRE'], {
    message: '⚠️ Précisez votre relation avec l\'enfant (Père, Mère, Tuteur légal ou Autre)'
  }).optional(),

  // === POUR INSCRIPTION FAMILLE ===
  numberOfAdults: z.number()
    .min(1, '⚠️ Il faut au moins 1 adulte pour une inscription famille')
    .max(20, '⚠️ Maximum 20 adultes par inscription - pour un groupe plus grand, contactez-nous')
    .optional(),
  numberOfChildren: z.number()
    .min(0, '⚠️ Le nombre d\'enfants ne peut pas être négatif')
    .max(20, '⚠️ Maximum 20 enfants par inscription - pour un groupe plus grand, contactez-nous')
    .optional(),

  // === ANCIENNE API (rétrocompatibilité) ===
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
      const validationResult = validateRestrictions(event.restrictions as EventRestrictions, formData)
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: validationResult.error, code: validationResult.errorCode },
          { status: 400 }
        )
      }
    }

    // Vérifier si l'événement est passé
    if (event.date) {
      const eventDate = new Date(event.date)
      if (eventDate < new Date()) {
        return NextResponse.json(
          { error: 'Cet événement est terminé' },
          { status: 400 }
        )
      }
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

      const currentAttendees = registrations.reduce(
        (total, r) => total + r.numberOfAdults + r.numberOfChildren,
        0
      )
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

    // Déterminer si l'événement est payant en utilisant le système de pricing avancé
    const isPaidEvent = isPaidItem(event.payment_type, event.price, event.pricing as PricingConfig | null)

    // Calculer le montant avec le système de tarification avancée
    let paymentAmount: number | null = null
    let pricingBreakdown: string[] = []

    if (isPaidEvent) {
      const pricingResult = calculatePrice(
        event.pricing as PricingConfig | null,
        {
          numberOfAdults: formData.numberOfAdults || 1,
          numberOfChildren: formData.numberOfChildren || 0,
          registrationDate: new Date(),
        },
        event.price // Fallback au prix simple
      )
      paymentAmount = pricingResult.total
      pricingBreakdown = pricingResult.breakdown
      console.log('💰 Calcul pricing:', pricingBreakdown.join(' | '))
    }

    // Créer l'inscription avec la logique de statut correcte:
    // 1. Si approbation requise → PENDING (même si payant, on attend l'approbation d'abord)
    // 2. Si pas d'approbation mais payant → PENDING_PAYMENT
    // 3. Si ni approbation ni paiement → CONFIRMED
    let status: 'PENDING' | 'CONFIRMED' | 'PENDING_PAYMENT'
    if (event.requires_approval) {
      status = 'PENDING' // Toujours PENDING si approbation requise, même si payant
    } else if (isPaidEvent) {
      status = 'PENDING_PAYMENT' // Seulement si payant SANS approbation
    } else {
      status = 'CONFIRMED'
    }

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

    // Chercher l'utilisateur connecté OU par email pour lier l'inscription
    let userId: string | null = null

    // 1. Essayer de récupérer l'utilisateur connecté
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      userId = session.user.id
    }

    // 2. Sinon, chercher par email dans la base
    if (!userId) {
      const userByEmail = await prisma.user.findFirst({
        where: { email: formData.contactEmail },
        select: { id: true }
      })
      if (userByEmail) {
        userId = userByEmail.id
      }
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
        numberOfAdults: formData.numberOfAdults || 1,
        numberOfChildren: formData.numberOfChildren || 0,
        participationType: formData.participationType,
        participantGender: formData.participantGender,
        notes: notesWithParentInfo,
        status,
        requiresPayment: isPaidEvent || false,
        paymentAmount,
        userId, // Lier au compte utilisateur si trouvé
      },
    })

    console.log('📝 Inscription créée:', registration.id, 'userId:', userId || 'invité')

    // Envoyer l'email à l'inscrit selon le statut
    const eventDateFormatted = event.date ? new Date(event.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : ''

    try {
      if (status === 'CONFIRMED') {
        // Email de confirmation immédiate
        await sendEventRegistrationEmail(
          formData.contactEmail,
          formData.contactFirstName,
          event.title,
          eventDateFormatted
        )
        console.log('📧 Email de confirmation envoyé à:', formData.contactEmail)
      } else if (status === 'PENDING_PAYMENT') {
        // Email avec lien de paiement
        const paymentUrl = `${process.env.NEXTAUTH_URL}/api/events/${eventId}/checkout?registrationId=${registration.id}`
        await sendEventPaymentRequest({
          email: formData.contactEmail,
          firstName: formData.contactFirstName,
          eventTitle: event.title,
          eventDate: event.date,
          participationType: formData.participationType,
          numberOfAdults: formData.numberOfAdults || 1,
          numberOfChildren: formData.numberOfChildren || 0,
          amount: paymentAmount || 0,
          paymentUrl,
          registrationId: registration.id,
        })
        console.log('📧 Email de paiement envoyé à:', formData.contactEmail)
      } else if (status === 'PENDING') {
        // Email de confirmation d'inscription en attente d'approbation
        const { sendEventPendingApprovalEmail } = await import('@/lib/email')
        await sendEventPendingApprovalEmail({
          email: formData.contactEmail,
          firstName: formData.contactFirstName,
          eventTitle: event.title,
          eventDate: event.date,
        })
        console.log('📧 Email d\'attente d\'approbation envoyé à:', formData.contactEmail)
      }
    } catch (emailError) {
      console.error('⚠️ Erreur envoi email inscrit (non bloquant):', emailError)
    }

    // Créer une notification pour l'inscrit s'il a un compte
    if (userId) {
      try {
        const notifMessage = status === 'CONFIRMED'
          ? `Votre inscription à "${event.title}" est confirmée.`
          : status === 'PENDING_PAYMENT'
          ? `Votre inscription à "${event.title}" est en attente de paiement.`
          : `Votre inscription à "${event.title}" est en attente d'approbation.`

        await prisma.notification.create({
          data: {
            userId,
            type: status === 'CONFIRMED' ? 'EVENT_CONFIRMATION' : 'EVENT_REGISTRATION_NEW',
            title: status === 'CONFIRMED' ? 'Inscription confirmée' : 'Inscription reçue',
            message: notifMessage,
            link: '/membre/evenements',
            read: false,
            emailSent: true,
          }
        })
        console.log('🔔 Notification créée pour l\'inscrit:', userId)
      } catch (notifError) {
        console.error('⚠️ Erreur notification inscrit:', notifError)
      }
    }

    // Notifier le responsable de l'événement
    if (event.manager_email) {
      let notificationId: string | null = null
      try {
        // Chercher le responsable par email dans notre base utilisateurs
        const managerUser = await prisma.user.findFirst({
          where: { email: event.manager_email },
          select: { id: true }
        })

        // Créer une notification si le responsable a un compte dans notre base
        if (managerUser) {
          const notification = await prisma.notification.create({
            data: {
              userId: managerUser.id,
              type: 'EVENT_REGISTRATION_NEW',
              title: 'Nouvelle inscription',
              message: `${formData.contactFirstName} ${formData.contactLastName} s'est inscrit(e) à "${event.title}" (${totalAttendees} participant(s))${isPaidEvent ? ` - ${paymentAmount} CHF` : ''}`,
              link: `/admin/evenements-gestion/${eventId}`,
              read: false,
              emailSent: false,
            }
          })
          notificationId = notification.id
          console.log('🔔 Notification créée pour le responsable:', managerUser.id)
        }

        // Envoyer un email au responsable
        const { sendNewRegistrationToManager } = await import('@/lib/email')
        const emailResult = await sendNewRegistrationToManager({
          managerEmail: event.manager_email,
          eventTitle: event.title,
          eventId,
          participantName: `${formData.contactFirstName} ${formData.contactLastName}`,
          participantEmail: formData.contactEmail,
          participantPhone: formData.contactPhone,
          numberOfParticipants: totalAttendees,
          participationType: formData.participationType,
          amount: isPaidEvent ? paymentAmount : null,
          requiresPayment: isPaidEvent || false,
          status,
        })

        // Mettre à jour la notification avec emailSent = true si l'email a été envoyé
        if (emailResult.success && notificationId) {
          await prisma.notification.update({
            where: { id: notificationId },
            data: { emailSent: true }
          })
        }

        console.log('📧 Email envoyé au responsable:', event.manager_email, emailResult.success ? '✅' : '❌')
      } catch (notifError) {
        console.error('⚠️ Erreur notification responsable (non bloquant):', notifError)
      }
    }

    // Construire le message et la réponse
    let message = 'Votre inscription a été confirmée avec succès'
    let checkoutUrl: string | null = null

    if (status === 'PENDING_PAYMENT') {
      // Seulement si paiement direct sans approbation
      message = `Votre inscription a été enregistrée. Montant à payer: ${paymentAmount} CHF`
      checkoutUrl = `/api/events/${eventId}/checkout?registrationId=${registration.id}`
    } else if (status === 'PENDING') {
      // En attente d'approbation - PAS de redirection vers le paiement
      if (isPaidEvent) {
        message = 'Votre demande d\'inscription a été enregistrée. Après approbation par l\'organisateur, vous recevrez un email avec le lien de paiement.'
      } else {
        message = 'Votre demande d\'inscription a été enregistrée et sera confirmée par l\'organisateur.'
      }
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        status: registration.status,
        message,
        // IMPORTANT: requiresPayment est FALSE si l'événement nécessite une approbation
        // Le paiement sera demandé après l'approbation
        requiresPayment: status === 'PENDING_PAYMENT', // Seulement si paiement immédiat
        requiresApproval: event.requires_approval,
        paymentAmount: isPaidEvent ? paymentAmount : null,
        pricingBreakdown: isPaidEvent ? pricingBreakdown : null, // Détail du calcul
        checkoutUrl, // Sera null si status === 'PENDING'
        paymentType: event.payment_type,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Construire un message d'erreur lisible
      const fieldMessages: Record<string, string> = {
        contactFirstName: 'Prénom',
        contactLastName: 'Nom',
        contactEmail: 'Email',
        contactPhone: 'Téléphone',
        participationType: 'Type de participation',
        participantGender: 'Genre',
        participantBirthDate: 'Date de naissance',
        numberOfAdults: 'Nombre d\'adultes',
        numberOfChildren: 'Nombre d\'enfants',
      }

      const errorMessages = error.issues.map(issue => {
        const field = issue.path[0] as string
        const fieldName = fieldMessages[field] || field
        return `${fieldName}: ${issue.message}`
      })

      return NextResponse.json(
        {
          error: 'Veuillez corriger les erreurs suivantes',
          details: errorMessages,
          fieldErrors: error.issues.map(issue => ({
            field: issue.path[0],
            message: issue.message
          }))
        },
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
