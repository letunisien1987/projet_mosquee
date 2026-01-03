/**
 * API Membre: Offres de l'organisateur
 * GET /api/membre/organisateur/offerings - Liste les offres dont l'utilisateur est responsable
 * POST /api/membre/organisateur/offerings - Créer une nouvelle offre
 */

import { NextRequest, NextResponse } from 'next/server'

// Désactiver le cache Next.js pour toujours avoir des données fraîches
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingsByManager, createOffering, Offering } from '@/lib/content'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer les offres dont l'utilisateur est responsable
    const offerings = await getOfferingsByManager(user.id)

    // Si aucune offre par ID, essayer par email
    let allOfferings = offerings
    if (offerings.length === 0 && user.email) {
      // Importer la fonction pour chercher par email
      const { getAllOfferings } = await import('@/lib/content')
      const all = await getAllOfferings()
      allOfferings = all.filter(
        (o) => o.managerEmail?.toLowerCase() === user.email?.toLowerCase()
      )
    }

    // Enrichir avec les stats d'inscriptions
    const offeringsWithStats = await Promise.all(
      allOfferings.map(async (offering: Offering) => {
        let stats = {
          pending: 0,
          approved: 0,
          confirmed: 0,
          active: 0,
          cancelled: 0,
          total: 0,
        }

        if (offering.itemType === 'EVENT') {
          // Stats pour les événements
          const registrations = await prisma.eventRegistration.findMany({
            where: { eventId: offering.id.toString() },
            select: { status: true },
          })

          stats.pending = registrations.filter((r) => r.status === 'PENDING').length
          stats.approved = registrations.filter((r) => r.status === 'PENDING_PAYMENT').length
          stats.confirmed = registrations.filter((r) => r.status === 'CONFIRMED').length
          stats.cancelled = registrations.filter((r) => r.status === 'CANCELLED').length
          stats.total = registrations.length
        } else {
          // Stats pour les activités
          const enrollments = await prisma.enrollment.findMany({
            where: { activityId: offering.id.toString() },
            select: { status: true },
          })

          stats.pending = enrollments.filter((e) => e.status === 'PENDING').length
          stats.approved = enrollments.filter((e) => e.status === 'APPROVED').length
          stats.active = enrollments.filter((e) => e.status === 'ACTIVE').length
          stats.cancelled = enrollments.filter((e) => e.status === 'REJECTED').length
          stats.total = enrollments.length
        }

        return {
          id: offering.id,
          itemType: offering.itemType,
          title: offering.title,
          slug: offering.slug,
          category: offering.category,
          date: offering.date,
          schedule: offering.schedule,
          price: offering.price,
          maxCapacity: offering.maxCapacity,
          requiresApproval: offering.requiresApproval,
          published: offering.published,
          registrationCount: stats.total,
          stats,
        }
      })
    )

    return NextResponse.json({
      offerings: offeringsWithStats,
      counts: {
        total: offeringsWithStats.length,
        events: offeringsWithStats.filter((o) => o.itemType === 'EVENT').length,
        activities: offeringsWithStats.filter((o) => o.itemType === 'ACTIVITY').length,
      },
    })
  } catch (error) {
    console.error('Erreur GET /api/membre/organisateur/offerings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle offre
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const body = await request.json()

    // Accepter camelCase OU snake_case pour itemType
    const itemType = body.itemType ?? body.item_type

    // Validation basique
    if (!body.title || !itemType || !body.category) {
      return NextResponse.json(
        { error: 'Titre, type et catégorie sont requis' },
        { status: 400 }
      )
    }

    // Générer le slug si non fourni (garder le slug original sans timestamp)
    const slug = body.slug || body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Préparer les données pour la création - TOUS les champs du formulaire
    const offeringData: any = {
      // Champs de base
      itemType: itemType,
      title: body.title,
      slug: slug, // Garder le slug original (sans timestamp)
      description: body.description || '',
      content: body.content || '', // Contenu détaillé
      category: body.category,

      // Capacité & Inscription
      maxCapacity: body.maxCapacity || null,
      registrationRequired: body.registrationRequired ?? true, // Respecter le choix utilisateur
      requiresApproval: body.requiresApproval || false,
      published: body.published || false,
      featured: body.featured || false, // Mise en avant

      // Paiement
      price: body.price || 0,
      paymentType: body.paymentType || 'FREE',
      subscriptionInterval: body.subscriptionInterval || null, // Intervalle abonnement
      pricing: body.pricing || null, // Tarification avancée

      // Remboursement
      allowRefund: body.allowRefund ?? true,
      cancellationDeadlineDays: body.cancellationDeadlineDays || 7,

      // Responsable (forcé pour sécurité)
      managerId: user.id,
      managerEmail: user.email,

      // Contact organisateur
      showOrganizerName: body.showOrganizerName || false,
      showOrganizerEmail: body.showOrganizerEmail || false,
      showOrganizerPhone: body.showOrganizerPhone || false,
    }

    // Champs spécifiques événement
    if (itemType === 'EVENT') {
      offeringData.date = body.date
      offeringData.startTime = body.startTime
      offeringData.endTime = body.endTime
      offeringData.location = body.location
      offeringData.registrationDeadline = body.registrationDeadline
    }

    // Champs spécifiques activité
    if (itemType === 'ACTIVITY') {
      offeringData.activityCategory = body.activityCategory // Catégorie d'activité
      offeringData.schedule = body.schedule
      offeringData.scheduleRules = body.scheduleRules // Règles de planning
      offeringData.enrollmentOpen = body.enrollmentOpen ?? true
      offeringData.active = body.published || false
    }

    // Restrictions (complètes avec participationType)
    if (body.restrictions?.enabled) {
      offeringData.restrictions = {
        enabled: true,
        participationType: body.restrictions.participationType || 'INDIVIDUAL', // Type de participation
        allowedGender: body.restrictions.allowedGender || 'ALL',
        minAge: body.restrictions.minAge || null,
        maxAge: body.restrictions.maxAge || null,
      }
    }

    // Créer l'offre dans la base de données
    const offering = await createOffering(offeringData)

    if (!offering) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${itemType === 'EVENT' ? 'Événement' : 'Activité'} créé(e) avec succès`,
      offering,
    })
  } catch (error) {
    console.error('Erreur POST /api/membre/organisateur/offerings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
