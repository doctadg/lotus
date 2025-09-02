# Clerk Authentication Migration Guide

## Overview
This guide explains how to migrate from JWT-based authentication to Clerk while keeping your existing UI components.

## Environment Setup

### 1. Environment Variables
Add these to your `.env.local` file:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGl2aW5nLWxpb25maXNoLTcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_03GLqE3NbNIlerCwgyqRfwPlQXpPtzNw4aDwlDdIoQ
```

### 2. Install Dependencies
```bash
pnpm install @clerk/nextjs
```

### 3. Run Database Migration
Create a new migration to add the `clerkId` field:
```bash
npx prisma migrate dev --name add-clerk-id
```

## File Changes

### Backend Authentication

#### 1. **middleware.ts** (Created)
- Located at `/backend/middleware.ts`
- Handles Clerk authentication middleware

#### 2. **src/app/layout.tsx** (Updated)
- Added `ClerkProvider` wrapper
- Maintains existing Providers structure

#### 3. **src/lib/clerk-auth.ts** (Created)
- New authentication helpers using Clerk
- `getAuthenticatedUser()` - Get authenticated user from Clerk
- `authenticateAdmin()` - Authenticate admin users
- `syncUserWithDatabase()` - Sync Clerk users with local DB

#### 4. **src/lib/clerk-auth-context.tsx** (Created)
- Updated auth context that works with both Clerk and legacy JWT
- Maintains backward compatibility with existing UI components

### API Routes Migration

#### For Each Protected API Route:
Replace:
```typescript
import { authenticateUser } from '@/lib/auth'
const authData = await authenticateUser(request)
```

With:
```typescript
import { getAuthenticatedUser } from '@/lib/clerk-auth'
const authData = await getAuthenticatedUser()
```

#### Example Updated Routes:
- `/api/auth/clerk-signin/route.ts` - New sign-in bridge for Clerk
- `/api/auth/clerk-register/route.ts` - New registration bridge for Clerk
- `/api/chat/route-clerk.ts` - Example of updated chat route

## Frontend Changes

### Using Existing UI Components
Your existing login/signup forms can continue to work by:

1. **Option A: Direct Clerk Integration (Recommended)**
   - Update forms to call Clerk SDK directly
   - Use `@clerk/nextjs` client methods

2. **Option B: Bridge API (Current Implementation)**
   - Forms call `/api/auth/clerk-signin` and `/api/auth/clerk-register`
   - Backend creates users in Clerk
   - Maintains compatibility with existing UI

### Auth Context Usage
Replace:
```typescript
import { AuthProvider } from '@/lib/auth-context'
```

With:
```typescript
import { AuthProvider } from '@/lib/clerk-auth-context'
```

## Migration Steps for Existing Users

### 1. Gradual Migration
- Existing users with passwords can still log in
- On first Clerk sign-in, their account will be linked via email
- The `clerkId` field will be populated automatically

### 2. Bulk Migration (Optional)
```typescript
// Script to migrate existing users to Clerk
async function migrateUsers() {
  const users = await prisma.user.findMany({
    where: { clerkId: null }
  });
  
  for (const user of users) {
    try {
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [user.email],
        // Generate temporary password or use passwordless
      });
      
      await prisma.user.update({
        where: { id: user.id },
        data: { clerkId: clerkUser.id }
      });
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error);
    }
  }
}
```

## Benefits of This Approach

1. **Minimal UI Changes**: Keep your existing components
2. **Enhanced Security**: Clerk handles authentication
3. **Backward Compatibility**: Legacy JWT still works during migration
4. **Progressive Enhancement**: Add Clerk features gradually
5. **Built-in Features**: Get MFA, SSO, passwordless auth

## Testing

1. Test new user registration
2. Test existing user login
3. Test protected API routes
4. Test admin authentication
5. Test logout functionality

## Rollback Plan

If needed, you can rollback by:
1. Removing `ClerkProvider` from layout
2. Switching back to original auth context
3. Using original JWT-based routes
4. Users with passwords can still authenticate

## Next Steps

1. Complete API route migrations
2. Add Clerk webhook handlers for user sync
3. Implement passwordless auth options
4. Add social login providers
5. Enable MFA for enhanced security