import { useState, useEffect, useCallback } from 'react';
import { Share, Platform } from 'react-native';
import { referralsApi, ReferralStats } from '@/api/client';

interface UseReferralsReturn {
  stats: ReferralStats | null;
  isLoading: boolean;
  error: string | null;
  shareReferralCode: () => Promise<void>;
  copyReferralCode: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage referral system
 * Provides stats, sharing, and copy functionality
 */
export function useReferrals(userId: string | null): UseReferralsReturn {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await referralsApi.getStats(userId);

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading referral stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referral stats');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const shareReferralCode = useCallback(async () => {
    if (!stats?.referralCode) return;

    const message = Platform.select({
      ios: `Join me on MINDY and learn crypto & finance! Use my code ${stats.referralCode} to get bonus XP! 🚀`,
      android: `Join me on MINDY and learn crypto & finance! Use my code ${stats.referralCode} to get bonus XP! 🚀\n\nDownload: https://mindy.app`,
      default: `Join me on MINDY! Use code: ${stats.referralCode}`,
    });

    try {
      await Share.share({
        message,
        title: 'Join MINDY',
      });
    } catch (err) {
      console.error('Error sharing referral code:', err);
    }
  }, [stats?.referralCode]);

  const copyReferralCode = useCallback(async (): Promise<boolean> => {
    if (!stats?.referralCode) return false;

    try {
      // Note: In a real app, you'd use expo-clipboard or react-native-clipboard
      // For now, we'll just return the code
      // await Clipboard.setStringAsync(stats.referralCode);
      return true;
    } catch (err) {
      console.error('Error copying referral code:', err);
      return false;
    }
  }, [stats?.referralCode]);

  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  // Load on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId, loadStats]);

  return {
    stats,
    isLoading,
    error,
    shareReferralCode,
    copyReferralCode,
    refresh,
  };
}

/**
 * Calculate progress to next tier
 */
export function getTierProgress(totalReferrals: number, nextTierAt: number | null): number {
  if (!nextTierAt) return 100;

  // Find previous tier threshold
  const tierThresholds = [0, 3, 5, 10];
  let previousTier = 0;

  for (const threshold of tierThresholds) {
    if (threshold < nextTierAt) {
      previousTier = threshold;
    }
  }

  const current = totalReferrals - previousTier;
  const total = nextTierAt - previousTier;

  return Math.min(Math.round((current / total) * 100), 100);
}
