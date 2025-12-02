import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email } = body

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #DC2626;">Confirmation de remboursement</h2>

      <p>Bonjour Ahmed,</p>

      <p>Nous vous confirmons que votre cotisation a été remboursée.</p>

      <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0;">Détails du remboursement</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Montant remboursé:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">120.00 CHF</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Type de cotisation:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">Membre Actif</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Période:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">
              01/12/2025 - 01/12/2026
            </td>
          </tr>
        </table>
      </div>

      <p>Le remboursement sera traité par Stripe et apparaîtra sur votre compte bancaire sous 5-10 jours ouvrables.</p>

      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

      <p>Cordialement,<br>
      <strong>Mosquée Madretsch</strong></p>

      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">

      <p style="font-size: 12px; color: #6B7280;">
        ID de remboursement Stripe: pyr_test_123456789 (TEST)
      </p>
    </div>
  `

  const emailResult = await sendEmail({
    to: email,
    subject: '✅ TEST - Confirmation de remboursement de cotisation',
    html: emailHtml,
  })

  if (emailResult.success) {
    return NextResponse.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      to: email,
    })
  } else {
    return NextResponse.json({
      success: false,
      error: emailResult.error,
    }, { status: 500 })
  }
}
