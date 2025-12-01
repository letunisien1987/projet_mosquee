import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEventCancellationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Récupérer l'inscription
    const registration = await prisma.eventRegistration.findUnique({
      where: { id }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscription introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que c'est bien l'utilisateur qui a fait l'inscription
    if (registration.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas annuler cette inscription' },
        { status: 403 }
      )
    }

    // Vérifier que l'inscription n'est pas déjà annulée
    if (registration.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cette inscription est déjà annulée' },
        { status: 400 }
      )
    }

    // Annuler l'inscription
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    // Envoyer l'email d'annulation
    try {
      await sendEventCancellationEmail(
        registration.email,
        registration.firstName,
        registration.eventTitle
      )
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError)
      // On ne bloque pas la requête si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Votre inscription a été annulée avec succès',
      registration: updatedRegistration
    })

  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'annulation' },
      { status: 500 }
    )
  }
}
