/**
 * API Membre Organisateur: Gestion d'une inscription
 * PATCH /api/membre/organisateur/event/[id]/registrations/[registrationId]
 * Actions: approve, reject
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById } from '@/lib/content'
import { sendEventPaymentRequest, sendEventRegistrationEmail } from '@/lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id, registrationId } = await params
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

    // Récupérer l'inscription
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    })

    if (!registration || registration.eventId !== id) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    const { action } = await request.json()

    if (action === 'approve') {
      // Si l'événement est payant, mettre en PENDING_PAYMENT
      // Sinon mettre en CONFIRMED
      const requiresPayment = event.price && event.price > 0 && !registration.paymentId

      const newStatus = requiresPayment ? 'PENDING_PAYMENT' : 'CONFIRMED'

      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: { status: newStatus },
      })

      // Envoyer l'email approprié
      try {
        if (requiresPayment) {
          await sendEventPaymentRequest({
            email: registration.email,
            firstName: registration.firstName,
            eventTitle: event.title,
            eventDate: event.date?.toISOString() ?? '',
            participationType: registration.participationType || 'INDIVIDUAL',
            numberOfAdults: registration.numberOfAdults || 1,
            numberOfChildren: registration.numberOfChildren || 0,
            amount: registration.paymentAmount ? Number(registration.paymentAmount) : event.price!,
            paymentUrl: `${process.env.NEXTAUTH_URL}/membre/mes-inscriptions`,
            registrationId: registration.id,
          })
        } else {
          await sendEventRegistrationEmail(
            registration.email,
            registration.firstName,
            event.title,
            event.date?.toISOString() ?? ''
          )
        }
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
      }

      return NextResponse.json({
        success: true,
        message: requiresPayment ? 'Inscription approuvée - Paiement requis' : 'Inscription confirmée',
        newStatus,
      })
    }

    if (action === 'reject') {
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' },
      })

      // Envoyer email de refus
      try {
        await sendEventRegistrationEmail(
          registration.email,
          registration.firstName,
          event.title,
          event.date?.toISOString() ?? ''
        )
      } catch (emailError) {
        console.error('Erreur envoi email:', emailError)
      }

      return NextResponse.json({
        success: true,
        message: 'Inscription refusée',
        newStatus: 'CANCELLED',
      })
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 })
  } catch (error) {
    console.error('Erreur PATCH registration:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
