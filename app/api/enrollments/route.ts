import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const enrollmentSchema = z.object({
  activityId: z.string().uuid(),
  levelId: z.string().uuid().optional(),
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
    const validatedData = enrollmentSchema.parse(body)

    // Récupérer l'activité pour le titre
    const activity = await prisma.activity.findUnique({
      where: { id: validatedData.activityId },
      select: { title: true },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      )
    }

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
    const enrollment = await prisma.enrollment.create({
      data: {
        activityId: validatedData.activityId,
        levelId: validatedData.levelId || null,
        activityTitle: activity.title,
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
