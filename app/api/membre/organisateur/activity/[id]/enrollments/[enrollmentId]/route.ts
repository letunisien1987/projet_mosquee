/**
 * API Membre Organisateur: Gestion d'une inscription à une activité
 * PATCH /api/membre/organisateur/activity/[id]/enrollments/[enrollmentId]
 * Actions: approve, reject
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById } from '@/lib/directus'
import { sendEnrollmentApprovalEmail, sendEnrollmentRejectionEmail, sendEnrollmentPaymentRequest } from '@/lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    const { id, enrollmentId } = await params
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

    // Récupérer l'activité
    const activity = await getOfferingById(id)

    if (!activity || activity.item_type !== 'ACTIVITY') {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien le responsable
    const isManager =
      activity.manager_id === user.id ||
      activity.manager_email?.toLowerCase() === user.email?.toLowerCase() ||
      ['ADMIN', 'IMAM', 'STAFF'].includes(user.role)

    if (!isManager) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer l'inscription
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        child: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!enrollment || enrollment.activityId !== id) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    const { action } = await request.json()

    const participantFirstName = enrollment.child?.firstName || enrollment.user?.firstName || ''
    const participantLastName = enrollment.child?.lastName || enrollment.user?.lastName || ''
    const contactEmail = enrollment.user?.email

    if (action === 'approve') {
      // Si l'activité est payante, mettre en APPROVED (en attente de paiement)
      // Sinon mettre en ACTIVE
      const requiresPayment = activity.price && activity.price > 0 && !enrollment.paymentId

      const newStatus = requiresPayment ? 'APPROVED' : 'ACTIVE'

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: newStatus },
      })

      // Envoyer l'email approprié
      if (contactEmail) {
        try {
          if (requiresPayment) {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7)

            await sendEnrollmentPaymentRequest({
              email: contactEmail,
              firstName: participantFirstName,
              activityTitle: activity.title,
              participantName: `${participantFirstName} ${participantLastName}`,
              amount: enrollment.paymentAmount ? Number(enrollment.paymentAmount) : activity.price!,
              paymentUrl: `${process.env.NEXTAUTH_URL}/membre/mes-inscriptions`,
              expiresAt,
            })
          } else {
            await sendEnrollmentApprovalEmail(
              contactEmail,
              participantFirstName,
              activity.title
            )
          }
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError)
        }
      }

      return NextResponse.json({
        success: true,
        message: requiresPayment ? 'Inscription approuvée - Paiement requis' : 'Inscription activée',
        newStatus,
      })
    }

    if (action === 'reject') {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'REJECTED' },
      })

      // Envoyer email de refus
      if (contactEmail) {
        try {
          await sendEnrollmentRejectionEmail(
            contactEmail,
            participantFirstName,
            activity.title
          )
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Inscription refusée',
        newStatus: 'REJECTED',
      })
    }

    return NextResponse.json({ error: 'Action non valide' }, { status: 400 })
  } catch (error) {
    console.error('Erreur PATCH enrollment:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
