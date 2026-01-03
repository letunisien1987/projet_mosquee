import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendOrganizerContactEmail } from '@/lib/email'

// Schéma de validation
const contactOrganizerSchema = z.object({
  email: z.string().email('Email invalide'),
  subject: z.string().min(1, 'Sujet requis'),
  message: z.string().min(10, 'Message trop court (minimum 10 caractères)'),
  organizerEmail: z.string().email('Email organisateur invalide'),
  itemType: z.enum(['event', 'activity']),
  itemId: z.string().min(1, 'ID requis'),
  itemTitle: z.string().min(1, 'Titre requis')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    const validation = contactOrganizerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Récupérer les infos de l'organisateur pour le nom
    const organizer = await prisma.user.findUnique({
      where: { email: data.organizerEmail },
      select: { firstName: true, lastName: true }
    })

    // Créer le message dans la base de données
    const contactMessage = await prisma.contactMessage.create({
      data: {
        firstName: data.email.split('@')[0], // Temporaire, l'email comme nom
        lastName: '',
        email: data.email,
        subject: data.subject,
        message: data.message,
        organizerEmail: data.organizerEmail,
        itemType: data.itemType,
        itemId: data.itemId,
        itemTitle: data.itemTitle
      }
    })

    // Envoyer l'email à l'organisateur
    await sendOrganizerContactEmail({
      organizerEmail: data.organizerEmail,
      organizerName: organizer ? `${organizer.firstName} ${organizer.lastName}` : undefined,
      senderEmail: data.email,
      subject: data.subject,
      message: data.message,
      itemType: data.itemType,
      itemTitle: data.itemTitle,
      itemId: data.itemId
    })

    return NextResponse.json({
      success: true,
      messageId: contactMessage.id
    })
  } catch (error) {
    console.error('Erreur contact-organizer:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
