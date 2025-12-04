/**
 * API Route: Webhook Stripe
 *
 * ⚠️ SÉCURITÉ CRITIQUE:
 * - Vérifie la signature Stripe pour authentifier les événements
 * - Utilise le raw body (pas JSON) pour la vérification
 * - Enregistre les dons confirmés dans la base de données
 * - Lie automatiquement le don au compte utilisateur si l'email existe
 * - Envoie un email de confirmation avec reçu PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { hash } from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text() // RAW body pour vérification signature
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('❌ Webhook: Signature manquante')
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET non configuré dans .env')
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    // 🔒 VÉRIFICATION DE LA SIGNATURE STRIPE
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('❌ Webhook signature invalide:', err.message)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Traiter les événements
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        // 🔍 Identifier le type de paiement
        const paymentType = metadata.type || 'DONATION' // Par défaut: donation

        console.log('📥 Webhook reçu - Type:', paymentType, 'Session:', session.id)

        // Router vers le bon handler selon le type
        if (paymentType === 'EVENT_REGISTRATION') {
          await handleEventRegistrationPayment(session, metadata)
        } else if (paymentType === 'ACTIVITY_ENROLLMENT') {
          await handleActivityEnrollmentPayment(session, metadata)
        } else if (paymentType === 'MEMBERSHIP') {
          await handleMembershipPayment(session, metadata)
        } else if (paymentType === 'DONATION') {
          await handleDonationPayment(session, metadata)
        } else {
          console.warn('⚠️  Type de paiement non géré:', paymentType)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('❌ Paiement échoué:', paymentIntent.id)
        break
      }

      default:
        console.log(`ℹ️  Événement non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erreur traitement webhook:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * Traiter le paiement d'une inscription à un événement
 */
