import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from './auth'
import { prisma } from './prisma'
import { ApiResponse } from '@/types'

export async function requireAdmin(request: NextRequest) {
  const adminData = await authenticateAdmin(request)
  
  if (!adminData) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Admin access required'
    }, { status: 403 })
  }
  
  return adminData
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetId?: string,
  details?: any
) {
  try {
    await prisma.adminAction.create({
      data: {
        adminId,
        action,
        targetId,
        details
      }
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

export async function withAdminAuth<T extends any[]>(
  handler: (adminData: { userId: string; email: string; role: string }, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const adminAuth = await requireAdmin(request)
    
    if (adminAuth instanceof NextResponse) {
      return adminAuth
    }
    
    return handler(adminAuth, ...args)
  }
}