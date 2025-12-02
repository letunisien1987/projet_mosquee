/**
 * API: Envoyer un email aux participants d'une activité
 * POST /api/membre/mes-activites/[activityId]/email
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isActivityManager, getActivityById } from '@/lib/directus'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const emailSchema = z.object({
  subject: z.string().min(1, 'Sujet requis'),
  message: z.string().min(1, 'Message requis'),
  recipients: z.enum(['all', 'active', 'pending', 'approved']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { activityId } = await params
    const userId = session.user.id

    // Vérifier que l'utilisateur est responsable de cette activité
    const isManager = await isActivityManager(activityId, userId)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas responsable de cette activité' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { subject, message, recipients } = emailSchema.parse(body)

    // Récupérer l'activité
    const activity = await getActivityById(activityId)
    if (!activity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    // Construire le filtre selon les destinataires
    const statusFilter: string[] = []
    switch (recipients) {
      case 'all':
        statusFilter.push('PENDING', 'APPROVED', 'ACTIVE')
        break
      case 'active':
        statusFilter.push('ACTIVE')
        break
      case 'pending':
        statusFilter.push('PENDING')
        break
      case 'approved':
        statusFilter.push('APPROVED')
        break
    }

    // Récupérer les inscriptions avec les emails
    const enrollments = await prisma.enrollment.findMany({
      where: {
        activityId: activityId.toString(),
        status: { in: statusFilter as any[] },
      },
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

    // Extraire les emails uniques
    const uniqueEmails = new Map<string, { email: string; firstName: string; lastName: string }>()
    enrollments.forEach((e) => {
      if (e.user?.email) {
        uniqueEmails.set(e.user.email, {
          email: e.user.email,
          firstName: e.user.firstName || '',
          lastName: e.user.lastName || '',
        })
      }
    })

    if (uniqueEmails.size === 0) {
      return NextResponse.json(
        { error: 'Aucun destinataire trouvé' },
        { status: 400 }
      )
    }

    // Récupérer les infos du sender (responsable)
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    })

    const senderName = `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim() || 'Responsable'

    // Envoyer les emails
    const results = await Promise.all(
      Array.from(uniqueEmails.values()).map(async (recipient) => {
        try {
          await resend.emails.send({
            from: `${senderName} via Mosquée <noreply@${process.env.RESEND_DOMAIN || 'mosquee.ch'}>`,
            replyTo: sender?.email || undefined,
            to: [recipient.email],
            subject: `[${activity.title}] ${subject}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${activity.title}</h1>
                  </div>

                  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                    <p>Bonjour ${recipient.firstName || 'cher(e) participant(e)'},</p>

                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>

                    <p style="color: #666; font-size: 14px;">
                      Cet email vous est envoyé par ${senderName}, responsable de l'activité "${activity.title}".
                    </p>
                  </div>

                  <div style="background: #1f2937; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                      Mosquée de Bienne - Message automatique
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          })
          return { email: recipient.email, success: true }
        } catch (error) {
          console.error(`Erreur envoi email à ${recipient.email}:`, error)
          return { email: recipient.email, success: false }
        }
      })
    )

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Email envoyé à ${successCount} destinataire(s)${failCount > 0 ? `, ${failCount} échec(s)` : ''}`,
      stats: {
        total: uniqueEmails.size,
        success: successCount,
        failed: failCount,
      },
    })
  } catch (error) {
    console.error('Erreur POST email:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
