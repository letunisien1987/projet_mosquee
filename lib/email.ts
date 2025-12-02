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
                <td style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 30px 20px; text-align: center;">
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
                    <a href="mailto:info@mosquee-madretsch.ch" style="color: #DC2626; text-decoration: none;">info@mosquee-madretsch.ch</a>
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
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">Bienvenue ${firstName}!</h2>

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
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
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
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
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
      <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
        <p style="color: #991B1B; margin: 0; font-size: 14px;">
          ✅ Votre inscription est confirmée ! Vous pouvez commencer à participer à l'activité.
        </p>
      </div>
    `}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/inscriptions"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
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
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">Inscription confirmée</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre inscription à l'événement <strong>"${eventTitle}"</strong> a été confirmée.
    </p>

    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="color: #374151; margin: 0 0 10px 0; font-weight: 600;">📅 Date de l'événement :</p>
      <p style="color: #DC2626; margin: 0; font-size: 18px; font-weight: 600;">${eventDate}</p>
    </div>

    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        ✅ Votre place est réservée. Nous avons hâte de vous voir !
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/evenements"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
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
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">Merci pour votre don</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons bien reçu votre don de <strong>${amount.toFixed(2)} CHF</strong> ${projectName ? `pour le projet <strong>"${projectName}"</strong>` : ''}.
    </p>

    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Montant du don</p>
      <p style="color: #DC2626; margin: 0; font-size: 32px; font-weight: 700;">${amount.toFixed(2)} CHF</p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre générosité contribue directement au développement et à la pérennité de notre mosquée et de ses activités.
    </p>

    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
      <p style="color: #991B1B; margin: 0; font-size: 14px; line-height: 1.6;">
        💚 Qu'Allah accepte votre don et vous récompense pour votre générosité.<br>
        <em>"L'exemple de ceux qui dépensent leurs biens dans le sentier d'Allah est semblable à une graine d'où naissent sept épis, à cent grains l'épi." (Sourate Al-Baqara, 2:261)</em>
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/dons"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
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
 * Email de reçu de don avec détails complets (pour les dons Stripe)
 * Inclut la référence du don, la date, et un message personnalisé selon le statut du compte
 */
export async function sendDonationReceipt(donation: {
  id: string
  firstName: string
  lastName: string
  email: string
  amount: number
  projectName: string | null
  createdAt: Date
  userId: string | null
}) {
  const donorName = `${donation.firstName} ${donation.lastName}`
  const amount = donation.amount.toFixed(2)
  const date = new Date(donation.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  const hasAccount = !!donation.userId

  const content = `
    <h2 style="color: #DC2626; margin: 0 0 10px 0;">Jazak Allah Khayran !</h2>
    <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px;">Que Dieu vous récompense de la meilleure des manières</p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Cher(e) ${donorName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons bien reçu votre généreux don et vous en remercions sincèrement. Votre contribution permet de soutenir les activités de notre mosquée et de notre communauté.
    </p>

    <!-- Détails du don -->
    <div style="background: #ffffff; border: 2px solid #EF4444; border-radius: 8px; padding: 25px; margin: 25px 0;">
      <h3 style="margin: 0 0 20px 0; color: #DC2626; font-size: 18px; text-align: center;">📋 Reçu de don</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Montant :</td>
          <td style="padding: 12px 0; text-align: right; color: #DC2626; font-size: 24px; font-weight: 700;">${amount} CHF</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Date :</td>
          <td style="padding: 12px 0; text-align: right; color: #374151;">${date}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Projet :</td>
          <td style="padding: 12px 0; text-align: right; color: #374151;">${donation.projectName || 'Don général'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Référence :</td>
          <td style="padding: 12px 0; text-align: right; color: #6b7280; font-family: monospace; font-size: 11px;">${donation.id}</td>
        </tr>
      </table>
    </div>

    <!-- Citation coranique -->
    <div style="background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%); color: white; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0; font-style: italic; font-size: 14px; line-height: 1.8;">
        « L'exemple de ceux qui dépensent leurs biens dans le sentier d'Allah est semblable à une graine d'où naissent sept épis, à cent grains l'épi. »
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.9;">Sourate Al-Baqara (2:261)</p>
    </div>

    <!-- Informations compte membre -->
    <div style="background: ${hasAccount ? '#EFF6FF' : '#FEF3C7'}; border: 1px solid ${hasAccount ? '#BFDBFE' : '#FDE68A'}; padding: 20px; margin: 25px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: ${hasAccount ? '#1E40AF' : '#92400E'}; font-size: 16px;">💡 ${hasAccount ? 'Votre espace membre' : 'Le saviez-vous ?'}</h3>
      <p style="margin: 0; color: ${hasAccount ? '#1E3A8A' : '#78350F'}; font-size: 14px; line-height: 1.6;">
        ${hasAccount
          ? 'Ce don est déjà enregistré dans votre espace membre. Vous pouvez consulter l\'historique de tous vos dons à tout moment.'
          : `Si vous créez un compte membre avec cet email (<strong>${donation.email}</strong>), vous retrouverez automatiquement ce don et tous vos futurs dons dans votre espace personnel.`
        }
      </p>
      ${hasAccount ? `
      <div style="text-align: center; margin-top: 15px;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/membre/dons"
           style="display: inline-block; background: #1E40AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Voir mes dons
        </a>
      </div>
      ` : `
      <div style="text-align: center; margin-top: 15px;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/membre/register"
           style="display: inline-block; background: #D97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Créer mon compte membre
        </a>
      </div>
      `}
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
      Qu'Allah accepte votre don et vous récompense pour votre générosité.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: donation.email,
    subject: `Reçu de don - ${amount} CHF - ${MOSQUE_NAME}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email d'annulation d'inscription à un événement
 */
export async function sendEventCancellationEmail(
  to: string,
  firstName: string,
  eventTitle: string
) {
  const content = `
    <h2 style="color: #dc2626; margin: 0 0 20px 0;">Inscription annulée</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre inscription à l'événement <strong>"${eventTitle}"</strong> a été annulée avec succès.
    </p>

    <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
      <p style="color: #991b1b; margin: 0; font-size: 14px;">
        ❌ Votre place a été libérée. Vous ne recevrez plus de notifications concernant cet événement.
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Vous pouvez toujours consulter les autres événements disponibles et vous inscrire de nouveau si vous changez d'avis.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/evenements"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir les événements
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Annulation d'inscription - ${eventTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de remerciement pour un don
 */
export async function sendDonationThankYouEmail(
  to: string,
  firstName: string,
  amount: number,
  donationType: string
) {
  const typeLabels: Record<string, string> = {
    ZAKAT: 'Zakat',
    SADAQA: 'Sadaqa',
    ZAKAT_AL_FITR: 'Zakat Al-Fitr',
    PROJECT: 'Projet',
    MEMBERSHIP: 'Cotisation'
  }

  const content = `
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">Qu'Allah accepte votre don</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous vous remercions chaleureusement pour votre don de <strong>${amount.toFixed(2)} CHF</strong> (${typeLabels[donationType] || donationType}).
    </p>

    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Montant du don</p>
      <p style="color: #DC2626; margin: 0; font-size: 32px; font-weight: 700;">${amount.toFixed(2)} CHF</p>
      <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">${typeLabels[donationType] || donationType}</p>
    </div>

    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
      <p style="color: #991B1B; margin: 0; font-size: 14px; line-height: 1.6;">
        💚 Qu'Allah vous récompense pour votre générosité et accepte votre don.<br><br>
        <em>"L'exemple de ceux qui dépensent leurs biens dans le sentier d'Allah est semblable à une graine d'où naissent sept épis, à cent grains l'épi. Car Allah multiplie la récompense à qui Il veut." (Sourate Al-Baqara, 2:261)</em>
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre générosité contribue directement au développement et à la pérennité de notre mosquée et de ses activités.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/dons"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir mes dons
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Merci pour votre don - ${MOSQUE_NAME}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation de demande de service
 */
export async function sendServiceRequestConfirmationEmail(
  to: string,
  firstName: string,
  serviceType: string
) {
  const serviceLabels: Record<string, string> = {
    MARRIAGE: 'Mariage',
    FUNERAL: 'Funérailles',
    SHAHADA: 'Shahada',
    AQIQA: 'Aqiqa'
  }

  const content = `
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">Demande de service reçue</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons bien reçu votre demande de service : <strong>${serviceLabels[serviceType] || serviceType}</strong>.
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        ⏳ Votre demande est en cours de traitement. Un responsable de la mosquée vous contactera dans les plus brefs délais pour discuter des détails et organiser le service.
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Si vous avez des questions urgentes, n'hésitez pas à nous contacter directement par téléphone.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/dashboard"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir mon espace membre
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Demande de service reçue - ${serviceLabels[serviceType] || serviceType}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation de message de contact
 */
export async function sendContactMessageConfirmationEmail(
  to: string,
  firstName: string
) {
  const content = `
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">Message bien reçu</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.
    </p>

    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        ✅ Notre équipe traitera votre demande dans les plus brefs délais. Nous vous répondrons généralement sous 48 heures.
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      En attendant, vous pouvez consulter notre site web pour plus d'informations sur nos activités et services.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Visiter le site
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to,
    subject: `Message reçu - ${MOSQUE_NAME}`,
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
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">${title}</h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      ${message}
    </p>

    ${ctaText && ctaLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${ctaLink}"
           style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
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

/**
 * Email de confirmation d'inscription à un événement payant
 */
export async function sendEventRegistrationConfirmation(data: {
  email: string
  firstName: string
  lastName: string
  eventTitle: string
  eventDate?: string
  participationType: string
  numberOfAdults: number
  numberOfChildren: number
  amount: number
  registrationId: string
  hasAccount: boolean
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'À confirmer'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const participantsText = () => {
    if (data.participationType === 'INDIVIDUAL') {
      return '1 participant adulte'
    } else if (data.participationType === 'CHILD') {
      return '1 participant enfant'
    } else {
      return `${data.numberOfAdults} adulte(s) et ${data.numberOfChildren} enfant(s)`
    }
  }

  const content = `
    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #B91C1C; margin: 0 0 10px 0; font-size: 18px;">
        ✅ Inscription confirmée
      </h3>
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        Votre paiement a été reçu avec succès.
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      ${data.eventTitle}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons le plaisir de confirmer votre inscription à l'événement <strong>${data.eventTitle}</strong>.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Détails de l'inscription</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 50%;">📅 Date</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${formatDate(data.eventDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">👥 Participants</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${participantsText()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">💰 Montant payé</td>
          <td style="padding: 8px 0; color: #DC2626; font-weight: 700; font-size: 16px;">${data.amount.toFixed(2)} CHF</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🎫 N° d'inscription</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px; font-family: monospace;">${data.registrationId.slice(0, 8).toUpperCase()}</td>
        </tr>
      </table>
    </div>

    ${data.hasAccount ? `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
        <p style="color: #1e40af; margin: 0; font-size: 14px;">
          ℹ️ Cette inscription est enregistrée dans votre espace membre. Vous pouvez la consulter à tout moment.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/membre/evenements"
           style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          Voir mes inscriptions
        </a>
      </div>
    ` : `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
        <p style="color: #92400e; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
          💡 Créez votre espace membre
        </p>
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          Créez un compte avec cette adresse email (<strong>${data.email}</strong>) pour retrouver automatiquement cette inscription et gérer vos activités en ligne.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL}/inscription"
           style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          Créer mon compte
        </a>
      </div>
    `}

    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
        📧 <strong>Un email de rappel vous sera envoyé quelques jours avant l'événement.</strong>
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
        Si vous avez des questions, n'hésitez pas à nous contacter.
      </p>
    </div>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0 0 0;">
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
        "Et vous êtes une communauté qui invite au bien" (Coran 3:110)
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah accepte votre participation.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `✅ Inscription confirmée - ${data.eventTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation de réception de demande d'adhésion
 */
export async function sendMembershipApplicationReceived(data: {
  email: string
  firstName: string
  membershipType: string
}) {
  const membershipTypeLabel = data.membershipType === 'ACTIF'
    ? 'Membre Actif (avec droit de vote)'
    : 'Membre Passif'

  const content = `
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
        📬 Demande bien reçue
      </h3>
      <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
        Votre demande d'adhésion est en cours de traitement.
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      Demande d'adhésion à ${MOSQUE_NAME}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons bien reçu votre demande d'adhésion en tant que <strong>${membershipTypeLabel}</strong> et nous vous en remercions.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Prochaines étapes</h3>
      <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
        <li>Notre équipe va examiner votre demande</li>
        <li>Vous recevrez une réponse par email sous 3 à 5 jours ouvrables</li>
        <li>Si votre demande est approuvée, vous recevrez un lien de paiement sécurisé</li>
        <li>Après paiement, votre compte membre sera activé immédiatement</li>
      </ol>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        ⏳ <strong>Pas d'action requise de votre part pour le moment.</strong><br>
        Nous vous contacterons dès que votre demande aura été examinée.
      </p>
    </div>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0 0 0;">
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
        "La meilleure des gens est celle qui est la plus utile aux gens" (Hadith)
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `Demande d'adhésion reçue - ${MOSQUE_NAME}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email d'approbation de demande d'adhésion avec lien de paiement
 */
export async function sendMembershipApproved(data: {
  email: string
  firstName: string
  membershipType: string
  amount: number
  paymentUrl: string
  expiresAt: Date
}) {
  const membershipTypeLabel = data.membershipType === 'ACTIF'
    ? 'Membre Actif (avec droit de vote)'
    : 'Membre Passif'

  const expirationDate = new Date(data.expiresAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const content = `
    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #B91C1C; margin: 0 0 10px 0; font-size: 18px;">
        ✅ Demande approuvée
      </h3>
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        Félicitations ! Votre demande d'adhésion a été acceptée.
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      Bienvenue à ${MOSQUE_NAME} !
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons le plaisir de vous informer que votre demande d'adhésion en tant que <strong>${membershipTypeLabel}</strong> a été approuvée.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">💳 Finaliser votre adhésion</h3>

      <p style="color: #374151; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
        Pour activer votre compte membre, il ne reste plus qu'à régler la cotisation annuelle de <strong>${data.amount} CHF</strong>.
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${data.paymentUrl}"
           style="background-color: #DC2626; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">
          💳 Payer en ligne (${data.amount} CHF)
        </a>
      </div>

      <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px; text-align: center;">
        Paiement 100% sécurisé via Stripe
      </p>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
      <p style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
        ⏰ Lien valide jusqu'au ${expirationDate}
      </p>
      <p style="color: #92400e; margin: 0; font-size: 13px;">
        Ce lien de paiement expirera dans <strong>7 jours</strong>. Passé ce délai, vous devrez soumettre une nouvelle demande.
      </p>
    </div>

    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">🎁 Ce que vous obtenez</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
        <li>Accès complet à toutes les activités de la mosquée</li>
        <li>Participation aux événements exclusifs membres</li>
        <li>Espace membre en ligne pour gérer vos inscriptions</li>
        <li>Historique de vos dons et attestations fiscales</li>
        ${data.membershipType === 'ACTIF' ? '<li><strong>Droit de vote aux assemblées générales</strong></li>' : ''}
      </ul>
    </div>

    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
        📧 Après votre paiement, vous recevrez immédiatement :
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
        <li>Confirmation par email avec reçu</li>
        <li>Accès à votre espace membre en ligne</li>
        <li>Vos identifiants de connexion</li>
      </ul>
    </div>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0 0 0;">
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
        "Les croyants, dans l'amour, l'affection et la miséricorde qu'ils se portent, sont comparables à un seul corps" (Hadith)
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous récompense pour votre engagement.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `✅ Demande approuvée - Finalisez votre adhésion`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de refus de demande d'adhésion (diplomatique)
 */
export async function sendMembershipRejected(data: {
  email: string
  firstName: string
  reason: string
}) {
  const content = `
    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      Suite à votre demande d'adhésion
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous vous remercions pour l'intérêt que vous portez à ${MOSQUE_NAME}.
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Après examen attentif de votre demande d'adhésion, nous ne sommes malheureusement pas en mesure de donner une suite favorable à votre demande pour la raison suivante :
    </p>

    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
      <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.6;">
        ${data.reason}
      </p>
    </div>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Cette décision n'affecte en rien votre possibilité de :
    </p>

    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #374151; line-height: 1.8;">
      <li>Participer aux prières et événements publics de la mosquée</li>
      <li>Assister aux cours et conférences ouverts à tous</li>
      <li>Contribuer par vos dons et votre bénévolat</li>
      <li>Faire partie de notre communauté</li>
    </ul>

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;">
        ℹ️ Si vous souhaitez discuter de cette décision ou obtenir plus d'informations, n'hésitez pas à nous contacter directement.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/contact"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Nous contacter
      </a>
    </div>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0 0 0;">
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center;">
        "Allah n'impose à aucune âme une charge supérieure à sa capacité" (Coran 2:286)
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous facilite votre chemin.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `Suite à votre demande d'adhésion - ${MOSQUE_NAME}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de bienvenue après paiement de cotisation
 */
export async function sendMembershipWelcome(data: {
  email: string
  firstName: string
  membershipType: string
  startDate: Date
  endDate: Date
  isNewAccount: boolean
}) {
  const membershipTypeLabel = data.membershipType === 'ACTIF'
    ? 'Membre Actif'
    : 'Membre Passif'

  const startDateFormatted = new Date(data.startDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const endDateFormatted = new Date(data.endDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const content = `
    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #B91C1C; margin: 0 0 10px 0; font-size: 20px;">
        🎉 Bienvenue dans la famille !
      </h3>
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        Votre adhésion a été activée avec succès.
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      Bienvenue à ${MOSQUE_NAME}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous sommes heureux de vous accueillir officiellement en tant que <strong>${membershipTypeLabel}</strong> de ${MOSQUE_NAME}.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Détails de votre adhésion</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 50%;">Type d'adhésion</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${membershipTypeLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date de début</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${startDateFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valide jusqu'au</td>
          <td style="padding: 8px 0; color: #DC2626; font-weight: 700; font-size: 14px;">${endDateFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Statut</td>
          <td style="padding: 8px 0; color: #DC2626; font-weight: 700; font-size: 14px;">✅ ACTIF</td>
        </tr>
      </table>
    </div>

    ${data.isNewAccount ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
        <p style="color: #92400e; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
          🔑 Votre compte en ligne a été créé
        </p>
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          Un compte membre a été automatiquement créé avec votre adresse email. Utilisez la fonction "Mot de passe oublié" pour définir votre mot de passe et accéder à votre espace.
        </p>
      </div>
    ` : ''}

    <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">🌟 Vos avantages membres</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
        <li>Accès à toutes les activités et cours de la mosquée</li>
        <li>Participation aux événements exclusifs membres</li>
        <li>Espace membre en ligne pour vos inscriptions</li>
        <li>Historique de vos dons et attestations fiscales</li>
        <li>Newsletter et informations privilégiées</li>
        ${data.membershipType === 'ACTIF' ? '<li><strong>Droit de vote aux assemblées générales</strong></li>' : ''}
        ${data.membershipType === 'ACTIF' ? '<li><strong>Éligibilité au conseil d\'administration</strong></li>' : ''}
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/dashboard"
         style="background-color: #DC2626; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">
        Accéder à mon espace membre
      </a>
    </div>

    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📧 Prochaines étapes</h3>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
        <li>Connectez-vous à votre espace membre</li>
        <li>Complétez votre profil si nécessaire</li>
        <li>Inscrivez-vous aux activités qui vous intéressent</li>
        <li>Consultez le calendrier des événements</li>
        <li>Rejoignez nos groupes WhatsApp/Telegram (liens dans votre espace)</li>
      </ul>
    </div>

    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0 0 0; text-align: center;">
      <p style="color: #DC2626; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">
        "Les croyants ne sont que des frères"
      </p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Sourate Al-Hujurat (49:10)
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous récompense pour votre engagement et facilite votre chemin.<br>
      Barakallahou fikoum.
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
        En cas de question, contactez-nous à <a href="mailto:info@mosquee-madretsch.ch" style="color: #DC2626;">info@mosquee-madretsch.ch</a>
      </p>
    </div>
  `

  return sendEmail({
    to: data.email,
    subject: `🎉 Bienvenue - Votre adhésion est active !`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de demande de paiement pour une activité (après approbation)
 */
export async function sendEnrollmentPaymentRequest(data: {
  email: string
  firstName: string
  activityTitle: string
  participantName: string
  amount: number
  paymentUrl: string
  expiresAt: Date
}) {
  const expirationDate = new Date(data.expiresAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const content = `
    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #B91C1C; margin: 0 0 10px 0; font-size: 18px;">
        ✅ Inscription approuvée
      </h3>
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        Votre inscription a été validée ! Il ne reste plus qu'à finaliser le paiement.
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      ${data.activityTitle}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous avons le plaisir de vous informer que l'inscription de <strong>${data.participantName}</strong> à l'activité <strong>"${data.activityTitle}"</strong> a été approuvée.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">💳 Finaliser l'inscription</h3>

      <p style="color: #374151; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
        Pour activer l'inscription, il ne reste plus qu'à régler le montant de <strong>${data.amount.toFixed(2)} CHF</strong>.
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${data.paymentUrl}"
           style="background-color: #DC2626; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">
          💳 Payer en ligne (${data.amount.toFixed(2)} CHF)
        </a>
      </div>

      <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px; text-align: center;">
        Paiement 100% sécurisé via Stripe
      </p>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
      <p style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
        ⏰ Lien valide jusqu'au ${expirationDate}
      </p>
      <p style="color: #92400e; margin: 0; font-size: 13px;">
        Ce lien de paiement expirera dans <strong>7 jours</strong>. Passé ce délai, veuillez nous contacter.
      </p>
    </div>

    <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
        📧 Après votre paiement, vous recevrez une confirmation et l'inscription sera immédiatement activée.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous facilite.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `✅ Inscription approuvée - Finalisez le paiement pour "${data.activityTitle}"`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de confirmation de paiement pour une activité
 */
export async function sendEnrollmentPaymentConfirmation(data: {
  email: string
  firstName: string
  activityTitle: string
  participantName: string
  amount: number
  enrollmentId: string
}) {
  const content = `
    <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #B91C1C; margin: 0 0 10px 0; font-size: 18px;">
        🎉 Paiement confirmé
      </h3>
      <p style="color: #991B1B; margin: 0; font-size: 14px;">
        L'inscription est maintenant active !
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      ${data.activityTitle}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Nous confirmons la réception de votre paiement pour l'inscription de <strong>${data.participantName}</strong> à l'activité <strong>"${data.activityTitle}"</strong>.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Détails du paiement</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 50%;">Activité</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${data.activityTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Participant</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${data.participantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant payé</td>
          <td style="padding: 8px 0; color: #DC2626; font-weight: 700; font-size: 16px;">${data.amount.toFixed(2)} CHF</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">N° d'inscription</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px; font-family: monospace;">${data.enrollmentId.slice(0, 8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Statut</td>
          <td style="padding: 8px 0; color: #10B981; font-weight: 700; font-size: 14px;">✅ ACTIVE</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 0 0 25px 0; border-radius: 6px;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;">
        ℹ️ L'inscription est maintenant active. Le participant peut commencer à participer aux séances selon le calendrier de l'activité.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/inscriptions"
         style="background-color: #DC2626; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        Voir mes inscriptions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous facilite et bénisse votre participation.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `🎉 Paiement confirmé - ${data.activityTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Email de demande de paiement pour un événement
 */
export async function sendEventPaymentRequest(data: {
  email: string
  firstName: string
  eventTitle: string
  eventDate?: string
  participationType: string
  numberOfAdults: number
  numberOfChildren: number
  amount: number
  paymentUrl: string
  registrationId: string
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'À confirmer'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const participantsText = () => {
    if (data.participationType === 'INDIVIDUAL') {
      return '1 participant adulte'
    } else if (data.participationType === 'CHILD') {
      return '1 participant enfant'
    } else {
      return `${data.numberOfAdults} adulte(s) et ${data.numberOfChildren} enfant(s)`
    }
  }

  const content = `
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 30px 0; border-radius: 6px;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
        💳 Paiement en attente
      </h3>
      <p style="color: #1e3a8a; margin: 0; font-size: 14px;">
        Finalisez votre inscription en effectuant le paiement.
      </p>
    </div>

    <h2 style="color: #DC2626; margin: 0 0 20px 0;">
      ${data.eventTitle}
    </h2>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 15px 0;">
      Assalamu alaikum ${data.firstName},
    </p>

    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      Votre inscription à l'événement <strong>"${data.eventTitle}"</strong> est en attente de paiement.
    </p>

    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📋 Détails de l'inscription</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 50%;">📅 Date</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${formatDate(data.eventDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">👥 Participants</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: 600; font-size: 14px;">${participantsText()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">💰 Montant</td>
          <td style="padding: 8px 0; color: #DC2626; font-weight: 700; font-size: 16px;">${data.amount.toFixed(2)} CHF</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 25px 0;">
      <a href="${data.paymentUrl}"
         style="background-color: #DC2626; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">
        💳 Payer maintenant (${data.amount.toFixed(2)} CHF)
      </a>
    </div>

    <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 13px; text-align: center;">
      Paiement 100% sécurisé via Stripe
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        ⚠️ <strong>Important:</strong> Votre place n'est pas garantie tant que le paiement n'est pas effectué. Les places sont limitées.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous facilite.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: data.email,
    subject: `💳 Paiement en attente - ${data.eventTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Envoie un email de confirmation d'approbation d'inscription
 */
export async function sendEnrollmentApprovalEmail(
  email: string,
  firstName: string,
  activityTitle: string
) {
  const content = `
    <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">
      ✅ Inscription Confirmée
    </h2>

    <p style="font-size: 16px; margin-bottom: 15px;">
      Assalamu alaykum ${firstName},
    </p>

    <p style="font-size: 16px; margin-bottom: 15px;">
      Bonne nouvelle ! Votre inscription à <strong>${activityTitle}</strong> a été approuvée.
    </p>

    <div style="background-color: #ecfdf5; padding: 20px; border-radius: 10px; margin: 25px 0;">
      <p style="color: #065f46; font-size: 16px; margin: 0;">
        Vous pouvez maintenant participer à cette activité selon les horaires prévus.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/membre/inscriptions"
         style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                font-weight: bold; font-size: 16px;">
        Voir mes inscriptions
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous facilite dans votre apprentissage.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: email,
    subject: `✅ Inscription confirmée - ${activityTitle}`,
    html: getEmailTemplate(content),
  })
}

/**
 * Envoie un email de refus d'inscription
 */
export async function sendEnrollmentRejectionEmail(
  email: string,
  firstName: string,
  activityTitle: string,
  reason?: string
) {
  const content = `
    <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 20px;">
      Inscription non retenue
    </h2>

    <p style="font-size: 16px; margin-bottom: 15px;">
      Assalamu alaykum ${firstName},
    </p>

    <p style="font-size: 16px; margin-bottom: 15px;">
      Nous sommes au regret de vous informer que votre inscription à <strong>${activityTitle}</strong> n'a pas pu être retenue.
    </p>

    ${reason ? `
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #dc2626;">
      <p style="color: #991b1b; font-size: 14px; margin: 0;">
        <strong>Raison :</strong> ${reason}
      </p>
    </div>
    ` : ''}

    <p style="font-size: 16px; margin-bottom: 15px;">
      N'hésitez pas à nous contacter pour plus d'informations ou pour vous inscrire à d'autres activités.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXTAUTH_URL}/activites"
         style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                font-weight: bold; font-size: 16px;">
        Voir nos activités
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
      Qu'Allah vous facilite.<br>
      Barakallahou fikoum.
    </p>
  `

  return sendEmail({
    to: email,
    subject: `Inscription à ${activityTitle} - Réponse`,
    html: getEmailTemplate(content),
  })
}
