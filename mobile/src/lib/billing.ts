/**
 * Clerk Billing Utility for Mobile
 *
 * This module provides helper functions for checking user subscriptions
 * and feature access using Clerk's billing system.
 */

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
 * Check if the user has access to a specific plan using Clerk's has() method
 *
 * @param has - The has function from useAuth()
 * @param plan - The plan to check
 */
export function hasPlan(has: ((params: { plan: string }) => boolean) | undefined, plan: Plan): boolean {
  if (!has) return false;
  return has({ plan });
}

/**
 * Check if the user has access to a specific feature using Clerk's has() method
 *
 * @param has - The has function from useAuth()
 * @param feature - The feature to check
 */
export function hasFeature(has: ((params: { feature: string }) => boolean) | undefined, feature: Feature): boolean {
  if (!has) return false;
  return has({ feature });
}

/**
 * Check if the user is on the Pro plan
 */
export function isProUser(has: ((params: { plan: string }) => boolean) | undefined): boolean {
  return hasPlan(has, PLANS.PRO);
}

/**
 * Check if the user is on the Free plan
 */
export function isFreeUser(has: ((params: { plan: string }) => boolean) | undefined): boolean {
  return hasPlan(has, PLANS.FREE);
}

/**
 * Check if user has unlimited messages
 */
export function hasUnlimitedMessages(has: ((params: { feature: string }) => boolean) | undefined): boolean {
  return hasFeature(has, FEATURES.UNLIMITED_MESSAGES);
}

/**
 * Check if user can use deep research mode
 */
export function canUseDeepResearch(has: ((params: { feature: string }) => boolean) | undefined): boolean {
  return hasFeature(has, FEATURES.DEEP_RESEARCH);
}

/**
 * Check if user can generate images
 */
export function canGenerateImages(has: ((params: { feature: string }) => boolean) | undefined): boolean {
  return hasFeature(has, FEATURES.IMAGE_GENERATION);
}

/**
 * Check if user has enhanced memory extraction
 */
export function hasEnhancedMemory(has: ((params: { feature: string }) => boolean) | undefined): boolean {
  return hasFeature(has, FEATURES.ENHANCED_MEMORY);
}

/**
 * Check if user has priority support
 */
export function hasPrioritySupport(has: ((params: { feature: string }) => boolean) | undefined): boolean {
  return hasFeature(has, FEATURES.PRIORITY_SUPPORT);
}

/**
 * Rate limiting configuration for free users
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
export function getRateLimit(has: ((params: { plan: string }) => boolean) | undefined): RateLimitConfig {
  const isPro = isProUser(has);
  return isPro ? RATE_LIMITS[PLANS.PRO] : RATE_LIMITS[PLANS.FREE];
}

/**
 * Get display name for a plan
 */
export function getPlanDisplayName(plan: Plan): string {
  switch (plan) {
    case PLANS.FREE:
      return 'Free';
    case PLANS.PRO:
      return 'Pro';
    default:
      return 'Unknown';
  }
}

/**
 * Get display name for a feature
 */
export function getFeatureDisplayName(feature: Feature): string {
  switch (feature) {
    case FEATURES.UNLIMITED_MESSAGES:
      return 'Unlimited Messages';
    case FEATURES.DEEP_RESEARCH:
      return 'Deep Research Mode';
    case FEATURES.ENHANCED_MEMORY:
      return 'Enhanced Memory';
    case FEATURES.IMAGE_GENERATION:
      return 'Image Generation';
    case FEATURES.PRIORITY_SUPPORT:
      return 'Priority Support';
    default:
      return 'Unknown';
  }
}

/**
 * Get list of features for a plan
 */
export function getPlanFeatures(plan: Plan): Feature[] {
  switch (plan) {
    case PLANS.FREE:
      return [];
    case PLANS.PRO:
      return [
        FEATURES.UNLIMITED_MESSAGES,
        FEATURES.DEEP_RESEARCH,
        FEATURES.ENHANCED_MEMORY,
        FEATURES.IMAGE_GENERATION,
        FEATURES.PRIORITY_SUPPORT,
      ];
    default:
      return [];
  }
}
