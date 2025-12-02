/**
 * API Route: Créer une notification de test
 * Utilisé pour tester le système de notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { type } = body

    let notificationData: any = {
      userId: session.user.id,
      read: false,
      emailSent: false,
    }

    // Créer différents types de notifications selon le type demandé
    switch (type) {
      case 'MEMBERSHIP_PENDING_PAYMENT':
        notificationData = {
          ...notificationData,
          type: 'MEMBERSHIP_PENDING_PAYMENT',
          title: 'Paiement de cotisation en attente',
          message: 'Votre demande d\'adhésion a été approuvée. Veuillez procéder au paiement de votre cotisation (120 CHF).',
          link: '/adhesion/payer/test-token',
        }
        break

      case 'MEMBERSHIP_CONFIRMED':
        notificationData = {
          ...notificationData,
          type: 'MEMBERSHIP_CONFIRMED',
          title: 'Cotisation confirmée',
          message: 'Votre cotisation Membre Actif a été confirmée. Valide jusqu\'au 01/12/2026.',
          link: '/membre/cotisation',
        }
        break

      case 'MEMBERSHIP_EXPIRING_SOON':
        notificationData = {
          ...notificationData,
          type: 'MEMBERSHIP_EXPIRING_SOON',
          title: 'Cotisation expire bientôt',
          message: 'Votre cotisation expire dans 30 jours. Pensez à la renouveler pour continuer à profiter de vos avantages.',
          link: '/membre/cotisation',
        }
        break

      case 'DONATION_CONFIRMED':
        notificationData = {
          ...notificationData,
          type: 'DONATION_CONFIRMED',
          title: 'Don confirmé',
          message: 'Merci pour votre don de 50 CHF. Votre reçu est disponible.',
          link: '/membre/dons',
        }
        break

      case 'EVENT_CONFIRMATION':
        notificationData = {
          ...notificationData,
          type: 'EVENT_CONFIRMATION',
          title: 'Inscription à l\'événement confirmée',
          message: 'Votre inscription à l\'événement "Iftar Communautaire" a été confirmée.',
          link: '/membre/evenements',
        }
        break

      case 'ENROLLMENT_APPROVED':
        notificationData = {
          ...notificationData,
          type: 'ENROLLMENT_APPROVED',
          title: 'Inscription approuvée',
          message: 'Votre inscription au cours "Coran pour adultes" a été approuvée.',
          link: '/membre/inscriptions',
        }
        break

      default:
        notificationData = {
          ...notificationData,
          type: 'SYSTEM',
          title: 'Notification de test',
          message: 'Ceci est une notification de test du système.',
          link: '/membre/dashboard',
        }
    }

    const notification = await prisma.notification.create({
      data: notificationData,
    })

    console.log('🔔 Notification de test créée:', notification.id, '-', notification.type)

    return NextResponse.json({
      success: true,
      notification,
      message: `Notification ${type || 'SYSTEM'} créée avec succès`,
    })
  } catch (error: any) {
    console.error('❌ Erreur création notification test:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