async function handleEventRegistrationPayment(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  console.log('🎟️  Traitement inscription événement:', metadata.eventId)

  // 1. Rechercher l'utilisateur par email
  const email = metadata.contactEmail || session.customer_email || ''
  let userId: string | null = metadata.userId || null

  if (!userId && email) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true }
      })
      if (existingUser) {
        userId = existingUser.id
        console.log('✅ Utilisateur trouvé:', email)
      }
    } catch (error) {
      console.log('⚠️  Erreur recherche utilisateur:', error)
    }
  }

  // 2. Créer le Payment
  const isSubscription = session.mode === 'subscription'
  const payment = await prisma.payment.create({
    data: {
      ...(userId ? { user: { connect: { id: userId } } } : {}),
      eventId: metadata.eventId,
      amount: (session.amount_total || 0) / 100,
      currency: 'CHF',
      status: 'COMPLETED',
      stripeCheckoutId: session.id,
      stripePaymentId: session.payment_intent as string || null,
      stripeSubscriptionId: session.subscription as string || null,
      paidAt: new Date(),
      metadata: {
        type: 'EVENT_REGISTRATION',
        eventTitle: metadata.eventTitle,
        participationType: metadata.participationType,
        paymentType: metadata.paymentType || 'ONE_TIME',
        isSubscription,
      }
    }
  })

  console.log('💰 Payment créé:', payment.id, '-', payment.amount, 'CHF', isSubscription ? '(ABONNEMENT)' : '(UNIQUE)')

  // 3. Vérifier si une inscription existante doit être mise à jour
  let registration

  if (metadata.registrationId) {
    // Mettre à jour l'inscription existante
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: { id: metadata.registrationId }
    })

    if (existingRegistration) {
      registration = await prisma.eventRegistration.update({
        where: { id: metadata.registrationId },
        data: {
          status: 'CONFIRMED',
          paymentId: payment.id,
          ...(userId && !existingRegistration.userId ? { userId } : {}),
        }
      })
      console.log('📝 Inscription mise à jour:', registration.id, '- Statut: CONFIRMED')
    }
  }

  // Si pas d'inscription existante, en créer une nouvelle (rétrocompatibilité)
  if (!registration) {
    const [firstName = '', ...lastNameParts] = (metadata.contactName || '').split(' ')
    const lastName = lastNameParts.join(' ') || firstName
    const participants = metadata.participants ? JSON.parse(metadata.participants) : null

    registration = await prisma.eventRegistration.create({
      data: {
        ...(userId ? { user: { connect: { id: userId } } } : {}),
        ...(metadata.childId ? { child: { connect: { id: metadata.childId } } } : {}),
        eventId: metadata.eventId,
        eventTitle: metadata.eventTitle,
        participationType: metadata.participationType,
        numberOfAdults: parseInt(metadata.numberOfAdults || '1'),
        numberOfChildren: parseInt(metadata.numberOfChildren || '0'),
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: metadata.contactPhone,
        attendees: parseInt(metadata.totalAttendees || '1'),
        participants,
        status: 'CONFIRMED',
        requiresPayment: true,
        paymentAmount: payment.amount,
        payment: { connect: { id: payment.id } }
      }
    })
    console.log('📝 Nouvelle inscription créée:', registration.id, '- Statut: CONFIRMED')
  }

  // 4. Créer une notification pour le membre
  if (userId) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'EVENT_CONFIRMATION',
        title: isSubscription ? 'Abonnement confirmé' : 'Paiement confirmé',
        message: `Votre ${isSubscription ? 'abonnement' : 'paiement'} pour "${metadata.eventTitle}" a été confirmé. Votre inscription est validée.`,
        link: '/membre/evenements',
        read: false,
        emailSent: true
      }
    })
    console.log('📬 Notification de paiement créée pour:', email)
  }

  // 5. Envoyer email de confirmation au participant
  try {
    const { sendEventRegistrationConfirmation } = await import('@/lib/email')

    await sendEventRegistrationConfirmation({
      email: registration.email,
      firstName: registration.firstName,
      lastName: registration.lastName,
      eventTitle: metadata.eventTitle,
      eventDate: metadata.eventDate,
      participationType: metadata.participationType,
      numberOfAdults: registration.numberOfAdults,
      numberOfChildren: registration.numberOfChildren,
      amount: payment.amount,
      registrationId: registration.id,
      hasAccount: !!userId,
    })

    console.log('📧 Email de confirmation envoyé à:', email)
  } catch (emailError) {
    console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
  }

  // 6. Notifier le responsable de l'événement que le paiement a été reçu
  try {
    const { getEventById } = await import('@/lib/directus')
    const event = await getEventById(metadata.eventId)

    if (event?.manager_email) {
      const { sendPaymentReceivedToManager } = await import('@/lib/email')

      await sendPaymentReceivedToManager({
        managerEmail: event.manager_email,
        eventTitle: metadata.eventTitle,
        eventId: metadata.eventId,
        participantName: `${registration.firstName} ${registration.lastName}`,
        participantEmail: registration.email,
        amount: payment.amount,
        registrationId: registration.id,
      })

      // Créer une notification pour le responsable s'il a un compte
      const managerUser = await prisma.user.findFirst({
        where: { email: event.manager_email },
        select: { id: true }
      })

      if (managerUser) {
        await prisma.notification.create({
          data: {
            userId: managerUser.id,
            type: 'EVENT_PAYMENT_RECEIVED',
            title: 'Paiement reçu',
            message: `${registration.firstName} ${registration.lastName} a payé ${payment.amount} CHF pour "${metadata.eventTitle}".`,
            link: `/admin/evenements-gestion/${metadata.eventId}`,
            read: false,
            emailSent: true,
          }
        })
      }

      console.log('📧 Notification de paiement envoyée au responsable:', event.manager_email)
    }
  } catch (managerError) {
    console.error('⚠️  Erreur notification responsable (non bloquant):', managerError)
  }
}

/**
 * Traiter le paiement d'une inscription à une activité
 */
