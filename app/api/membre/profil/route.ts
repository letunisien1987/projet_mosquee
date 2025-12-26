/**
 * API Membre: Gestion du profil utilisateur
 * GET /api/membre/profil - Récupérer le profil
 * PUT /api/membre/profil - Mettre à jour le profil
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  apiHandler,
  requireAuth,
  successResponse,
} from '@/lib/api/middleware'
import { updateProfileSchema } from '@/lib/validations/membre'

// GET - Récupérer le profil
export const GET = apiHandler(async () => {
  const session = await requireAuth()

  const [profile, user] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
      },
    }),
  ])

  return successResponse({ ...user, ...profile })
})

// PUT - Mettre à jour le profil
export const PUT = apiHandler(async (req: NextRequest) => {
  const session = await requireAuth()

  const body = await req.json()

  // Validation Zod
  const validation = updateProfileSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: validation.error.flatten() },
      { status: 400 }
    )
  }

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
  } = validation.data

  // Mettre à jour les données de base
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

  // Upsert le profil
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

  return successResponse({
    message: 'Profil mis à jour avec succès',
    profile,
  })
})
