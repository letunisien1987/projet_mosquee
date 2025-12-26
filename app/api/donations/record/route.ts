import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limit: 10 dons par minute par IP (généreux pour les événements de collecte)
const RATE_LIMIT_CONFIG = { maxRequests: 10, windowMs: 60000 }

/**
 * API Route pour enregistrer les dons provenant de RaiseNow Tamaro
 * POST /api/donations/record
 *
 * Note: Tamaro appelle cette route côté client après un paiement réussi.
 * La sécurité repose sur:
 * - Rate limiting par IP
 * - Unicité du transactionId
 * - Validation des données
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`donation:${clientIp}`, RATE_LIMIT_CONFIG)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()

    const {
      amount,
      currency,
      purpose,
      transactionId,
      donorEmail,
      donorName,
      customFields,
      timestamp,
    } = body

    // Validation des données obligatoires
    if (!amount || !currency || !transactionId) {
      return NextResponse.json(
        { error: 'Données manquantes (amount, currency, transactionId requis)' },
        { status: 400 }
      )
    }

    // Validation du montant (doit être positif et raisonnable)
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000000) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité du transactionId pour éviter les doublons
    const existingDonation = await prisma.donation.findUnique({
      where: {
        transactionId: transactionId
      }
    })

    if (existingDonation) {
      // Transaction déjà enregistrée - retourner succès sans créer de doublon
      return NextResponse.json(
        { success: true, donationId: existingDonation.id, message: 'Don déjà enregistré' },
        { status: 200 }
      )
    }

    // Extraire firstName et lastName du donorName
    const nameParts = donorName ? donorName.split(' ') : ['Anonyme']
    const firstName = nameParts[0] || 'Anonyme'
    const lastName = nameParts.slice(1).join(' ') || ''

    // Déterminer le type de don basé sur le purpose
    const donationType = getDonationType(purpose)

    // Valider l'email si fourni
    const email = donorEmail && isValidEmail(donorEmail) ? donorEmail : null

    // Créer le don dans la base de données
    const donation = await prisma.donation.create({
      data: {
        amount: parsedAmount,
        firstName: firstName,
        lastName: lastName,
        email: email || 'anonyme@don.local', // Email technique pour les dons anonymes
        phone: customFields?.phone || null,
        message: customFields?.message || null,
        transactionId: transactionId, // ID de transaction externe (RaiseNow/Tamaro)
        type: donationType,
        projectId: purpose || null,
        projectName: getPurposeLabel(purpose),
        anonymous: !donorName || donorName === 'Anonyme' || !email,
      },
    })

    console.log('✅ Don enregistré avec succès:', donation.id)

    return NextResponse.json(
      {
        success: true,
        donationId: donation.id,
        message: 'Don enregistré avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du don:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur lors de l\'enregistrement du don',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

/**
 * Déterminer le type de don basé sur le purpose
 */
function getDonationType(purpose: string | undefined): 'ZAKAT' | 'SADAQA' | 'MEMBERSHIP' | 'PROJECT' {
  if (purpose === 'zakat') return 'ZAKAT'
  if (purpose === 'sadaqa') return 'SADAQA'
  if (purpose === 'general') return 'SADAQA'
  // Pour les projets spécifiques (renovation, education, ramadan)
  return 'PROJECT'
}

/**
 * Convertir l'ID du purpose en label lisible
 */
function getPurposeLabel(purpose: string | undefined): string {
  const purposes: Record<string, string> = {
    general: 'Don général',
    zakat: 'Zakat',
    sadaqa: 'Sadaqa',
    renovation: 'Rénovation mosquée',
    education: 'Éducation & Cours',
    ramadan: 'Campagne Ramadan',
  }

  return purposes[purpose || 'general'] || 'Don général'
}

/**
 * Valider le format email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