async function handleActivityEnrollmentPayment(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  console.log('📚 Traitement inscription activité:', metadata.enrollmentId)

  // 1. Récupérer l'inscription
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: metadata.enrollmentId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      child: { select: { id: true, firstName: true, lastName: true } }
    }
  })

  if (!enrollment) {
    console.error('❌ Enrollment not found:', metadata.enrollmentId)
    return
  }

  // 2. Créer le Payment
  const payment = await prisma.payment.create({
    data: {
      ...(enrollment.userId ? { user: { connect: { id: enrollment.userId } } } : {}),
      enrollmentId: enrollment.id,
      amount: (session.amount_total || 0) / 100,
      currency: 'CHF',
      status: 'COMPLETED',
      stripeCheckoutId: session.id,
      stripePaymentId: session.payment_intent as string || null,
      paidAt: new Date(),
      metadata: {
        type: 'ACTIVITY_ENROLLMENT',
        activityTitle: metadata.activityTitle,
        participantName: metadata.participantName,
        participantType: metadata.participantType,
      }
    }
  })

  console.log('💰 Payment créé:', payment.id, '-', payment.amount, 'CHF')

  // 3. Mettre à jour l'inscription
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: 'ACTIVE', // Activé après paiement
      paymentId: payment.id,
      paymentToken: null, // Invalider le token
      paymentExpiresAt: null,
    }
  })

  console.log('✅ Enrollment mise à jour: ACTIVE')

  // 4. Créer une notification pour le membre
  if (enrollment.userId) {
    const participantName = enrollment.child
      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
      : `${enrollment.user?.firstName || ''} ${enrollment.user?.lastName || ''}`

    await prisma.notification.create({
      data: {
        userId: enrollment.userId,
        type: 'ENROLLMENT_PAYMENT_CONFIRMED',
        title: 'Paiement confirmé',
        message: `Le paiement pour l'inscription de ${participantName} à "${metadata.activityTitle}" a été confirmé. L'inscription est maintenant active.`,
        link: '/membre/inscriptions',
        read: false,
        emailSent: true
      }
    })

    console.log('📬 Notification de paiement créée pour:', enrollment.user?.email)
  }

  // 5. Envoyer email de confirmation
  try {
    const { sendEnrollmentPaymentConfirmation } = await import('@/lib/email')

    const participantName = enrollment.child
      ? `${enrollment.child.firstName} ${enrollment.child.lastName}`
      : `${enrollment.user?.firstName || ''} ${enrollment.user?.lastName || ''}`

    await sendEnrollmentPaymentConfirmation({
      email: enrollment.user?.email || '',
      firstName: enrollment.user?.firstName || '',
      activityTitle: metadata.activityTitle,
      participantName,
      amount: payment.amount,
      enrollmentId: enrollment.id,
    })

    console.log('📧 Email de confirmation envoyé à:', enrollment.user?.email)
  } catch (emailError) {
    console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
  }
}

/**
 * Traiter le paiement d'un don (code existant refactorisé)
 */
async function handleDonationPayment(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  console.log('💝 Traitement don:', metadata.projectId)

  const {
    projectId,
    projectTitle,
    donorName,
    donorEmail,
  } = metadata

  // Vérifier les données obligatoires
  if (!session.amount_total || !projectId || !projectTitle) {
    console.error('❌ Données manquantes dans session Stripe:', session.id)
    return
  }

  // Séparer prénom et nom
  const [firstName = '', lastName = ''] = (donorName || 'Anonyme').split(' ')
  const email = donorEmail || session.customer_email || 'inconnu@example.com'

  // 🔍 Rechercher si un utilisateur existe avec cet email
  let userId: string | null = null
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, firstName: true, lastName: true }
    })

    if (existingUser) {
      userId = existingUser.id
      console.log('✅ Utilisateur trouvé, don lié au compte:', existingUser.firstName, existingUser.lastName)
    } else {
      console.log('ℹ️  Aucun compte utilisateur pour cet email:', email)
    }
  } catch (userError) {
    console.log('⚠️  Erreur recherche utilisateur:', userError)
  }

  // 💾 Enregistrer le don dans la base de données
  const donation = await prisma.donation.create({
    data: {
      // Lier au compte utilisateur si trouvé
      ...(userId ? { user: { connect: { id: userId } } } : {}),
      firstName,
      lastName: lastName || firstName,
      email,
      phone: session.customer_details?.phone || null,
      amount: session.amount_total / 100, // Convertir centimes en CHF
      type: 'PROJECT',
      projectId,
      projectName: projectTitle,
      message: null,
      anonymous: false,
      stripeSessionId: session.id, // Enregistrer l'ID de session Stripe
      receiptSent: false, // Sera mis à true après envoi de l'email
    },
  })

  console.log('✅ Don enregistré:', donation.id, '-', donation.amount, 'CHF', userId ? '(lié au compte)' : '(email seul)')

  // 📧 Envoyer l'email de confirmation avec reçu
  try {
    const { sendDonationReceipt } = await import('@/lib/email')

    await sendDonationReceipt({
      id: donation.id,
      firstName: donation.firstName,
      lastName: donation.lastName,
      email: donation.email,
      amount: donation.amount,
      projectName: donation.projectName,
      createdAt: donation.createdAt,
      userId: donation.userId,
    })

    // Marquer le reçu comme envoyé
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        receiptSent: true,
        receiptSentAt: new Date(),
      },
    })

    console.log('📧 Email de confirmation envoyé à:', email)
  } catch (emailError) {
    console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
    // L'erreur d'email ne bloque pas le webhook
  }
}

