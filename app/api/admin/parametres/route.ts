/**
 * API Route: Gestion des paramètres de la mosquée
 *
 * GET - Récupérer tous les paramètres
 * PUT - Mettre à jour les paramètres + enregistrer l'historique
 *
 * Accès: ADMIN uniquement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSettings, updateMosqueSettings, MosqueSettings } from '@/lib/settings'
import { invalidateSettingsCache } from '@/lib/settings'

// Rôles autorisés pour gérer les paramètres
const ADMIN_ROLES = ['ADMIN', 'IMAM', 'STAFF', 'MANAGER']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les paramètres
    const settings = await getSettings()

    if (!settings) {
      return NextResponse.json(
        { error: 'Paramètres non trouvés' },
        { status: 404 }
      )
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID des paramètres requis' },
        { status: 400 }
      )
    }

    // Récupérer les anciens paramètres pour l'historique
    const oldSettings = await getSettings()

    if (!oldSettings) {
      return NextResponse.json(
        { error: 'Paramètres actuels non trouvés' },
        { status: 404 }
      )
    }

    // Enregistrer l'historique des modifications
    const changedBy = session.user.email || 'admin@unknown'
    const historyEntries: {
      settingKey: string
      oldValue: string | null
      newValue: string | null
      changedBy: string
    }[] = []

    // Comparer chaque champ modifié
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = (oldSettings as any)[key]

      // Ne créer une entrée que si la valeur a changé
      if (String(oldValue ?? '') !== String(newValue ?? '')) {
        historyEntries.push({
          settingKey: key,
          oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : null,
          newValue: newValue !== undefined && newValue !== null ? String(newValue) : null,
          changedBy,
        })
      }
    }

    // Mettre à jour les paramètres
    const updatedSettings = await updateMosqueSettings(id, updates)

    if (!updatedSettings) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour des paramètres' },
        { status: 500 }
      )
    }

    // Enregistrer l'historique dans PostgreSQL (si des changements)
    if (historyEntries.length > 0) {
      await prisma.settingsHistory.createMany({
        data: historyEntries,
      })
    }

    // Invalider le cache des settings
    invalidateSettingsCache()

    return NextResponse.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      settings: updatedSettings,
      changesCount: historyEntries.length,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    )
  }
}
