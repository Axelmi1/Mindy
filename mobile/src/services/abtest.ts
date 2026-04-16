/**
 * A/B Test Service — Mindy
 *
 * Lightweight client-side A/B testing:
 * - Assigns variants deterministically via userId hash (same user = same variant)
 * - Persists variant in AsyncStorage (stable across app restarts)
 * - Logs variant assignment to backend analytics
 *
 * Current experiments:
 *   ONBOARDING_FLOW  → 'control' | 'social_proof' | 'quick_demo'
 *   PAYWALL_CTA      → 'control' | 'urgency' | 'value_first'
 *   HOME_HERO        → 'control' | 'streak_first' | 'xp_first'
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from './analytics';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type ExperimentId =
  | 'ONBOARDING_FLOW'
  | 'PAYWALL_CTA'
  | 'HOME_HERO';

export type OnboardingVariant = 'control' | 'social_proof' | 'quick_demo';
export type PaywallVariant = 'control' | 'urgency' | 'value_first';
export type HomeHeroVariant = 'control' | 'streak_first' | 'xp_first';

type VariantMap = {
  ONBOARDING_FLOW: OnboardingVariant;
  PAYWALL_CTA: PaywallVariant;
  HOME_HERO: HomeHeroVariant;
};

type Variant<E extends ExperimentId> = VariantMap[E];

interface ExperimentConfig<E extends ExperimentId> {
  variants: Variant<E>[];
  weights: number[]; // must sum to 1
}

const EXPERIMENTS: { [E in ExperimentId]: ExperimentConfig<E> } = {
  ONBOARDING_FLOW: {
    variants: ['control', 'social_proof', 'quick_demo'],
    weights: [0.34, 0.33, 0.33],
  },
  PAYWALL_CTA: {
    variants: ['control', 'urgency', 'value_first'],
    weights: [0.34, 0.33, 0.33],
  },
  HOME_HERO: {
    variants: ['control', 'streak_first', 'xp_first'],
    weights: [0.5, 0.25, 0.25],
  },
} as const;

const STORAGE_PREFIX = '@mindy/ab_';

// ──────────────────────────────────────────────────────────────────────────────
// Deterministic hash
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Simple djb2 hash of string → [0, 1) float.
 * Deterministic: same userId + experimentId = same bucket.
 */
function hashToFloat(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // unsigned 32-bit
  }
  return hash / 0xffffffff;
}

/**
 * Assign a variant based on weighted distribution and deterministic hash.
 */
function assignVariant<E extends ExperimentId>(
  experimentId: E,
  userId: string,
): Variant<E> {
  const config = EXPERIMENTS[experimentId] as ExperimentConfig<E>;
  const bucket = hashToFloat(`${userId}:${experimentId}`);

  let cumulative = 0;
  for (let i = 0; i < config.variants.length; i++) {
    cumulative += config.weights[i];
    if (bucket < cumulative) {
      return config.variants[i];
    }
  }
  return config.variants[0];
}

// ──────────────────────────────────────────────────────────────────────────────
// A/B Test Service
// ──────────────────────────────────────────────────────────────────────────────

class ABTestService {
  private variantCache: Partial<VariantMap> = {};
  private userId: string | null = null;

  /**
   * Initialize with user ID.
   * Should be called once the user is known (after login/onboarding).
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;

    // Pre-load all variants from storage or assign fresh
    for (const experimentId of Object.keys(EXPERIMENTS) as ExperimentId[]) {
      await this.getVariant(experimentId as any);
    }

    console.log('[ABTest] Initialized for user:', userId, this.variantCache);
  }

  /**
   * Get the variant for an experiment.
   * - First call: assigns deterministically, persists, tracks analytics.
   * - Subsequent calls: returns cached value instantly.
   */
  async getVariant<E extends ExperimentId>(experimentId: E): Promise<Variant<E>> {
    // In-memory cache
    if (this.variantCache[experimentId] !== undefined) {
      return this.variantCache[experimentId] as Variant<E>;
    }

    const storageKey = `${STORAGE_PREFIX}${experimentId}`;

    // Check persistent storage
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) {
      this.variantCache[experimentId] = stored as Variant<E>;
      return stored as Variant<E>;
    }

    // Assign a new variant
    const userId = this.userId ?? `anon_${Date.now()}`;
    const variant = assignVariant(experimentId, userId);

    // Persist
    await AsyncStorage.setItem(storageKey, variant as string);
    this.variantCache[experimentId] = variant;

    // Track assignment in analytics (fire-and-forget)
    trackEvent('APP_OPENED', {
      action: 'ab_variant_assigned',
      experimentId,
      variant,
      userId,
    });

    console.log(`[ABTest] Assigned variant for ${experimentId}: ${variant as string}`);
    return variant;
  }

  /**
   * Get variant synchronously (from cache only).
   * Returns null if not yet initialized.
   */
  getVariantSync<E extends ExperimentId>(experimentId: E): Variant<E> | null {
    return (this.variantCache[experimentId] as Variant<E>) ?? null;
  }

  /**
   * Track a conversion event for the current variant.
   * Call this on meaningful user actions (e.g., completed onboarding, subscribed).
   */
  trackConversion(experimentId: ExperimentId, event: string): void {
    const variant = this.variantCache[experimentId];
    if (!variant) return;

    trackEvent('APP_OPENED', {
      action: 'ab_conversion',
      experimentId,
      variant,
      conversionEvent: event,
      userId: this.userId,
    });

    console.log(`[ABTest] Conversion: ${experimentId} / ${variant as string} → ${event}`);
  }

  /**
   * Force a variant (dev/testing only).
   */
  async forceVariant<E extends ExperimentId>(
    experimentId: E,
    variant: Variant<E>,
  ): Promise<void> {
    if (__DEV__) {
      const storageKey = `${STORAGE_PREFIX}${experimentId}`;
      await AsyncStorage.setItem(storageKey, variant as string);
      this.variantCache[experimentId] = variant;
      console.log(`[ABTest] Force-set ${experimentId} = ${variant as string}`);
    }
  }

  /**
   * Reset all variant assignments (for testing or re-assignment).
   */
  async reset(): Promise<void> {
    this.variantCache = {};
    for (const experimentId of Object.keys(EXPERIMENTS) as ExperimentId[]) {
      await AsyncStorage.removeItem(`${STORAGE_PREFIX}${experimentId}`);
    }
    console.log('[ABTest] All variants reset');
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Singleton exports
// ──────────────────────────────────────────────────────────────────────────────

export const abTestService = new ABTestService();

export const initializeABTest = (userId: string) => abTestService.initialize(userId);

export const getVariant = <E extends ExperimentId>(
  experimentId: E,
): Promise<VariantMap[E]> => abTestService.getVariant(experimentId);

export const getVariantSync = <E extends ExperimentId>(
  experimentId: E,
): VariantMap[E] | null => abTestService.getVariantSync(experimentId);

export const trackABConversion = (
  experimentId: ExperimentId,
  event: string,
): void => abTestService.trackConversion(experimentId, event);
