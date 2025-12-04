import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le profil depuis Prisma
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    })

    // Récupérer aussi les données de base de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
      },
    })

    return NextResponse.json({
      ...user,
      ...profile,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      dateOfBirth,
      bio,
      preferredLanguage,
      notificationEmail,
      notificationSms,
      newsletter,
    } = body

    // Mettre à jour les données de base dans Prisma
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
      },
    })

    // Upsert le profil dans Prisma (créer ou mettre à jour)
    const profile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        city: city || null,
        postalCode: postalCode || null,
        country: country || 'Suisse',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        bio: bio || null,
        preferredLanguage: preferredLanguage || 'fr',
        notificationEmail: notificationEmail ?? true,
        notificationSms: notificationSms ?? false,
        newsletter: newsletter ?? true,
      },
      create: {
        userId: session.user.id,
        city: city || null,
        postalCode: postalCode || null,
        country: country || 'Suisse',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        bio: bio || null,
        preferredLanguage: preferredLanguage || 'fr',
        notificationEmail: notificationEmail ?? true,
        notificationSms: notificationSms ?? false,
        newsletter: newsletter ?? true,
      },
    })

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      profile,
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
