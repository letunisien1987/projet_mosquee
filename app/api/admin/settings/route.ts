import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer le message du Joumou'a
    const jumuaMessageSetting = await prisma.mosqueSettings.findUnique({
      where: { key: 'jumua_message' },
    })

    return NextResponse.json({
      jumuaMessage: jumuaMessageSetting?.value || '',
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { jumuaMessage } = await request.json()

    // Enregistrer ou mettre à jour le message du Joumou'a
    await prisma.mosqueSettings.upsert({
      where: { key: 'jumua_message' },
      update: {
        value: jumuaMessage || null,
        updatedBy: session.user.email,
      },
      create: {
        key: 'jumua_message',
        value: jumuaMessage || null,
        description: 'Message personnalisé affiché dans la section Joumou\'a',
        updatedBy: session.user.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Paramètres enregistrés avec succès',
    })
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des paramètres:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement des paramètres' },
      { status: 500 }
    )
  }
}