/**
 * Traiter le paiement d'une cotisation (membership)
 */
async function handleMembershipPayment(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  console.log('💳 Traitement cotisation:', metadata.requestId)

  const request = await prisma.membershipRequest.findUnique({
    where: { id: metadata.requestId }
  })

  if (!request) {
    console.error('❌ MembershipRequest not found:', metadata.requestId)
    return
  }

  // 1. Rechercher ou créer l'utilisateur
  let user = await prisma.user.findUnique({
    where: { email: request.email.toLowerCase() }
  })

  const isNewUser = !user

  if (!user) {
    const tempPassword = crypto.randomBytes(16).toString('hex')
    const hashedPassword = await hash(tempPassword, 12)

    user = await prisma.user.create({
      data: {
        email: request.email.toLowerCase(),
        password: hashedPassword,
        firstName: request.firstName,
        lastName: request.lastName,
        phone: request.phone,
        address: `${request.address}, ${request.postalCode} ${request.city}, ${request.country}`,
        role: 'MEMBER'
      }
    })
    console.log('✅ Nouvel utilisateur créé:', user.email)
  } else {
    console.log('ℹ️  Utilisateur existant:', user.email)
  }

  // 2. Créer le Membership
  const startDate = new Date(request.desiredStartDate)
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 1)

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      type: request.membershipType as any,
      status: 'ACTIVE',
      paymentStatus: 'PAID',
      amount: 120,
      startDate,
      endDate,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string || null,
      receiptSent: false
    }
  })

  console.log('✅ Membership créé:', membership.id, '-', membership.type)

  // 3. Créer une notification pour le membre
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'MEMBERSHIP_CONFIRMED',
      title: 'Cotisation confirmée',
      message: `Votre cotisation ${membership.type === 'ACTIF' ? 'Membre Actif' : 'Membre Passif'} a été confirmée. Valide jusqu'au ${endDate.toLocaleDateString('fr-FR')}.`,
      link: '/membre/cotisation',
      read: false,
      emailSent: true // L'email de bienvenue sera envoyé
    }
  })

  console.log('📬 Notification de cotisation créée pour:', user.email)

  // 4. Créer le Payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      amount: 120,
      currency: 'CHF',
      status: 'COMPLETED',
      stripeCheckoutId: session.id,
      stripePaymentId: session.payment_intent as string || null,
      paidAt: new Date(),
      metadata: {
        type: 'MEMBERSHIP',
        membershipType: request.membershipType,
        requestId: request.id
      }
    }
  })

  // 4. Mettre à jour la demande
  await prisma.membershipRequest.update({
    where: { id: request.id },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
      membershipId: membership.id,
      userId: user.id,
      stripeSessionId: session.id
    }
  })

  console.log('✅ MembershipRequest mise à jour: COMPLETED')

  // 5. Envoyer email de bienvenue
  try {
    const { sendMembershipWelcome } = await import('@/lib/email')
    await sendMembershipWelcome({
      email: user.email,
      firstName: user.firstName,
      membershipType: request.membershipType,
      startDate,
      endDate,
      isNewAccount: isNewUser
    })

    // Marquer le reçu comme envoyé
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        receiptSent: true,
        receiptSentAt: new Date()
      }
    })

    console.log('📧 Email de bienvenue envoyé à:', user.email)
  } catch (emailError) {
    console.error('⚠️  Erreur envoi email (non bloquant):', emailError)
  }
}
