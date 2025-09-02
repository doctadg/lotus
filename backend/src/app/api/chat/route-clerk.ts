import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/clerk-auth';
import { ApiResponse, CreateChatRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Use Clerk authentication
    const authData = await getAuthenticatedUser();
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    const userId = authData.userId;

    const { title }: CreateChatRequest = await request.json();

    const chat = await prisma.chat.create({
      data: {
        userId,
        title: title || 'New Chat'
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use Clerk authentication
    const authData = await getAuthenticatedUser();
    
    if (!authData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const userId = authData.userId;

    const chats = await prisma.chat.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1 // Get only the first message for preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}