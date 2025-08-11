import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name }: RegisterRequest = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Email and password are required'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    // Create JWT token
    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user,
        token
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}