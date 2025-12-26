/**
 * API Route: Historique des modifications des paramètres
 *
 * GET - Récupérer les dernières modifications
 *
 * Accès: ADMIN uniquement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Labels lisibles pour les clés de paramètres
const SETTING_LABELS: Record<string, string> = {
  name: 'Nom',
  description: 'Description',
  address_street: 'Rue',
  address_city: 'Ville',
  address_postal_code: 'Code postal',
  address_country: 'Pays',
  contact_email: 'Email de contact',
  contact_phone: 'Téléphone principal',
  contact_phone2: 'Téléphone secondaire',
  donation_email: 'Email dons',
  bank_iban: 'IBAN',
  bank_bic: 'BIC',
  bank_account_holder: 'Titulaire du compte',
  bank_name: 'Nom de la banque',
  twint: 'Numéro TWINT',
  social_facebook: 'Facebook',
  social_instagram: 'Instagram',
  social_youtube: 'YouTube',
  social_twitter: 'Twitter',
  opening_hours: 'Horaires d\'ouverture',
  capacity: 'Capacité',
  membership_monthly_price: 'Cotisation mensuelle',
  membership_annual_price: 'Cotisation annuelle',
  membership_full_price: 'Montant adhésion',
}

// Rôles autorisés pour voir l'historique des paramètres
const ADMIN_ROLES = ['ADMIN', 'IMAM', 'STAFF', 'MANAGER']

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Récupérer l'historique
    const [history, total] = await Promise.all([
      prisma.settingsHistory.findMany({
        orderBy: { changedAt: 'desc' },
        take: Math.min(limit, 100), // Max 100 par requête
        skip: offset,
      }),
      prisma.settingsHistory.count(),
    ])

    // Enrichir avec les labels
    const enrichedHistory = history.map((entry) => ({
      ...entry,
      settingLabel: SETTING_LABELS[entry.settingKey] || entry.settingKey,
    }))

    return NextResponse.json({
      history: enrichedHistory,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
