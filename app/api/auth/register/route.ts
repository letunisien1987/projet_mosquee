import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createUserProfile, createNotification } from '@/lib/directus'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, address, password } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 12)

    // Créer l'utilisateur dans Prisma
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        password: hashedPassword,
        role: 'MEMBER', // Par défaut
      },
    })

    // Créer le profil utilisateur dans Directus
    await createUserProfile({
      user_id: user.id,
      preferred_language: 'fr',
      notification_email: true,
      notification_sms: false,
      newsletter: true,
      country: 'France',
    })

    // Créer une notification de bienvenue
    await createNotification({
      user_id: user.id,
      type: 'SYSTEM',
      title: 'Bienvenue à la Mosquée Al-Nour !',
      message: 'Votre compte a été créé avec succès. Explorez votre espace membre pour découvrir toutes les fonctionnalités disponibles.',
      link: '/membre/dashboard',
      read: false,
    })

    // Envoyer l'email de bienvenue
    await sendWelcomeEmail(user.email, user.firstName)

    // Retourner les données de l'utilisateur (sans le mot de passe)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        message: 'Compte créé avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    )
  }
}
