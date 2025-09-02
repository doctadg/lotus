import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { syncUserWithDatabase } from '@/lib/sync-user'
import { getCachedDynamicQuestions } from '@/lib/question-generator'
import { ApiResponse } from '@/types'

// GET /api/user/questions - Get personalized questions for the user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }
    
    // Sync user with database if needed
    const user = await syncUserWithDatabase(userId)
    
    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User sync failed'
      }, { status: 500 })
    }

    console.log(`🎯 [API] Generating questions for user: ${user.id}`)
    
    const questionResult = await getCachedDynamicQuestions(user.id)
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        questions: questionResult.questions,
        isPersonalized: questionResult.isPersonalized,
        source: questionResult.source
      }
    })

  } catch (error) {
    console.error('Error generating questions:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to generate questions'
    }, { status: 500 })
  }
}