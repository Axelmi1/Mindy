import { useState, useEffect, useCallback, useRef } from 'react';
import {
  achievementsApi,
  UserAchievement,
  LockedAchievement,
  UserAchievementsResponse,
} from '@/api/client';

interface UseAchievementsReturn {
  achievements: UserAchievementsResponse | null;
  isLoading: boolean;
  error: string | null;
  newlyUnlocked: UserAchievement | null;
  clearNewlyUnlocked: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage user achievements
 * Tracks unlocked/locked achievements and detects newly unlocked ones
 */
export function useAchievements(userId: string | null): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<UserAchievementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<UserAchievement | null>(null);

  // Track previous unlocked IDs to detect new unlocks
  const previousUnlockedIdsRef = useRef<Set<string>>(new Set());

  const loadAchievements = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await achievementsApi.getUserAchievements(userId);

      if (response.success && response.data) {
        const data = response.data;
        setAchievements(data);

        // Check for newly unlocked achievements
        const currentUnlockedIds = new Set(data.unlocked.map((ua) => ua.id));

        // Find achievements that weren't in the previous set
        for (const ua of data.unlocked) {
          if (!previousUnlockedIdsRef.current.has(ua.id) && previousUnlockedIdsRef.current.size > 0) {
            // This is a newly unlocked achievement
            setNewlyUnlocked(ua);
            break; // Only show one at a time
          }
        }

        // Update the ref for next comparison
        previousUnlockedIdsRef.current = currentUnlockedIds;
      }
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadAchievements();
  }, [loadAchievements]);

  // Load on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId, loadAchievements]);

  return {
    achievements,
    isLoading,
    error,
    newlyUnlocked,
    clearNewlyUnlocked,
    refresh,
  };
}

/**
 * Get rarity color for an achievement
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'COMMON':
      return '#8B949E';
    case 'UNCOMMON':
      return '#39FF14';
    case 'RARE':
      return '#58A6FF';
    case 'EPIC':
      return '#A371F7';
    case 'LEGENDARY':
      return '#FFD700';
    default:
      return '#8B949E';
  }
}

/**
 * Get icon name for an achievement category
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'LEARNING':
      return 'book';
    case 'STREAK':
      return 'flame';
    case 'XP':
      return 'zap';
    case 'SOCIAL':
      return 'users';
    case 'SPECIAL':
      return 'star';
    default:
      return 'target';
  }
}
