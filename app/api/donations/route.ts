import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit'
import { donationSchema } from '@/lib/validations/donation'

// Rate limit: 5 dons par minute par IP (protection contre spam)
const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60000 }

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - protection contre spam
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`donation:${clientIp}`, RATE_LIMIT_CONFIG)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const validatedData = donationSchema.parse(body)

    const donation = await prisma.donation.create({
      data: validatedData,
    })

    return NextResponse.json(donation, { status: 201 })
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
