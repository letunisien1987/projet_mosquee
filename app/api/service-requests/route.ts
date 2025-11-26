import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const serviceRequestSchema = z.object({
  userId: z.string().optional(),
  serviceType: z.enum(['MARRIAGE', 'FUNERAL', 'SHAHADA', 'AQIQA']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  details: z.string().min(10),
  requestDate: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestDate, ...rest } = serviceRequestSchema.parse(body)

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        ...rest,
        requestDate: requestDate ? new Date(requestDate) : undefined,
      },
    })

    return NextResponse.json(serviceRequest, { status: 201 })
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
    const status = searchParams.get('status')
    const serviceType = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (serviceType) where.serviceType = serviceType

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(serviceRequests)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
