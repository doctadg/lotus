import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/pricing(.*)',         // Pricing page
  '/features(.*)',        // Features pages
  '/blog(.*)',           // Blog pages
  '/research(.*)',       // Research page
  '/login(.*)',          // Login page
  '/register(.*)',       // Register page
  '/signup(.*)',         // Signup page
  '/sso-callback(.*)',   // SSO callback
  '/api/health(.*)',     // Health check
  '/api/webhooks(.*)',   // Webhooks
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',           // Chat application
  '/admin(.*)',          // Admin pages
  '/settings(.*)',       // Settings page
  '/memories(.*)',       // Memories page
  '/api/chat(.*)',       // Chat API
  '/api/user(.*)',       // User API
  '/api/stripe(.*)',     // Stripe API
  '/api/revenuecat(.*)', // RevenueCat API
  '/api/tools(.*)',      // Tools API
]);

export default clerkMiddleware(async (auth, request) => {
  // If it's a protected route, require authentication
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Public routes pass through without authentication
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};