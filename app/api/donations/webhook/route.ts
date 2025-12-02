import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Webhook RaiseNow pour recevoir les données de dons
 *
 * Configuration dans RaiseNow:
 * 1. Allez dans votre dashboard RaiseNow
 * 2. Settings → Webhooks
 * 3. Ajoutez l'URL: https://votre-domaine.com/api/donations/webhook
 * 4. Sélectionnez l'événement: "Payment Completed"
 * 5. Copiez le secret pour RAISENOW_WEBHOOK_SECRET
 */

export async function POST(req: NextRequest) {
  try {
    // Récupérer la signature du webhook (si configuré)
    const signature = req.headers.get('x-raisenow-signature')
    const webhookSecret = process.env.RAISENOW_WEBHOOK_SECRET

    // Vérifier la signature si le secret est configuré
    if (webhookSecret && signature) {
      // TODO: Vérifier la signature HMAC
      // const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      // }
    }

    const data = await req.json()

    console.log('\n╔══════════════════════════════════════════════════════════╗')
    console.log('║       📩 WEBHOOK RAISENOW REÇU - DONNÉES DU DON        ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')
    console.log('📅 Date/Heure:', new Date().toLocaleString('fr-FR'))
    console.log('\n💰 MONTANT ET DEVISE:')
    console.log('   Montant:', data.amount, data.currency || 'CHF')
    console.log('\n👤 INFORMATIONS DONATEUR:')
    console.log('   Nom complet:', `${data.stored_customer_firstname || ''} ${data.stored_customer_lastname || ''}`)
    console.log('   Email:', data.stored_customer_email)
    console.log('   Téléphone:', data.stored_customer_phone || 'Non fourni')
    console.log('\n🏠 ADRESSE:')
    console.log('   Rue:', data.stored_customer_street || 'Non fourni')
    console.log('   Code postal:', data.stored_customer_zip_code || 'Non fourni')
    console.log('   Ville:', data.stored_customer_city || 'Non fourni')
    console.log('   Pays:', data.stored_customer_country || 'Non fourni')
    console.log('\n💳 PAIEMENT:')
    console.log('   Méthode:', data.payment_method || 'Non spécifié')
    console.log('   ID Transaction:', data.epp_transaction_id)
    console.log('   Projet (code):', data.purpose || 'Don général')
    console.log('   Langue:', data.language || 'fr')
    console.log('   Mode test:', data.test_mode ? 'OUI' : 'NON')
    console.log('\n📦 DONNÉES COMPLÈTES (JSON):')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n═══════════════════════════════════════════════════════════\n')

    // Extraire les données du don
    const {
      epp_transaction_id,      // ID unique de la transaction
      amount,                  // Montant du don
      currency,                // Devise (CHF, EUR, etc.)
      stored_customer_firstname,
      stored_customer_lastname,
      stored_customer_email,
      stored_customer_street,
      stored_customer_zip_code,
      stored_customer_city,
      stored_customer_country,
      stored_customer_phone,
      purpose,                 // Objectif du don (project code)
      payment_method,          // Moyen de paiement
      language,
      test_mode,
    } = data

    // Vérifier si le don existe déjà (éviter les doublons)
    const existingDonation = await prisma.donation.findUnique({
      where: { transactionId: epp_transaction_id }
    })

    if (existingDonation) {
      console.log('⚠️  Don déjà enregistré:', epp_transaction_id)
      return NextResponse.json({
        success: true,
        message: 'Donation already recorded'
      })
    }

    // Créer le don dans la base de données
    const donation = await prisma.donation.create({
      data: {
        amount: parseFloat(amount),
        currency: currency || 'CHF',
        donorName: `${stored_customer_firstname || ''} ${stored_customer_lastname || ''}`.trim(),
        donorEmail: stored_customer_email,
        donorPhone: stored_customer_phone,
        donorAddress: stored_customer_street,
        donorCity: stored_customer_city,
        donorPostalCode: stored_customer_zip_code,
        donorCountry: stored_customer_country,
        projectId: purpose || null, // Code du projet RaiseNow
        transactionId: epp_transaction_id,
        paymentMethod: payment_method || 'raisenow',
        status: 'completed',
        isRecurring: false, // À adapter selon vos besoins
        notes: `Don via RaiseNow (${payment_method}). Langue: ${language}. ${test_mode ? 'MODE TEST' : ''}`,
      }
    })

    console.log('✅ Don enregistré:', donation.id)

    // TODO: Envoyer un email de confirmation au donateur
    // TODO: Mettre à jour le montant collecté dans le projet Directus

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      message: 'Donation recorded successfully'
    })

  } catch (error) {
    console.error('❌ Erreur webhook RaiseNow:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET pour vérifier que le webhook est actif
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'RaiseNow webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
}
