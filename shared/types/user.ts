/**
 * MINDY User Types
 * Shared between server and mobile for type safety
 */

/**
 * User profile data
 */
export interface User {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  streakFreezes: number;
  soundEnabled: boolean;
  lastActiveAt: string | null;
  preferredDomain: string | null;
  userGoal: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Per-domain lesson completion breakdown
 */
export interface DomainStats {
  domain: 'CRYPTO' | 'FINANCE' | 'TRADING';
  completed: number;
  total: number;
  label: string;
  emoji: string;
}

/**
 * User stats for dashboard display
 */
export interface UserStats {
  username: string;
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  streakFreezes: number;
  streakAtRisk: boolean;
  soundEnabled: boolean;
  lessonsCompleted: number;
  totalLessons: number;
  achievementsUnlocked: number;
  referralCode: string | null;
  /** Weekly leaderboard rank (null if user hasn't earned XP this week) */
  userRank: number | null;
  /** Completion breakdown by domain */
  domainStats: DomainStats[];
  /** Whether the user has already seen the invite-friends prompt */
  hasSeenInvitePrompt: boolean;
}

/**
 * User progress on a specific lesson
 */
export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  completedSteps: number[];
  isCompleted: boolean;
}

/**
 * Progress with lesson details (for dashboard)
 */
export interface UserProgressWithLesson extends UserProgress {
  lesson: {
    id: string;
    title: string;
    domain: string;
    xpReward: number;
  };
}

