import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const adminEmail = email || 'admin@mosquee.com'
    const adminPassword = password || 'Admin123!'

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hash du mot de passe
    const hashedPassword = await hash(adminPassword, 12)

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Mosquée',
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur admin créé avec succès !',
      email: adminEmail,
      password: adminPassword,
      warning: 'IMPORTANT: Changez ce mot de passe après votre première connexion !',
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'admin' },
      { status: 500 }
    )
  }
}
