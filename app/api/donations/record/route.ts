import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API Route pour enregistrer les dons provenant de RaiseNow Tamaro
 * POST /api/donations/record
 */
export async function POST(request: NextRequest) {
  try {
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

    // Extraire firstName et lastName du donorName
    const nameParts = donorName ? donorName.split(' ') : ['Anonyme']
    const firstName = nameParts[0] || 'Anonyme'
    const lastName = nameParts.slice(1).join(' ') || ''

    // Déterminer le type de don basé sur le purpose
    const donationType = getDonationType(purpose)

    // Créer le don dans la base de données
    const donation = await prisma.donation.create({
      data: {
        amount: parseFloat(amount),
        firstName: firstName,
        lastName: lastName,
        email: donorEmail || 'noemail@example.com', // Email est requis dans le schéma
        phone: customFields?.phone || null,
        message: customFields?.message || null,
        type: donationType,
        projectId: purpose || null,
        projectName: getPurposeLabel(purpose),
        anonymous: !donorName || donorName === 'Anonyme',
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
