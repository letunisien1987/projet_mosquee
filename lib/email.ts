import { Resend } from 'resend'

// Constantes
const MOSQUE_NAME = 'Mosquée Madretsch'

// Helper pour obtenir l'email FROM de façon dynamique
function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'noreply@mosquee-madretsch.ch'
}

// Lazy initialization de Resend pour supporter les scripts
let resend: Resend | null = null
function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

/**
 * Interface pour les données d'email
 */
interface EmailData {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Fonction générique pour envoyer un email
 */
export async function sendEmail(data: EmailData) {
  try {
    // Vérifier que Resend est configuré
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY non configurée - Email non envoyé')
      return { success: false, error: 'Email service not configured' }
    }

    const client = getResendClient()
    const emailData = {
      from: data.from || getFromEmail(),
      to: data.to,
      subject: data.subject,
      html: data.html,
    }

    console.log('📧 Envoi email depuis:', emailData.from, 'vers:', emailData.to)

    const result = await client.emails.send(emailData)

    console.log('✅ Email envoyé avec succès:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return { success: false, error }
  }
}

/**
 * Template de base pour les emails
 */
function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${MOSQUE_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${MOSQUE_NAME}</h1>
                  <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Association Musulmane de Bienne</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px;">
                    ${MOSQUE_NAME}<br>
                    Rue Centrale 49, 2503 Bienne<br>
                    <a href="mailto:info@mosquee-madretsch.ch" style="color: #059669; text-decoration: none;">info@mosquee-madretsch.ch</a>
                  </p>
                  <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 11px;">
                    Vous recevez cet email car vous êtes membre de notre mosquée.
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
}

/**
 * Email de bienvenue après inscription
 */
export async function sendWelcomeEmail(to: string, firstName: string) {
  const content = `
    <h2 style="color: #059669; margin: 0 0 20px 0;">Bienvenue ${firstName}!</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum,
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Votre compte a été créé avec succès sur l'espace membre de ${MOSQUE_NAME}.
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Vous pouvez maintenant :
    </p>

    <ul style="color: #374151; line-height: 1.8; margin: 0 0 20px 0;">
      <li>S'inscrire aux activités et cours</li>
      <li>Participer aux événements</li>
      <li>Faire des dons en ligne</li>
      <li>Consulter vos documents et attestations</li>
      <li>Gérer votre profil et préférences</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/dashboard"
         style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Accéder à mon espace
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous récompense pour votre engagement.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Bienvenue sur l'espace membre - ${MOSQUE_NAME}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation d'inscription à une activité
 */
export async function sendEnrollmentConfirmationEmail(
  to: string,
  firstName: string,
  activityTitle: string,
  status: 'PENDING' | 'ACTIVE'
) {
  const isPending = status === 'PENDING'

  const content = `
    <h2 style="color: #059669; margin: 0 0 20px 0;">
      ${isPending ? 'Inscription reçue' : 'Inscription confirmée'}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      ${isPending
        ? `Nous avons bien reçu votre demande d'inscription à l'activité <strong>"${activityTitle}"</strong>.`
        : `Votre inscription à l'activité <strong>"${activityTitle}"</strong> a été confirmée.`
      }
    </p>

    ${isPending ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          ⏳ Votre inscription est en attente de validation. Nous vous contacterons prochainement pour confirmer votre participation.
        </p>
      </div>
    ` : `
      <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
        <p style="color: #065f46; margin: 0; font-size: 14px;">
          ✅ Votre inscription est confirmée ! Vous pouvez commencer à participer à l'activité.
        </p>
      </div>
    `}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/inscriptions"
         style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir mes inscriptions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `${isPending ? 'Inscription reçue' : 'Inscription confirmée'} - ${activityTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation d'inscription à un événement
 */
export async function sendEventRegistrationEmail(
  to: string,
  firstName: string,
  eventTitle: string,
  eventDate: string
) {
  const content = `
    <h2 style="color: #059669; margin: 0 0 20px 0;">Inscription confirmée</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre inscription à l'événement <strong>"${eventTitle}"</strong> a été confirmée.
    </p>

    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="color: #374151; margin: 0 0 10px 0; font-weight: 600;">📅 Date de l'événement :</p>
      <p style="color: #059669; margin: 0; font-size: 18px; font-weight: 600;">${eventDate}</p>
    </div>

    <div style="background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
      <p style="color: #065f46; margin: 0; font-size: 14px;">
        ✅ Votre place est réservée. Nous avons hâte de vous voir !
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/evenements"
         style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir mes événements
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Inscription confirmée - ${eventTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation de don
 */
export async function sendDonationConfirmationEmail(
  to: string,
  firstName: string,
  amount: number,
  projectName?: string
) {
  const content = `
    <h2 style="color: #059669; margin: 0 0 20px 0;">Merci pour votre don</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons bien reçu votre don de <strong>${amount.toFixed(2)} CHF</strong> ${projectName ? `pour le projet <strong>"${projectName}"</strong>` : ''}.
    </p>

    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Montant du don</p>
      <p style="color: #059669; margin: 0; font-size: 32px; font-weight: 700;">${amount.toFixed(2)} CHF</p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre générosité contribue directement au développement et à la pérennité de notre mosquée et de ses activités.
    </p>

    <div style="background-color: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
      <p style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.6;">
        💚 Qu'Allah accepte votre don et vous récompense pour votre générosité.<br>
        <em>"L'exemple de ceux qui dépensent leurs biens dans le sentier d'Allah est semblable à une graine d'où naissent sept épis, à cent grains l'épi." (Sourate Al-Baqara, 2:261)</em>
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/dons"
         style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir mes dons
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Confirmation de don - ${MOSQUE_NAME}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de notification générique
 */
export async function sendNotificationEmail(
  to: string,
  firstName: string,
  title: string,
  message: string,
  ctaText?: string,
  ctaLink?: string
) {
  const content = `
    <h2 style="color: #059669; margin: 0 0 20px 0;">${title}</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      ${message}
    </p>

    ${ctaText && ctaLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${ctaLink}"
           style="background-color: #059669; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          ${ctaText}
        </a>
      </div>
    ` : ''}

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: title,
    html: getEmailTemplate(content),
  })
}
