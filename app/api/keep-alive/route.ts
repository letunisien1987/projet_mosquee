import { NextResponse } from 'next/server'
import { getMawaqitData } from '@/lib/mawaqit'

export const dynamic = 'force-dynamic'

/**
 * Endpoint keep-alive pour éviter la mise en pause de Render.com
 * À pinger toutes les 20-25 minutes par un service externe (Cron-Job.org, UptimeRobot, etc.)
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Ping léger de l'API Mawaqit
    await getMawaqitData()

    const latency = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'ok',
        message: 'API Mawaqit accessible',
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`,
      },
      { status: 200 }
    )
  } catch (error) {
    const latency = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`,
      },
      { status: 503 }
    )
  }
}
