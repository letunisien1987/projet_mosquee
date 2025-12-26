/**
 * API Route: Soumission d'une demande d'adhésion
 *
 * Workflow:
 * 1. Valide les données du formulaire
 * 2. Vérifie qu'il n'y a pas de demande en cours
 * 3. Crée la demande avec statut PENDING
 * 4. Envoie email de confirmation au demandeur
 * 5. Notifie l'admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit'

// Rate limit: 3 demandes par minute par IP (plus strict car action critique)
const RATE_LIMIT_CONFIG = { maxRequests: 3, windowMs: 60000 }

const schema = z.object({
  membershipType: z.enum(['ACTIF', 'PASSIF', 'INDIVIDUAL', 'FAMILY', 'STUDENT', 'SENIOR']),
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone requis'),
  dateOfBirth: z.string().optional(),
  address: z.string().min(5, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  postalCode: z.string().min(4, 'Code postal requis'),
  country: z.string().default('Suisse'),
  desiredStartDate: z.string(),
  motivation: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Vérifier le rate limiting
    const clientIp = getClientIp(req)
    const rateLimitResult = checkRateLimit(`membership:${clientIp}`, RATE_LIMIT_CONFIG)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await req.json()
    const data = schema.parse(body)

    // Vérifier si email existe déjà avec demande en cours
    const existing = await prisma.membershipRequest.findFirst({
      where: {
        email: data.email.toLowerCase(),
        status: { in: ['PENDING', 'APPROVED', 'PAYMENT_SENT'] }
      }
    })

    if (existing) {
      return NextResponse.json(
        {
          error: 'Vous avez déjà une demande en cours',
          status: existing.status,
          requestId: existing.id
        },
        { status: 400 }
      )
    }

    // Créer la demande
    const request = await prisma.membershipRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        membershipType: data.membershipType as any,
        desiredStartDate: new Date(data.desiredStartDate),
        motivation: data.motivation || null,
        status: 'PENDING'
      }
    })

    console.log('✅ Demande d\'adhésion créée:', request.id, '-', data.email)

    // Envoyer email de confirmation au demandeur
    try {
      const { sendMembershipApplicationReceived } = await import('@/lib/email')
      await sendMembershipApplicationReceived({
        email: request.email,
        firstName: request.firstName,
        requestId: request.id
      })
      console.log('📧 Email de confirmation envoyé à:', request.email)
      // Attendre 600ms avant les notifications admin (rate limit Resend: 2/sec)
      await new Promise(resolve => setTimeout(resolve, 600))
    } catch (emailError) {
      console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
    }

    // Notifier tous les utilisateurs avec permission MANAGE_MEMBERSHIPS
    try {
      const { sendMembershipRequestNotificationToAdmin } = await import('@/lib/email')

      // Récupérer les rôles qui ont la permission MANAGE_MEMBERSHIPS
      const rolesWithPermission = await prisma.rolePermission.findMany({
        where: { permission: 'MANAGE_MEMBERSHIPS' },
        select: { role: true }
      })
      const authorizedRoles = rolesWithPermission.map(rp => rp.role)

      // ADMIN a toujours accès, ajouter si pas déjà présent
      if (!authorizedRoles.includes('ADMIN')) {
        authorizedRoles.push('ADMIN')
      }

      // Récupérer tous les utilisateurs avec ces rôles (qui ont un email)
      const allUsers = await prisma.user.findMany({
        where: {
          role: { in: authorizedRoles }
        },
        select: { email: true, firstName: true }
      })
      // Filtrer les utilisateurs avec email non null
      const usersToNotify = allUsers.filter(u => u.email !== null && u.email !== '')

      console.log(`📧 Envoi de notifications à ${usersToNotify.length} utilisateur(s) autorisé(s)`)

      // Envoyer un email à chaque utilisateur (avec délai pour éviter rate limit Resend)
      for (let i = 0; i < usersToNotify.length; i++) {
        const user = usersToNotify[i]
        if (user.email) {
          // Attendre 600ms entre chaque email pour respecter le rate limit (2/sec)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 600))
          }

          const result = await sendMembershipRequestNotificationToAdmin({
            adminEmail: user.email,
            firstName: request.firstName,
            lastName: request.lastName,
            email: request.email,
            phone: request.phone,
            membershipType: request.membershipType,
            createdAt: request.createdAt,
            requestId: request.id
          })

          if (result.success) {
            console.log('  ✅ Email envoyé à:', user.email)
          } else {
            console.log('  ⚠️ Échec envoi à:', user.email, result.error)
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Notification admin non envoyée:', error)
    }

    return NextResponse.json({
      success: true,
      requestId: request.id,
      message: 'Votre demande a été soumise avec succès'
    })

  } catch (error: any) {
    console.error('❌ Erreur soumission demande:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    )
  }
}
