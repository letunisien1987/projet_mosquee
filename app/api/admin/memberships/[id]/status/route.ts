/**
 * API Route: Modifier le statut d'une cotisation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'PENDING']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const membershipId = id
    const body = await req.json()
    const { status } = schema.parse(body)

    // Vérifier que la cotisation existe
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Cotisation non trouvée' }, { status: 404 })
    }

    // Mettre à jour le statut
    const updatedMembership = await prisma.membership.update({
      where: { id: membershipId },
      data: { status },
    })

    console.log(
      `✅ Statut de cotisation modifié pour ${membership.user.email}: ${membership.status} → ${status}`
    )

    return NextResponse.json({
      success: true,
      message: 'Statut modifié avec succès',
      membership: {
        id: updatedMembership.id,
        status: updatedMembership.status,
      },
    })
  } catch (error: any) {
    console.error('❌ Erreur modification statut:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
