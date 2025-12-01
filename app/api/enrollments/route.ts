import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getActivities } from '@/lib/directus'

const enrollmentSchema = z.object({
  activityId: z.string().min(1),
  levelId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
  isForChild: z.boolean(),
  childFirstName: z.string().optional(),
  childLastName: z.string().optional(),
  childBirthDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Données reçues:', body)

    const validatedData = enrollmentSchema.parse(body)

    // Récupérer l'activité depuis Directus pour le titre
    const activities = await getActivities()
    console.log('📋 Activités disponibles:', activities.map((a: any) => ({ id: a.id, title: a.title })))
    console.log('🔍 Recherche activityId:', validatedData.activityId, 'Type:', typeof validatedData.activityId)

    const activity = activities.find((a: any) => {
      console.log('   Comparaison:', a.id, 'Type:', typeof a.id, 'Match:', a.id == validatedData.activityId)
      return a.id == validatedData.activityId // Utiliser == pour permettre la conversion de type
    })

    if (!activity) {
      console.log('❌ Activité non trouvée')
      return NextResponse.json(
        {
          error: 'Activité non trouvée',
          debug: {
            receivedId: validatedData.activityId,
            availableIds: activities.map((a: any) => a.id)
          }
        },
        { status: 404 }
      )
    }

    console.log('✅ Activité trouvée:', activity.title)

    // Si c'est pour un enfant, créer d'abord l'enfant
    let childId: string | undefined
    let userId: string | undefined

    if (validatedData.isForChild && validatedData.childFirstName && validatedData.childLastName && validatedData.childBirthDate) {
      // Vérifier si l'utilisateur existe par email
      let user = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      // Si l'utilisateur n'existe pas, le créer avec un password temporaire
      if (!user) {
        // Générer un password aléatoire temporaire
        const tempPassword = Math.random().toString(36).slice(-8)

        user = await prisma.user.create({
          data: {
            email: validatedData.email,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone,
            password: tempPassword, // À remplacer par un hash en production
            role: 'MEMBER',
          },
        })
      }

      userId = user.id

      // Créer l'enfant
      const child = await prisma.child.create({
        data: {
          firstName: validatedData.childFirstName,
          lastName: validatedData.childLastName,
          birthDate: new Date(validatedData.childBirthDate),
          parentId: user.id,
        },
      })

      childId = child.id
    }

    // Créer l'inscription
    // Utiliser activityIdOld car les IDs Directus ne sont pas des UUIDs
    const enrollment = await prisma.enrollment.create({
      data: {
        activityIdOld: validatedData.activityId, // Stocker l'ID Directus dans activityIdOld
        activityId: null, // Pas d'activité dans Prisma
        levelId: null, // Pas de niveau dans Prisma (les activités sont dans Directus)
        activityTitle: activity.title || 'Activité',
        childId: childId || null,
        userId: userId || null,
        status: 'PENDING',
        notes: validatedData.notes || null,
      },
    })

    return NextResponse.json(
      {
        message: 'Inscription enregistrée avec succès',
        enrollment,
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
