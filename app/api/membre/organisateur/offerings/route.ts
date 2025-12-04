/**
 * API Membre: Offres de l'organisateur
 * GET /api/membre/organisateur/offerings - Liste les offres dont l'utilisateur est responsable
 * POST /api/membre/organisateur/offerings - Créer une nouvelle offre
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOfferingsByManager, createOffering, DirectusOffering } from '@/lib/directus'

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
      const { getAllOfferings } = await import('@/lib/directus')
      const all = await getAllOfferings()
      allOfferings = all.filter(
        (o) => o.manager_email?.toLowerCase() === user.email?.toLowerCase()
      )
    }

    // Enrichir avec les stats d'inscriptions
    const offeringsWithStats = await Promise.all(
      allOfferings.map(async (offering: DirectusOffering) => {
        let stats = {
          pending: 0,
          approved: 0,
          confirmed: 0,
          active: 0,
          cancelled: 0,
          total: 0,
        }

        if (offering.item_type === 'EVENT') {
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
          item_type: offering.item_type,
          title: offering.title,
          slug: offering.slug,
          category: offering.category,
          date: offering.date,
          schedule: offering.schedule,
          price: offering.price,
          max_capacity: offering.max_capacity,
          requires_approval: offering.requires_approval,
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
        events: offeringsWithStats.filter((o) => o.item_type === 'EVENT').length,
        activities: offeringsWithStats.filter((o) => o.item_type === 'ACTIVITY').length,
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

    // Validation basique
    if (!body.title || !body.item_type || !body.category) {
      return NextResponse.json(
        { error: 'Titre, type et catégorie sont requis' },
        { status: 400 }
      )
    }

    // Générer le slug si non fourni
    const slug = body.slug || body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Préparer les données pour Directus
    const offeringData: any = {
      item_type: body.item_type,
      title: body.title,
      slug: slug + '-' + Date.now(), // Ajouter timestamp pour unicité
      description: body.description || '',
      category: body.category,
      max_capacity: body.max_capacity || null,
      price: body.price || 0,
      payment_type: body.payment_type || 'FREE',
      requires_approval: body.requires_approval || false,
      published: body.published || false,
      manager_id: user.id,
      manager_email: user.email,
      registration_required: true,
    }

    // Champs spécifiques événement
    if (body.item_type === 'EVENT') {
      offeringData.date = body.date
      offeringData.start_time = body.start_time
      offeringData.end_time = body.end_time
      offeringData.location = body.location
      offeringData.registration_deadline = body.registration_deadline
    }

    // Champs spécifiques activité
    if (body.item_type === 'ACTIVITY') {
      offeringData.schedule = body.schedule
      offeringData.enrollment_open = body.enrollment_open ?? true
      offeringData.active = body.published || false
    }

    // Restrictions
    if (body.restrictions?.enabled) {
      offeringData.restrictions = {
        enabled: true,
        allowed_gender: body.restrictions.allowed_gender || 'ALL',
        min_age: body.restrictions.min_age || null,
        max_age: body.restrictions.max_age || null,
      }
    }

    // Créer l'offre dans Directus
    const offering = await createOffering(offeringData)

    if (!offering) {
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${body.item_type === 'EVENT' ? 'Événement' : 'Activité'} créé(e) avec succès`,
      offering,
    })
  } catch (error) {
    console.error('Erreur POST /api/membre/organisateur/offerings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
