/**
 * API Cron : Expirer automatiquement les cotisations périmées
 * À appeler quotidiennement via un cron job
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret pour sécuriser l'endpoint
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date()

    // Trouver toutes les cotisations actives dont la date de fin est dépassée
    const expiredMemberships = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now, // Less than (inférieur à) la date actuelle
        },
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

    console.log(`🔄 Vérification des cotisations expirées...`)
    console.log(`📊 ${expiredMemberships.length} cotisation(s) à expirer`)

    if (expiredMemberships.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune cotisation à expirer',
        expired: 0,
      })
    }

    // Expirer les cotisations
    const result = await prisma.membership.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    // Log des cotisations expirées
    for (const membership of expiredMemberships) {
      console.log(
        `   ✓ ${membership.user.email} - Cotisation ${membership.type} expirée (fin: ${membership.endDate.toLocaleDateString('fr-FR')})`
      )
    }

    console.log(`✅ ${result.count} cotisation(s) expirée(s) automatiquement`)
    console.log(`   → Les membres sont maintenant des "membres normaux"`)

    return NextResponse.json({
      success: true,
      message: `${result.count} cotisation(s) expirée(s)`,
      expired: result.count,
      memberships: expiredMemberships.map(m => ({
        email: m.user.email,
        type: m.type,
        endDate: m.endDate,
      })),
    })
  } catch (error: any) {
    console.error('❌ Erreur expiration automatique:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
