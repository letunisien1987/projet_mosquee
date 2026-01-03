/**
 * API Admin: Gestion d'une inscription spécifique
 * PATCH /api/admin/offerings/[id]/registrations/[registrationId]
 * Actions: approve, reject
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById } from '@/lib/content'
import { hasPermission } from '@/lib/permissions'
import { UserRole } from '@prisma/client'
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

    const role = user.role as UserRole

    // Récupérer l'offre
    const offering = await getOfferingById(id)
    if (!offering) {
      return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions selon le type
    if (offering.itemType === 'EVENT') {
      const canManage = await hasPermission(role, 'MANAGE_EVENT_REGISTRATIONS')
      if (!canManage) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    } else {
      const canManage = await hasPermission(role, 'MANAGE_ENROLLMENTS')
      if (!canManage) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    }

    // Vérifier l'accès pour les non-admins
    const isFullAccess = ['ADMIN', 'IMAM', 'STAFF'].includes(role)
    const isManager =
      offering.managerId === user.id ||
      offering.managerEmail?.toLowerCase() === user.email?.toLowerCase()

    if (!isFullAccess && !isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { action } = await request.json()

    if (offering.itemType === 'EVENT') {
      // Gérer l'inscription événement
      const registration = await prisma.eventRegistration.findUnique({
        where: { id: registrationId },
      })

      if (!registration || registration.eventId !== id) {
        return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
      }

      if (action === 'approve') {
        const requiresPayment = offering.price && offering.price > 0 && !registration.paymentId
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
              eventTitle: offering.title,
              eventDate: offering.date?.toISOString() ?? '',
              participationType: registration.participationType || 'INDIVIDUAL',
              numberOfAdults: registration.numberOfAdults || 1,
              numberOfChildren: registration.numberOfChildren || 0,
              amount: registration.paymentAmount ? Number(registration.paymentAmount) : offering.price!,
              paymentUrl: `${process.env.NEXTAUTH_URL}/membre/mes-inscriptions`,
              registrationId: registration.id,
            })
          } else {
            await sendEventRegistrationEmail(
              registration.email,
              registration.firstName,
              offering.title,
              offering.date?.toISOString() ?? ''
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

        return NextResponse.json({
          success: true,
          message: 'Inscription refusée',
          newStatus: 'CANCELLED',
        })
      }
    } else {
      // Gérer l'inscription activité (enrollment)
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: registrationId },
        include: {
          user: { select: { email: true, firstName: true } },
        },
      })

      if (!enrollment || enrollment.activityId !== id) {
        return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
      }

      if (action === 'approve') {
        const requiresPayment = offering.price && offering.price > 0 && !enrollment.paymentId
        const newStatus = requiresPayment ? 'APPROVED' : 'ACTIVE'

        await prisma.enrollment.update({
          where: { id: registrationId },
          data: { status: newStatus },
        })

        return NextResponse.json({
          success: true,
          message: requiresPayment ? 'Inscription approuvée - Paiement requis' : 'Inscription confirmée',
          newStatus,
        })
      }

      if (action === 'reject') {
        await prisma.enrollment.update({
          where: { id: registrationId },
          data: { status: 'REJECTED' },
        })

        return NextResponse.json({
          success: true,
          message: 'Inscription refusée',
          newStatus: 'REJECTED',
        })
      }
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 })
  } catch (error) {
    console.error('Erreur PATCH registration:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
