import { auth } from '@clerk/nextjs/server';
import { getUserSubscriptionStatus, isProUser as isProUserHybrid } from './subscription-status';

/**
 * Plan identifiers - must match what you create in Clerk Dashboard
 */
export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
} as const;

/**
 * Feature identifiers - must match what you create in Clerk Dashboard
 */
export const FEATURES = {
  UNLIMITED_MESSAGES: 'unlimited_messages',
  DEEP_RESEARCH: 'deep_research',
  ENHANCED_MEMORY: 'enhanced_memory',
  IMAGE_GENERATION: 'image_generation',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

export type Plan = typeof PLANS[keyof typeof PLANS];
export type Feature = typeof FEATURES[keyof typeof FEATURES];

/**
 * Check if the authenticated user has access to a specific plan
 */
export async function hasPlan(plan: Plan): Promise<boolean> {
  try {
    const { has } = await auth();
    return has({ plan }) || false;
  } catch (error) {
    console.error('Error checking plan access:', error);
    return false;
  }
}

/**
 * Check if the authenticated user has access to a specific feature
 */
export async function hasFeature(feature: Feature): Promise<boolean> {
  try {
    const { has } = await auth();
    return has({ feature }) || false;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Check if the user is on the Pro plan
 * Uses hybrid subscription logic: checks RevenueCat (mobile) first, then Clerk Billing (web)
 */
export async function isProUser(): Promise<boolean> {
  return isProUserHybrid();
}

/**
 * Check if the user is on the Free plan
 */
export async function isFreeUser(): Promise<boolean> {
  return hasPlan(PLANS.FREE);
}

/**
 * Get all plans the user has access to
 */
export async function getUserPlans(): Promise<Plan[]> {
  const plans: Plan[] = [];

  if (await hasPlan(PLANS.FREE)) {
    plans.push(PLANS.FREE);
  }

  if (await hasPlan(PLANS.PRO)) {
    plans.push(PLANS.PRO);
  }

  return plans;
}

/**
 * Get all features the user has access to
 */
export async function getUserFeatures(): Promise<Feature[]> {
  const features: Feature[] = [];

  const featureChecks = Object.values(FEATURES).map(async (feature) => {
    const access = await hasFeature(feature);
    return access ? feature : null;
  });

  const results = await Promise.all(featureChecks);

  return results.filter((f): f is Feature => f !== null);
}

/**
 * Rate limiting for free users
 */
export interface RateLimitConfig {
  maxMessages: number;
  windowMinutes: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  [PLANS.FREE]: {
    maxMessages: 15,
    windowMinutes: 60,
  },
  [PLANS.PRO]: {
    maxMessages: -1, // Unlimited
    windowMinutes: 60,
  },
};

/**
 * Get rate limit configuration for the current user
 */
export async function getRateLimit(): Promise<RateLimitConfig> {
  const isPro = await isProUser();
  return isPro ? RATE_LIMITS[PLANS.PRO] : RATE_LIMITS[PLANS.FREE];
}

/**
 * Check if user has unlimited messages
 * Pro users from any source (RevenueCat or Clerk) have unlimited messages
 */
export async function hasUnlimitedMessages(): Promise<boolean> {
  const isPro = await isProUser();
  if (isPro) return true;

  // Fallback to Clerk feature check
  return hasFeature(FEATURES.UNLIMITED_MESSAGES);
}

/**
 * Check if user can use deep research mode
 * Pro users from any source (RevenueCat or Clerk) can use deep research
 */
export async function canUseDeepResearch(): Promise<boolean> {
  const isPro = await isProUser();
  if (isPro) return true;

  // Fallback to Clerk feature check
  return hasFeature(FEATURES.DEEP_RESEARCH);
}

/**
 * Check if user can generate images
 * Pro users from any source (RevenueCat or Clerk) can generate images
 */
export async function canGenerateImages(): Promise<boolean> {
  const isPro = await isProUser();
  if (isPro) return true;

  // Fallback to Clerk feature check
  return hasFeature(FEATURES.IMAGE_GENERATION);
}

/**
 * Check if user has enhanced memory extraction
 * Pro users from any source (RevenueCat or Clerk) have enhanced memory
 */
export async function hasEnhancedMemory(): Promise<boolean> {
  const isPro = await isProUser();
  if (isPro) return true;

  // Fallback to Clerk feature check
  return hasFeature(FEATURES.ENHANCED_MEMORY);
}

/**
 * Check if user has priority support
 * Pro users from any source (RevenueCat or Clerk) have priority support
 */
export async function hasPrioritySupport(): Promise<boolean> {
  const isPro = await isProUser();
  if (isPro) return true;

  // Fallback to Clerk feature check
  return hasFeature(FEATURES.PRIORITY_SUPPORT);
}
