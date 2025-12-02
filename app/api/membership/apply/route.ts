/**
 * API Route: Soumission d'une demande d'adhésion
 *
 * Workflow:
 * 1. Valide les données du formulaire
 * 2. Vérifie qu'il n'y a pas de demande en cours
 * 3. Crée la demande avec statut PENDING
 * 4. Envoie email de confirmation au demandeur
 * 5. Notifie l'admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  membershipType: z.enum(['ACTIF', 'PASSIF', 'INDIVIDUAL', 'FAMILY', 'STUDENT', 'SENIOR']),
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone requis'),
  dateOfBirth: z.string().optional(),
  address: z.string().min(5, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().min(4, 'Code postal requis'),
  country: z.string().default('Suisse'),
  desiredStartDate: z.string(),
  motivation: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Vérifier si email existe déjà avec demande en cours
    const existing = await prisma.membershipRequest.findFirst({
      where: {
        email: data.email.toLowerCase(),
        status: { in: ['PENDING', 'APPROVED', 'PAYMENT_SENT'] }
      }
    })

    if (existing) {
      return NextResponse.json(
        {
          error: 'Vous avez déjà une demande en cours',
          status: existing.status,
          requestId: existing.id
        },
        { status: 400 }
      )
    }

    // Créer la demande
    const request = await prisma.membershipRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        membershipType: data.membershipType as any,
        desiredStartDate: new Date(data.desiredStartDate),
        motivation: data.motivation || null,
        status: 'PENDING'
      }
    })

    console.log('✅ Demande d\'adhésion créée:', request.id, '-', data.email)

    // Envoyer email de confirmation au demandeur
    try {
      const { sendMembershipApplicationReceived } = await import('@/lib/email')
      await sendMembershipApplicationReceived({
        email: request.email,
        firstName: request.firstName,
        requestId: request.id
      })
      console.log('📧 Email de confirmation envoyé à:', request.email)
    } catch (emailError) {
      console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
    }

    // Notifier l'admin (optionnel)
    try {
      const { sendAdminNotification } = await import('@/lib/email')
      await sendAdminNotification({
        subject: 'Nouvelle demande d\'adhésion',
        message: `${data.firstName} ${data.lastName} (${data.email}) - Type: ${data.membershipType}`,
        link: `${process.env.NEXTAUTH_URL}/admin/demandes-adhesion`
      })
    } catch (error) {
      console.log('⚠️  Notification admin non envoyée:', error)
    }

    return NextResponse.json({
      success: true,
      requestId: request.id,
      message: 'Votre demande a été soumise avec succès'
    })

  } catch (error: any) {
    console.error('❌ Erreur soumission demande:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
