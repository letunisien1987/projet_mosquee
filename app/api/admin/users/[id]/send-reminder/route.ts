/**
 * API Route: Envoyer un rappel de cotisation à un utilisateur
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const userId = id

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'EXPIRED' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier qu'il a bien une cotisation expirée
    if (user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'Aucune cotisation expirée trouvée' },
        { status: 400 }
      )
    }

    const expiredMembership = user.memberships[0]

    // Envoyer l'email de rappel
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Rappel de renouvellement de cotisation</h2>

        <p>Bonjour ${user.firstName},</p>

        <p>Nous avons remarqué que votre cotisation a expiré le ${new Date(expiredMembership.endDate).toLocaleDateString('fr-FR')}.</p>

        <p>Pour continuer à bénéficier de tous les avantages de votre adhésion à la mosquée, nous vous invitons à renouveler votre cotisation.</p>

        <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #991B1B;">Comment renouveler ?</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Rendez-vous sur <a href="${process.env.NEXTAUTH_URL}/devenir-membre" style="color: #DC2626;">notre formulaire d'adhésion</a></li>
            <li>Remplissez la demande de renouvellement</li>
            <li>Attendez l'approbation (sous 48-72h)</li>
            <li>Effectuez le paiement via le lien sécurisé que vous recevrez par email</li>
          </ol>
        </div>

        <p>Le montant de la cotisation annuelle est de <strong>120 CHF</strong>.</p>

        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

        <p>Cordialement,<br>
        <strong>Mosquée Madretsch</strong></p>

        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

        <p style="font-size: 12px; color: #6B7280;">
          Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
        </p>
      </div>
    `

    await resend.emails.send({
      from: 'Mosquée Madretsch <noreply@mosquee-madretsch.ch>',
      to: user.email,
      subject: 'Rappel de renouvellement de cotisation',
      html: emailHtml,
    })

    console.log(`📧 Rappel de cotisation envoyé à: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Rappel envoyé avec succès',
    })
  } catch (error: any) {
    console.error('❌ Erreur envoi rappel:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
