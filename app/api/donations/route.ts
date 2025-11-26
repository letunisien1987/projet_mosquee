import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const donationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(['ZAKAT', 'SADAQA', 'ZAKAT_AL_FITR', 'PROJECT', 'MEMBERSHIP']),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  message: z.string().optional(),
  anonymous: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = donationSchema.parse(body)

    const donation = await prisma.donation.create({
      data: validatedData,
    })

    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const donations = await prisma.donation.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      where: {
        anonymous: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        amount: true,
        type: true,
        createdAt: true,
        projectName: true,
      },
    })

    const total = await prisma.donation.count()

    return NextResponse.json({ donations, total })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
