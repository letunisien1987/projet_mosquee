import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getActivityById } from '@/lib/directus'
import { sendEnrollmentConfirmationEmail } from '@/lib/email'
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const enrollmentSchema = z.object({
  activityId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  notes: z.string().optional(),
  isForChild: z.boolean(),
  // Pour enfant existant (single)
  childId: z.string().uuid().optional(),
  // Pour plusieurs enfants existants (batch)
  childIds: z.array(z.string().uuid()).optional(),
  // Pour nouvel enfant
  childFirstName: z.string().optional(),
  childLastName: z.string().optional(),
  childBirthDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Données inscription reçues:', body)

    const validatedData = enrollmentSchema.parse(body)

    // Vérifier la session utilisateur
    const session = await getServerSession(authOptions)

    // Récupérer l'activité depuis Directus
    const activity = await getActivityById(validatedData.activityId)

    if (!activity) {
      console.log('❌ Activité non trouvée:', validatedData.activityId)
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

    console.log('✅ Activité trouvée:', activity.title, 'Prix:', activity.price, 'Approbation:', activity.requires_approval)

    // Récupérer ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      // Créer l'utilisateur avec un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-10)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          password: hashedPassword,
          role: 'MEMBER',
        },
      })
      console.log('👤 Nouvel utilisateur créé:', user.id)
    }

    // Déterminer le statut initial et si paiement requis
    const requiresPayment = activity.price && activity.price > 0
    const requiresApproval = activity.requires_approval

    let initialStatus: 'PENDING' | 'APPROVED' | 'ACTIVE' = 'PENDING'
    if (!requiresApproval) {
      if (requiresPayment) {
        initialStatus = 'APPROVED'
      } else {
        initialStatus = 'ACTIVE'
      }
    }

    // ========== MODE BATCH : plusieurs enfants ==========
    if (validatedData.childIds && validatedData.childIds.length > 0) {
      console.log('📝 Mode batch: inscription de', validatedData.childIds.length, 'enfants')

      // Vérifier que tous les enfants appartiennent à l'utilisateur
      const children = await prisma.child.findMany({
        where: {
          id: { in: validatedData.childIds },
          parentId: user.id,
        },
      })

      if (children.length !== validatedData.childIds.length) {
        return NextResponse.json(
          { error: 'Un ou plusieurs enfants non trouvés ou non autorisés' },
          { status: 400 }
        )
      }

      // Vérifier qu'aucun enfant n'est déjà inscrit
      const existingEnrollments = await prisma.enrollment.findMany({
        where: {
          activityId: validatedData.activityId,
          childId: { in: validatedData.childIds },
          status: { notIn: ['REJECTED'] },
        },
      })

      if (existingEnrollments.length > 0) {
        const alreadyEnrolled = children.filter(c =>
          existingEnrollments.some(e => e.childId === c.id)
        )
        return NextResponse.json(
          {
            error: 'Certains enfants sont déjà inscrits',
            alreadyEnrolled: alreadyEnrolled.map(c => `${c.firstName} ${c.lastName}`),
          },
          { status: 400 }
        )
      }

      // Créer une inscription par enfant
      const enrollments = await Promise.all(
        children.map(child =>
          prisma.enrollment.create({
            data: {
              activityId: validatedData.activityId,
              activityTitle: activity.title || 'Activité',
              userId: user!.id,
              childId: child.id,
              status: initialStatus,
              notes: validatedData.notes || null,
              requiresPayment: !!requiresPayment,
              paymentAmount: requiresPayment ? activity.price : null,
            },
          })
        )
      )

      console.log('📝 Inscriptions batch créées:', enrollments.length)

      // Créer une notification globale
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: initialStatus === 'PENDING' ? 'ENROLLMENT_CONFIRMATION' : 'ENROLLMENT_APPROVED',
          title: initialStatus === 'PENDING'
            ? 'Demandes d\'inscription reçues'
            : requiresPayment
              ? 'Inscriptions - Paiement requis'
              : 'Inscriptions confirmées',
          message: `${children.length} inscription(s) à "${activity.title}" ${
            initialStatus === 'PENDING' ? 'en attente de validation' :
            requiresPayment ? '- Paiement de ' + (activity.price! * children.length) + ' CHF requis' :
            'confirmée(s)'
          }`,
          link: requiresPayment ? '/membre/paiements' : '/membre/inscriptions',
          read: false,
          emailSent: true,
        },
      })

      // Envoyer l'email de confirmation
      const emailStatus = initialStatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
      await sendEnrollmentConfirmationEmail(
        validatedData.email,
        validatedData.firstName,
        activity.title || 'Activité',
        emailStatus
      )

      // Si paiement requis, créer une session Stripe unique pour tous les enfants
      if (!requiresApproval && requiresPayment) {
        const totalAmount = activity.price! * children.length
        const participantNames = children.map(c => `${c.firstName} ${c.lastName}`).join(', ')

        const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: children.map(child => ({
            price_data: {
              currency: 'chf',
              product_data: {
                name: `Inscription: ${activity.title}`,
                description: `Participant: ${child.firstName} ${child.lastName}`,
              },
              unit_amount: Math.round(activity.price! * 100),
            },
            quantity: 1,
          })),
          mode: 'payment',
          success_url: `${process.env.NEXTAUTH_URL}/membre/inscriptions?payment=success&batch=true`,
          cancel_url: `${process.env.NEXTAUTH_URL}/activites/${validatedData.activityId}?payment=cancelled`,
          customer_email: validatedData.email,
          metadata: {
            type: 'ACTIVITY_ENROLLMENT_BATCH',
            enrollmentIds: enrollments.map(e => e.id).join(','),
            activityId: validatedData.activityId,
            activityTitle: activity.title,
            userId: user.id,
            childIds: validatedData.childIds.join(','),
            participantNames,
          },
        })

        console.log('💳 Session Stripe batch créée:', stripeSession.id)

        return NextResponse.json(
          {
            message: 'Inscriptions créées - Redirection vers paiement',
            enrollments,
            checkoutUrl: stripeSession.url,
            requiresPayment: true,
            totalAmount,
          },
          { status: 201 }
        )
      }

      return NextResponse.json(
        {
          message: `${enrollments.length} inscription(s) enregistrée(s) avec succès`,
          enrollments,
          requiresApproval,
          requiresPayment: false,
        },
        { status: 201 }
      )
    }

    // ========== MODE SINGLE : un seul enfant ou adulte ==========
    let childId: string | null = null

    if (validatedData.isForChild) {
      if (validatedData.childId) {
        // Utiliser un enfant existant - vérifier qu'il appartient à l'utilisateur
        const existingChild = await prisma.child.findFirst({
          where: {
            id: validatedData.childId,
            parentId: user.id,
          },
        })
        if (existingChild) {
          childId = existingChild.id
        } else {
          return NextResponse.json(
            { error: 'Enfant non trouvé ou non autorisé' },
            { status: 400 }
          )
        }
      } else if (validatedData.childFirstName && validatedData.childLastName && validatedData.childBirthDate) {
        // Créer un nouvel enfant
        const newChild = await prisma.child.create({
          data: {
            firstName: validatedData.childFirstName,
            lastName: validatedData.childLastName,
            birthDate: new Date(validatedData.childBirthDate),
            parentId: user.id,
          },
        })
        childId = newChild.id
        console.log('👶 Nouvel enfant créé:', childId)
      }
    }

    // Créer l'inscription
    const enrollment = await prisma.enrollment.create({
      data: {
        activityId: validatedData.activityId,
        activityTitle: activity.title || 'Activité',
        userId: user.id,
        childId: childId,
        status: initialStatus,
        notes: validatedData.notes || null,
        requiresPayment: !!requiresPayment,
        paymentAmount: requiresPayment ? activity.price : null,
      },
    })

    console.log('📝 Inscription créée:', enrollment.id, 'Statut:', initialStatus)

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: initialStatus === 'PENDING' ? 'ENROLLMENT_CONFIRMATION' : 'ENROLLMENT_APPROVED',
        title: initialStatus === 'PENDING'
          ? 'Demande d\'inscription reçue'
          : requiresPayment
            ? 'Inscription - Paiement requis'
            : 'Inscription confirmée',
        message: initialStatus === 'PENDING'
          ? `Votre demande d'inscription à "${activity.title}" a été reçue et est en attente de validation.`
          : requiresPayment
            ? `Votre inscription à "${activity.title}" est validée. Finalisez le paiement de ${activity.price} CHF.`
            : `Votre inscription à "${activity.title}" est confirmée.`,
        link: requiresPayment ? '/membre/paiements' : '/membre/inscriptions',
        read: false,
        emailSent: true,
      },
    })

    // Envoyer l'email de confirmation
    const emailStatus = initialStatus === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
    await sendEnrollmentConfirmationEmail(
      validatedData.email,
      validatedData.firstName,
      activity.title || 'Activité',
      emailStatus
    )

    // Si paiement direct requis (pas d'approbation et payant), créer la session Stripe
    if (!requiresApproval && requiresPayment) {
      const participantName = childId
        ? `${validatedData.childFirstName || ''} ${validatedData.childLastName || ''}`
        : `${validatedData.firstName} ${validatedData.lastName}`

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'chf',
              product_data: {
                name: `Inscription: ${activity.title}`,
                description: `Participant: ${participantName}`,
              },
              unit_amount: Math.round(activity.price! * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/membre/inscriptions?payment=success&enrollmentId=${enrollment.id}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/activites/${validatedData.activityId}?payment=cancelled`,
        customer_email: validatedData.email,
        metadata: {
          type: 'ACTIVITY_ENROLLMENT',
          enrollmentId: enrollment.id,
          activityId: validatedData.activityId,
          activityTitle: activity.title,
          userId: user.id,
          childId: childId || '',
          participantName,
        },
      })

      console.log('💳 Session Stripe créée:', stripeSession.id)

      return NextResponse.json(
        {
          message: 'Inscription créée - Redirection vers paiement',
          enrollment,
          checkoutUrl: stripeSession.url,
          requiresPayment: true,
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        message: 'Inscription enregistrée avec succès',
        enrollment,
        requiresApproval,
        requiresPayment: false,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur POST /api/enrollments:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        child: {
          select: {
            firstName: true,
            lastName: true,
            birthDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
