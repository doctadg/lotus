import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { getCachedDynamicQuestions } from '@/lib/question-generator'
import { ApiResponse } from '@/types'

// GET /api/user/questions - Get personalized questions for the user
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateUser(request)
    
    if (!userId) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    console.log(`🎯 [API] Generating questions for user: ${userId}`)
    
    const questionResult = await getCachedDynamicQuestions(userId)
    
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