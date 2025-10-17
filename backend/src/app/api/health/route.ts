import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AI Chat Backend'
    }
  })
}