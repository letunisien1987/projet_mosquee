import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // Vérifier le token de setup pour sécuriser la création d'admin
    const setupToken = process.env.SETUP_TOKEN
    if (!setupToken) {
      return NextResponse.json(
        { error: 'Configuration de sécurité manquante. Définissez SETUP_TOKEN dans .env' },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${setupToken}`) {
      return NextResponse.json(
        { error: 'Non autorisé. Token de setup invalide ou manquant.' },
        { status: 401 }
      )
    }

    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Un administrateur existe déjà. Supprimez SETUP_TOKEN de votre .env' },
        { status: 400 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'email est déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hash du mot de passe
    const hashedPassword = await hash(password, 12)

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Mosquée',
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur admin créé avec succès !',
      email: admin.email,
      warning: 'IMPORTANT: Supprimez maintenant SETUP_TOKEN de votre .env pour sécuriser votre installation.',
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'admin' },
      { status: 500 }
    )
  }
}
