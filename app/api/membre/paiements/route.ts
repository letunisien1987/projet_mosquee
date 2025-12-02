/**
 * API Route: Récupérer les paiements en attente d'un membre
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Cotisations en attente de paiement
    const pendingMemberships = await prisma.membership.findMany({
      where: {
        userId,
        paymentStatus: 'PENDING',
      },
      select: {
        id: true,
        type: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Inscriptions aux événements nécessitant un paiement
    const pendingEventRegistrations = await prisma.eventRegistration.findMany({
      where: {
        userId,
        requiresPayment: true,
        paymentId: null, // Pas encore payé
      },
      select: {
        id: true,
        eventId: true,
        eventTitle: true,
        paymentAmount: true,
        numberOfAdults: true,
        numberOfChildren: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 3. Inscriptions aux activités avec paiement en attente ou en attente d'approbation
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        OR: [
          // En attente d'approbation
          { status: 'PENDING' },
          // Approuvé avec paiement en attente
          {
            status: 'APPROVED',
            requiresPayment: true,
            paymentId: null,
          },
        ],
      },
      select: {
        id: true,
        activityId: true,
        activityTitle: true,
        status: true,
        requiresPayment: true,
        paymentAmount: true,
        paymentToken: true,
        paymentExpiresAt: true,
        createdAt: true,
        child: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Notifications de paiement en attente (non lues)
    const paymentNotifications = await prisma.notification.findMany({
      where: {
        userId,
        type: {
          in: ['PAYMENT_PENDING', 'MEMBERSHIP_PENDING_PAYMENT', 'ENROLLMENT_PAYMENT_PENDING', 'EVENT_PAYMENT_PENDING'],
        },
        read: false,
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      memberships: pendingMemberships,
      events: pendingEventRegistrations,
      enrollments: pendingEnrollments,
      notifications: paymentNotifications,
    })
  } catch (error) {
    console.error('Erreur récupération paiements en attente:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
