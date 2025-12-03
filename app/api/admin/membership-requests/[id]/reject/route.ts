/**
 * API Route: Rejeter une demande d'adhésion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMembershipRejected } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().min(10, 'La raison doit contenir au moins 10 caractères'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const requestId = id
    const body = await req.json()
    const { reason } = schema.parse(body)

    // Récupérer la demande
    const request = await prisma.membershipRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cette demande a déjà été traitée' },
        { status: 400 }
      )
    }

    // Mettre à jour la demande
    const updatedRequest = await prisma.membershipRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    })

    console.log('❌ Demande rejetée:', updatedRequest.id)

    // Envoyer l'email de refus
    try {
      await sendMembershipRejected({
        email: updatedRequest.email,
        firstName: updatedRequest.firstName,
        reason,
      })
      console.log('📧 Email de refus envoyé à:', updatedRequest.email)
    } catch (emailError) {
      console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Demande rejetée et email envoyé',
    })
  } catch (error: any) {
    console.error('❌ Erreur refus demande:', error)

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
