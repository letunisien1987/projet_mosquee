import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 Testing Sanity connection...')

    // Check environment variables
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
    const token = process.env.SANITY_API_TOKEN

    console.log('Environment check:')
    console.log('- projectId:', projectId)
    console.log('- dataset:', dataset)
    console.log('- token exists:', !!token)
    console.log('- token length:', token?.length)

    if (!projectId || !dataset) {
      throw new Error('Missing Sanity configuration')
    }

    // Create client with explicit configuration
    const testClient = createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false,
      token: token || undefined,
    })

    // Test 1: Simple query for all jumuaMessage documents
    console.log('Test 1: Fetching all jumuaMessage documents...')
    const allMessages = await testClient.fetch(`*[_type == "jumuaMessage"]`)
    console.log('✅ All messages count:', allMessages.length)
    console.log('📝 All messages:', JSON.stringify(allMessages, null, 2))

    // Test 2: Active messages only
    console.log('Test 2: Fetching active messages only...')
    const activeMessages = await testClient.fetch(`*[_type == "jumuaMessage" && isActive == true]`)
    console.log('✅ Active messages count:', activeMessages.length)

    // Test 3: With full projection
    console.log('Test 3: Fetching with full projection...')
    const today = new Date().toISOString().split('T')[0]
    const fullMessages = await testClient.fetch(
      `*[_type == "jumuaMessage" && isActive == true] {
        _id,
        title,
        message,
        image {
          asset-> {
            _id,
            url
          },
          alt
        },
        times,
        order,
        validFrom,
        validUntil,
        isActive
      }`
    )
    console.log('✅ Full projection count:', fullMessages.length)
    console.log('📝 Full messages:', JSON.stringify(fullMessages, null, 2))

    return NextResponse.json({
      allCount: allMessages.length,
      activeCount: activeMessages.length,
      fullCount: fullMessages.length,
      today,
      allMessages,
      activeMessages,
      fullMessages,
      success: true
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      success: false
    }, { status: 500 })
  }
}
