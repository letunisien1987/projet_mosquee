import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { to, toName, subject, message, originalMessage } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Template HTML pour la réponse
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Mosquée Madretsch</h1>
                    <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Association Musulmane de Bienne</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #374151; margin: 0 0 20px 0;">Assalamu alaikum ${toName},</p>

                    <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>

                    ${originalMessage ? `
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">Message original :</p>
                        <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 15px; color: #4b5563; font-size: 14px; white-space: pre-wrap;">${originalMessage}</div>
                      </div>
                    ` : ''}

                    <p style="color: #374151; margin: 30px 0 0 0;">
                      Barakallahou fikoum,<br>
                      L'équipe de la Mosquée Madretsch
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      Mosquée Madretsch<br>
                      Rue Centrale 49, 2503 Bienne<br>
                      <a href="mailto:info@mosquee-madretsch.ch" style="color: #059669; text-decoration: none;">info@mosquee-madretsch.ch</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Envoyer l'email via Resend
    const result = await sendEmail({
      to,
      subject,
      html: htmlContent
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email envoyé avec succès' })
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
