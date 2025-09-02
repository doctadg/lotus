'use client';

import React, { createContext, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  
  // Unified loading state
  const isLoading = !isLoaded || !userLoaded;
  
  // Build user object from Clerk data
  const user: User | null = clerkUser && userId ? {
    id: userId,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || '',
    imageUrl: clerkUser.imageUrl,
  } : null;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!userId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  
  const isLoading = !isLoaded || !userLoaded;
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    name: clerkUser.fullName || '',
    imageUrl: clerkUser.imageUrl
  } : null;
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-semibold">L</span>
          </div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}