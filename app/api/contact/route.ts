import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit'

const contactSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(10),
})

// Rate limit: 5 messages par minute par IP
const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60000 }

export async function POST(request: NextRequest) {
  try {
    // Vérifier le rate limiting
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`contact:${clientIp}`, RATE_LIMIT_CONFIG)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      )
    }

    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    const message = await prisma.contactMessage.create({
      data: validatedData,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where = unreadOnly ? { read: false } : {}

    const messages = await prisma.contactMessage.findMany({
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

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
