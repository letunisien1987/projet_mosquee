import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const showName = searchParams.get('showName') === 'true'
    const showEmail = searchParams.get('showEmail') === 'true'
    const showPhone = searchParams.get('showPhone') === 'true'

    if (!email) {
      return NextResponse.json(null)
    }

    // Si aucun champ n'est à afficher, retourner null
    if (!showName && !showEmail && !showPhone) {
      return NextResponse.json(null)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { firstName: true, lastName: true, email: true, phone: true }
    })

    if (!user) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      firstName: showName ? user.firstName : undefined,
      lastName: showName ? user.lastName : undefined,
      email: showEmail ? user.email : undefined,
      phone: showPhone ? (user.phone ?? undefined) : undefined,
      showName,
      showEmail,
      showPhone
    })
  } catch (error) {
    console.error('Erreur organizer-info:', error)
    return NextResponse.json(null)
  }
}
