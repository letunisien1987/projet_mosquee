/**
 * API Admin: Liste des inscriptions d'une offre
 * GET /api/admin/offerings/[id]/registrations - Liste des inscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingById } from '@/lib/content'
import { hasPermission } from '@/lib/permissions'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params

    // Récupérer l'offre
    const offering = await getOfferingById(id)
    if (!offering) {
      return NextResponse.json({ error: 'Offre non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions
    if (offering.itemType === 'EVENT') {
      const canView = await hasPermission(role, 'VIEW_EVENT_REGISTRATIONS')
      if (!canView) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
      }
    } else {
      const canView = await hasPermission(role, 'VIEW_ENROLLMENTS')
      if (!canView) {
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

    // Récupérer les inscriptions selon le type
    if (offering.itemType === 'EVENT') {
      const registrations = await prisma.eventRegistration.findMany({
        where: { eventId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          participationType: true,
          numberOfAdults: true,
          numberOfChildren: true,
          paymentAmount: true,
          paymentId: true,
          notes: true,
          createdAt: true,
        },
      })

      return NextResponse.json({ registrations, type: 'EVENT' })
    } else {
      // Activité - récupérer les enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { activityId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      // Formater pour avoir une interface cohérente
      const registrations = enrollments.map((e) => ({
        id: e.id,
        firstName: e.child?.firstName || e.user?.firstName || '',
        lastName: e.child?.lastName || e.user?.lastName || '',
        email: e.user?.email || '',
        phone: e.user?.phone || '',
        status: e.status,
        participationType: e.childId ? 'CHILD' : 'INDIVIDUAL',
        numberOfAdults: e.childId ? 0 : 1,
        numberOfChildren: e.childId ? 1 : 0,
        paymentAmount: e.paymentAmount,
        paymentId: e.paymentId,
        notes: null,
        createdAt: e.createdAt,
        isChild: !!e.childId,
        childId: e.childId,
        userId: e.userId,
      }))

      return NextResponse.json({ registrations, type: 'ACTIVITY' })
    }
  } catch (error) {
    console.error('Erreur GET registrations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
