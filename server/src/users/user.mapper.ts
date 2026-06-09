import type { User } from '@mindy/shared';

/** Map a Prisma User row to the public API response shape (never leaks password). */
export function mapUserToResponse(user: {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  streakFreezes: number;
  soundEnabled: boolean;
  lastActiveAt: Date | null;
  preferredDomain?: string | null;
  userGoal?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    maxStreak: user.maxStreak,
    streakFreezes: user.streakFreezes,
    soundEnabled: user.soundEnabled,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    preferredDomain: user.preferredDomain ?? null,
    userGoal: user.userGoal ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
