/**
 * API Route: Approuver une demande d'adhésion et envoyer le lien de paiement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendMembershipApproved } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const requestId = id

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

    // Générer un token unique pour le paiement (valide 7 jours)
    const paymentToken = randomBytes(32).toString('hex')
    const paymentExpiresAt = new Date()
    paymentExpiresAt.setDate(paymentExpiresAt.getDate() + 7)

    // Mettre à jour la demande
    const updatedRequest = await prisma.membershipRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        paymentToken,
        paymentExpiresAt,
        paymentLinkSentAt: new Date(),
      },
    })

    console.log('✅ Demande approuvée:', updatedRequest.id)

    // Envoyer l'email avec le lien de paiement
    const paymentUrl = `${process.env.NEXTAUTH_URL}/adhesion/payer/${paymentToken}`

    try {
      await sendMembershipApproved({
        email: updatedRequest.email,
        firstName: updatedRequest.firstName,
        membershipType: updatedRequest.membershipType,
        amount: 120,
        paymentUrl,
        expiresAt: paymentExpiresAt,
      })
      console.log('📧 Email d\'approbation envoyé à:', updatedRequest.email)
    } catch (emailError) {
      console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Demande approuvée et email envoyé',
      paymentToken,
      paymentUrl,
    })
  } catch (error: any) {
    console.error('❌ Erreur approbation demande:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
