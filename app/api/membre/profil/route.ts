import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserProfile, createUserProfile, updateUserProfile } from '@/lib/directus'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le profil depuis Directus
    const profile = await getUserProfile(session.user.id)

    return NextResponse.json(profile)
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

    // Récupérer ou créer le profil Directus
    let profile = await getUserProfile(session.user.id)

    const profileData = {
      user_id: session.user.id,
      city: city || '',
      postal_code: postalCode || '',
      country: country || 'France',
      date_of_birth: dateOfBirth || null,
      bio: bio || '',
      preferred_language: preferredLanguage || 'fr',
      notification_email: notificationEmail ?? true,
      notification_sms: notificationSms ?? false,
      newsletter: newsletter ?? true,
    }

    if (!profile) {
      // Créer le profil
      profile = await createUserProfile(profileData)
    } else {
      // Mettre à jour le profil
      profile = await updateUserProfile(profile.id, profileData)
    }

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
