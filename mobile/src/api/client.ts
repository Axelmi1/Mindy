/**
 * MINDY API Client
 * 
 * Handles all HTTP requests to the NestJS backend.
 * Provides typed methods for each endpoint.
 */

import type {
  ApiResponse,
  User,
  UserStats,
  Lesson,
  UserProgress,
  UserProgressWithLesson,
  CreateProgressDto,
  CompleteStepDto,
} from '@mindy/shared';

// ============================================================================
// Configuration
// ============================================================================

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.42:3001/api';

// Debug: log the API URL on load
console.log('[API] Base URL:', API_BASE_URL);

// ============================================================================
// Base Fetch Wrapper
// ============================================================================

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('[API] Fetching:', url);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.log('[API] Error response:', response.status, text.substring(0, 200));
    try {
      const error = JSON.parse(text);
      throw new Error(error.message || `HTTP ${response.status}`);
    } catch {
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log('[API] Parse error, response was:', text.substring(0, 500));
    throw e;
  }
}

// ============================================================================
// User Endpoints
// ============================================================================

export const usersApi = {
  /**
   * Get user by ID
   */
  getById: (id: string) =>
    fetchApi<User>(`/users/${id}`),

  /**
   * Get user by username (for login)
   */
  getByUsername: (username: string) =>
    fetchApi<User>(`/users/by-username/${encodeURIComponent(username)}`),

  /**
   * Update username
   */
  updateUsername: (id: string, username: string) =>
    fetchApi<User>(`/users/${id}/username`, {
      method: 'PATCH',
      body: JSON.stringify({ username }),
    }),

  /**
   * Get user stats for dashboard
   */
  getStats: (id: string) =>
    fetchApi<UserStats>(`/users/${id}/stats`),

  /**
   * Add XP to user
   */
  addXp: (id: string, amount: number) =>
    fetchApi<User>(`/users/${id}/xp`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  /**
   * Update user streak
   */
  updateStreak: (id: string) =>
    fetchApi<User>(`/users/${id}/streak`, {
      method: 'POST',
    }),

  /**
   * Update user settings
   */
  updateSettings: (id: string, settings: { soundEnabled?: boolean }) =>
    fetchApi<User>(`/users/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  /**
   * Update user (general PATCH — domain, goal, username, etc.)
   */
  update: (id: string, data: {
    username?: string;
    preferredDomain?: string | null;
    userGoal?: string | null;
  }) =>
    fetchApi<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Buy a streak freeze using 50 XP
   */
  buyStreakFreeze: (id: string) =>
    fetchApi<{ xp: number; streakFreezes: number; xpSpent: number }>(
      `/users/${id}/streak-freeze`,
      { method: 'POST' },
    ),

  /**
   * Get recent activity timeline for the user's profile feed
   */
  getRecentActivity: (id: string, limit = 10) =>
    fetchApi<RecentActivityItem[]>(`/users/${id}/recent-activity?limit=${limit}`),

  /**
   * Get social / challenge stats for the community section
   */
  getSocialStats: (id: string) =>
    fetchApi<{
      challengesSent: number;
      challengesReceived: number;
      challengesWon: number;
      challengesLost: number;
      challengesDraw: number;
      winRate: number;
      avgRank4Weeks: number | null;
    }>(`/users/${id}/social-stats`),

  /**
   * Soft-delete user account (anonymise data + invalidate tokens)
   */
  deleteAccount: (id: string) =>
    fetchApi<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// Lesson Endpoints
// ============================================================================

export const lessonsApi = {
  /**
   * Get all lessons
   */
  getAll: (params?: { domain?: string; difficulty?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.domain) searchParams.set('domain', params.domain);
    if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
    const query = searchParams.toString();
    return fetchApi<Lesson[]>(`/lessons${query ? `?${query}` : ''}`);
  },

  /**
   * Get lesson by ID
   */
  getById: (id: string) => 
    fetchApi<Lesson>(`/lessons/${id}`),

  /**
   * Get lessons by domain
   */
  getByDomain: (domain: 'CRYPTO' | 'FINANCE', userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return fetchApi<Lesson[]>(`/lessons/domain/${domain}${query}`);
  },
};

// ============================================================================
// Progress Endpoints
// ============================================================================

export const progressApi = {
  /**
   * Get all progress for a user
   */
  getByUser: (userId: string) =>
    fetchApi<UserProgressWithLesson[]>(`/progress/user/${userId}`),

  /**
   * Get user's current/in-progress lesson
   */
  getCurrentLesson: (userId: string) =>
    fetchApi<{
      lesson: { id: string; title: string } | null;
      progress: UserProgress | null;
    }>(`/progress/user/${userId}/current`),

  /**
   * Get progress for specific user and lesson
   */
  getByUserAndLesson: (userId: string, lessonId: string) =>
    fetchApi<UserProgress | null>(`/progress/user/${userId}/lesson/${lessonId}`),

  /**
   * Start tracking progress for a lesson
   */
  create: (data: CreateProgressDto) =>
    fetchApi<UserProgress>('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Complete a step in a lesson
   */
  completeStep: (progressId: string, stepIndex: number) =>
    fetchApi<UserProgress & { justCompleted: boolean; xpAwarded: number }>(
      `/progress/${progressId}/complete-step`,
      {
        method: 'POST',
        body: JSON.stringify({ stepIndex } as CompleteStepDto),
      }
    ),

  /**
   * Reset progress (retry lesson)
   */
  reset: (progressId: string) =>
    fetchApi<UserProgress>(`/progress/${progressId}/reset`, {
      method: 'POST',
    }),

  /**
   * Get activity heatmap data (last N days)
   */
  getActivityHeatmap: (userId: string, days = 56) =>
    fetchApi<{ date: string; count: number; xpEarned: number }[]>(
      `/progress/user/${userId}/activity?days=${days}`,
    ),

  /**
   * Get the user's current combo count and XP multiplier
   * (lessons completed in the last 2 hours)
   */
  getCurrentCombo: (userId: string) =>
    fetchApi<{ comboCount: number; comboMultiplier: number; active: boolean }>(
      `/progress/user/${userId}/combo`,
    ),
};

// ============================================================================
// Daily Challenge Endpoints
// ============================================================================

export interface RecentActivityItem {
  id: string;
  type: string;
  timestamp: string;
  label: string;
  icon: string;
  meta: Record<string, unknown> | null;
}

export interface DailyChallenge {
  id: string;
  userId: string;
  date: string;
  lessonId: string;
  isCompleted: boolean;
  xpBonusAwarded: number;
  completedAt: string | null;
  lesson: Lesson;
  xpBonus: number;
  timeUntilReset: number;
}

export const dailyChallengeApi = {
  /**
   * Get today's challenge for a user
   */
  getToday: (userId: string) =>
    fetchApi<DailyChallenge>(`/daily-challenge/${userId}`),

  /**
   * Complete today's challenge
   */
  complete: (userId: string) =>
    fetchApi<{ challenge: DailyChallenge; xpAwarded: number; newTotalXp: number }>(
      `/daily-challenge/${userId}/complete`,
      { method: 'POST' }
    ),

  /**
   * Get challenge history
   */
  getHistory: (userId: string) =>
    fetchApi<DailyChallenge[]>(`/daily-challenge/${userId}/history`),
};

// ============================================================================
// Leaderboard Endpoints
// ============================================================================

export interface LeaderboardEntry {
  /** Rank position change vs last week: positive = moved UP, negative = DOWN, null = new entry */
  rankDelta: number | null;
  rank: number;
  userId: string;
  username: string;
  xpEarned: number;
  xpDelta: number;
  lastWeekXp: number;
  totalXp: number;      // All-time XP for league badge
  isCurrentUser: boolean;
}

export interface WeeklyLeaderboard {
  leaderboard: LeaderboardEntry[];
  userPosition: LeaderboardEntry | null;
  weekStart: string;
  weekEnd: string;
}

export interface UserWeeklyStats {
  xpThisWeek: number;
  rank: number | null;
  totalParticipants: number;
  weekStart: string;
  timeUntilReset: number;
}

export interface WeeklyXpHistoryEntry {
  weekStart: string;
  xpEarned: number;
  label: string;
}

export const leaderboardApi = {
  /**
   * Get weekly leaderboard
   */
  getWeekly: (userId: string) =>
    fetchApi<WeeklyLeaderboard>(`/leaderboard/weekly?userId=${userId}`),

  /**
   * Get user's weekly stats
   */
  getUserStats: (userId: string) =>
    fetchApi<UserWeeklyStats>(`/leaderboard/me?userId=${userId}`),

  /**
   * Get weekly XP history for the last N weeks (default 8)
   * Returns array in ascending order (oldest first)
   */
  getWeeklyHistory: (userId: string, weeks = 8) =>
    fetchApi<WeeklyXpHistoryEntry[]>(`/leaderboard/history?userId=${userId}&weeks=${weeks}`),
};

// ============================================================================
// Notifications Endpoints
// ============================================================================

export interface NotificationPreferences {
  streakReminder: boolean;
  dailyChallenge: boolean;
  inactivityReminder: boolean;
  levelUpCelebration: boolean;
  streakMilestone: boolean;
  reminderHour: number;
  timezone: string;
}

export const notificationsApi = {
  /**
   * Register a push token
   */
  registerToken: (data: {
    userId: string;
    token: string;
    platform: 'IOS' | 'ANDROID';
    deviceId?: string;
  }) =>
    fetchApi<{ id: string; token: string; platform: string; isActive: boolean }>(
      '/notifications/register-token',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  /**
   * Unregister a push token
   */
  unregisterToken: (token: string) =>
    fetchApi<null>('/notifications/unregister-token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }),

  /**
   * Get notification preferences
   */
  getPreferences: (userId: string) =>
    fetchApi<NotificationPreferences>(`/notifications/preferences/${userId}`),

  /**
   * Update notification preferences
   */
  updatePreferences: (userId: string, data: Partial<NotificationPreferences>) =>
    fetchApi<NotificationPreferences>(`/notifications/preferences/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// Analytics Endpoints
// ============================================================================

export type EventType =
  | 'APP_OPENED'
  | 'SCREEN_VIEWED'
  | 'LESSON_STARTED'
  | 'LESSON_COMPLETED'
  | 'STEP_COMPLETED'
  | 'DAILY_CHALLENGE_COMPLETED'
  | 'STREAK_UPDATED'
  | 'LEVEL_UP'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'REFERRAL_COMPLETED';

export interface TrackEventDto {
  userId: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  sessionId?: string;
  timestamp?: string;
}

export const analyticsApi = {
  /**
   * Track a single event
   */
  track: (data: TrackEventDto) =>
    fetchApi<{ success: boolean }>('/analytics/track', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Track multiple events at once
   */
  trackBatch: (data: { events: TrackEventDto[] }) =>
    fetchApi<{ success: boolean; count: number }>('/analytics/track-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get analytics summary (admin)
   */
  getSummary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    return fetchApi<{
      totalEvents: number;
      uniqueUsers: number;
      eventsByType: Record<string, number>;
      period: { start: string; end: string };
    }>(`/analytics/summary${query ? `?${query}` : ''}`);
  },

  /**
   * Full admin dashboard KPIs
   */
  getAdminDashboard: () =>
    fetchApi<{
      generatedAt: string;
      data: {
        users: {
          total: number;
          activeToday: number;
          activeThisWeek: number;
          newThisWeek: number;
          avgStreak: number;
          avgXp: number;
        };
        lessons: {
          totalCompletions: number;
          completionsToday: number;
          completionsThisWeek: number;
          topLessons: Array<{ id: string; title: string; domain: string; completions: number }>;
        };
        xp: {
          totalDistributed: number;
          distributedThisWeek: number;
          avgPerUser: number;
        };
        streaks: {
          freezesPurchased: number;
          usersWithStreakAtRisk: number;
        };
        events: {
          totalThisWeek: number;
          byType: Record<string, number>;
          byDay: Array<{ date: string; count: number }>;
        };
      };
    }>('/analytics/admin/dashboard'),

  /**
   * Investor-grade retention metrics
   */
  getRetentionMetrics: () =>
    fetchApi<{
      generatedAt: string;
      data: {
        dau: number;
        mau: number;
        dauMauRatio: number;
        d1Retention: number;
        d7Retention: number;
        d30Retention: number;
        dauTrend: Array<{ date: string; dau: number }>;
        avgSessionsPerUser: number;
        churnRate: number;
        newUsersLast7d: number;
        newUsersLast30d: number;
        avgLessonsPerDau: number;
      };
    }>('/analytics/admin/retention'),

  /**
   * Conversion funnel — signup → Pro
   */
  getFunnel: () =>
    fetchApi<{
      generatedAt: string;
      totalSignups: number;
      overallConversion: number;
      steps: Array<{
        step: number;
        label: string;
        icon: string;
        count: number;
        conversionFromPrevious: number | null;
        conversionFromTop: number;
      }>;
      dropOffs: Array<{
        fromStep: number;
        toStep: number;
        dropOff: number;
        dropOffPct: number;
      }>;
    }>('/analytics/admin/funnel'),
};

// ============================================================================
// Achievements Types & Endpoints
// ============================================================================

export type AchievementCategory = 'LEARNING' | 'STREAK' | 'XP' | 'SOCIAL' | 'SPECIAL';
export type AchievementRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type RequirementType =
  | 'LESSONS_COMPLETED'
  | 'STREAK_DAYS'
  | 'XP_EARNED'
  | 'DAILY_CHALLENGES'
  | 'DOMAIN_COMPLETED'
  | 'LEVEL_REACHED'
  | 'REFERRALS_MADE';

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  requirementType: RequirementType;
  requirementValue: number;
  xpReward: number;
  badgeUrl: string | null;
  rarity: AchievementRarity;
  orderIndex: number;
}

export interface UserAchievement {
  id: string;
  unlockedAt: string;
  xpAwarded: number;
  achievement: Achievement;
}

export interface LockedAchievement extends Achievement {
  progress: number;
}

export interface UserAchievementsResponse {
  unlocked: UserAchievement[];
  locked: LockedAchievement[];
}

export const achievementsApi = {
  /**
   * Get all achievement definitions
   */
  getAll: () => fetchApi<Achievement[]>('/achievements'),

  /**
   * Get user's achievements (unlocked + locked with progress)
   */
  getUserAchievements: (userId: string) =>
    fetchApi<UserAchievementsResponse>(`/achievements/user/${userId}`),

  /**
   * Force check achievements (for testing)
   */
  checkAchievements: (userId: string) =>
    fetchApi<{ unlockedKeys: string[]; count: number }>(`/achievements/check/${userId}`, {
      method: 'POST',
    }),
};

// ============================================================================
// Referrals Types & Endpoints
// ============================================================================

export interface ReferralInfo {
  refereeUsername: string;
  createdAt: string;
  xpAwarded: number;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  xpEarned: number;
  referrals: ReferralInfo[];
  nextTierAt: number | null;
  nextTierBonus: number | null;
}

export interface ApplyReferralResponse {
  success: boolean;
  xpAwarded: number;
  message: string;
  referrerXpAwarded: number;
}

export interface ValidateReferralResponse {
  valid: boolean;
  referrerUsername?: string;
}

export const referralsApi = {
  /**
   * Get referral stats for a user
   */
  getStats: (userId: string) => fetchApi<ReferralStats>(`/referrals/stats/${userId}`),

  /**
   * Apply a referral code
   */
  applyCode: (userId: string, referralCode: string) =>
    fetchApi<ApplyReferralResponse>('/referrals/apply', {
      method: 'POST',
      body: JSON.stringify({ userId, referralCode }),
    }),

  /**
   * Validate a referral code
   */
  validateCode: (code: string) =>
    fetchApi<ValidateReferralResponse>(`/referrals/validate/${code}`),
};

// ============================================================================
// Subscriptions API
// ============================================================================

export type SubscriptionPlan = 'FREE' | 'PRO_MONTHLY' | 'PRO_ANNUAL';
export type SubStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';

export interface PlanDetails {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | null;
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  planDetails: PlanDetails;
  isPro: boolean;
}

export const subscriptionsApi = {
  getPlans: () => fetchApi<PlanDetails[]>('/subscriptions/plans'),
  getSubscription: (userId: string) => fetchApi<UserSubscription>(`/subscriptions/${userId}`),
  subscribe: (userId: string, plan: SubscriptionPlan) =>
    fetchApi<UserSubscription>(`/subscriptions/${userId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
  cancel: (userId: string) =>
    fetchApi<UserSubscription>(`/subscriptions/${userId}/cancel`, { method: 'DELETE' }),
};

// ============================================================================
// Recommendations API
// ============================================================================

export interface LessonRecommendation {
  lessonId: string;
  title: string;
  domain: string;
  difficulty: string;
  xpReward: number;
  reason: string;
  priority: number;
  isNew: boolean;
  isWeak: boolean;
}

export interface PersonalizedPath {
  userId: string;
  dominantDomain: string | null;
  weakDomain: string | null;
  completionRate: number;
  recommendations: LessonRecommendation[];
  nextMilestone: { type: string; current: number; target: number; label: string };
  aiMessage: string;
}

export const recommendationsApi = {
  getPath: (userId: string) => fetchApi<PersonalizedPath>(`/recommendations/${userId}`),
};

// ============================================================================
// Friends API
// ============================================================================

export interface FriendWithStats {
  userId: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  league: string;
  status: string;
  weeklyXp: number;
}

export interface FriendSearchResult {
  id: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  league: string;
  friendStatus: string | null;
  requestId: string | null;
}

export const friendsApi = {
  search: (q: string, userId: string) =>
    fetchApi<FriendSearchResult[]>(`/friends/search?q=${encodeURIComponent(q)}&userId=${userId}`),
  getFriends: (userId: string) => fetchApi<FriendWithStats[]>(`/friends/${userId}/list`),
  getPendingRequests: (userId: string) => fetchApi<any[]>(`/friends/${userId}/requests`),
  sendRequest: (userId: string, receiverId: string) =>
    fetchApi<any>(`/friends/${userId}/request`, {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    }),
  acceptRequest: (requestId: string, userId: string) =>
    fetchApi<any>(`/friends/requests/${requestId}/accept?userId=${userId}`, { method: 'POST' }),
  removeOrDecline: (requestId: string, userId: string) =>
    fetchApi<any>(`/friends/requests/${requestId}?userId=${userId}`, { method: 'DELETE' }),
};

// ============================================================================
// Weekly Recap API
// ============================================================================

export interface DayActivity {
  date: string;
  dayName: string;
  xpEarned: number;
  lessonsCompleted: number;
}

export interface WeeklyRecap {
  userId: string;
  weekStart: string;
  weekEnd: string;
  xpThisWeek: number;
  lessonsThisWeek: number;
  activeDays: number;
  bestDay: DayActivity | null;
  domainBreakdown: Record<string, number>;
  dailyActivity: DayActivity[];
  xpLastWeek: number;
  lessonsLastWeek: number;
  xpDelta: number;
  lessonsDelta: number;
  currentStreak: number;
  streakDelta: number;
  message: string;
  badge: string | null;
}

export const weeklyRecapApi = {
  getRecap: (userId: string) => fetchApi<WeeklyRecap>(`/progress/${userId}/weekly-recap`),
};

// ============================================================================
// Challenges API
// ============================================================================

export interface LessonChallenge {
  id: string;
  challengerId: string;
  challengedId: string;
  lessonId: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED' | 'DECLINED';
  challengerXp: number | null;
  challengedXp: number | null;
  message: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt?: string;
  challenger?: { id: string; username: string };
  challenged?: { id: string; username: string };
  lesson?: {
    id: string;
    title: string;
    domain: string;
    xpReward: number;
    difficulty?: string;
  };
}

export const challengesApi = {
  /**
   * Send a lesson challenge to a friend
   */
  createChallenge: (dto: {
    challengerId: string;
    challengedId: string;
    lessonId: string;
    message?: string;
  }) =>
    fetchApi<LessonChallenge>('/challenges', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /**
   * Get all challenges for a user (sent + received)
   */
  getForUser: (userId: string) =>
    fetchApi<{ received: LessonChallenge[]; sent: LessonChallenge[] }>(
      `/challenges/user/${userId}`,
    ),

  /**
   * Get a single challenge by ID
   */
  getById: (id: string) => fetchApi<LessonChallenge>(`/challenges/${id}`),

  /**
   * Accept or decline a challenge
   */
  respond: (id: string, userId: string, status: 'ACCEPTED' | 'DECLINED') =>
    fetchApi<LessonChallenge>(`/challenges/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ userId, status }),
    }),

  /**
   * Record lesson completion for a challenge
   */
  recordCompletion: (id: string, userId: string, xpEarned: number) =>
    fetchApi<LessonChallenge>(`/challenges/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ userId, xpEarned }),
    }),

  /**
   * Get count of pending received challenges (for notification badge)
   */
  getPendingCount: (userId: string) =>
    fetchApi<{ pendingCount: number }>(`/challenges/user/${userId}/pending-count`),

  /**
   * Request a rematch on a completed challenge.
   * The requester becomes the new challenger on the same lesson.
   */
  rematch: (challengeId: string, requesterId: string) =>
    fetchApi<LessonChallenge>(`/challenges/${challengeId}/rematch`, {
      method: 'POST',
      body: JSON.stringify({ requesterId }),
    }),
};

// ============================================================================
// Progress Export API
// ============================================================================

export const progressExportApi = {
  /**
   * Request PDF export URL — returns the full download URL.
   * The caller (mobile) should open this URL with expo-sharing or expo-file-system.
   */
  getPdfUrl: (userId: string): string =>
    `${API_BASE_URL}/progress/${userId}/export/pdf`,
};

// ============================================================================
// Export All
// ============================================================================

export const api = {
  users: usersApi,
  lessons: lessonsApi,
  progress: progressApi,
  dailyChallenge: dailyChallengeApi,
  leaderboard: leaderboardApi,
  notifications: notificationsApi,
  analytics: analyticsApi,
  achievements: achievementsApi,
  referrals: referralsApi,
  subscriptions: subscriptionsApi,
  recommendations: recommendationsApi,
  friends: friendsApi,
  progressExport: progressExportApi,
  weeklyRecap: weeklyRecapApi,
  challenges: challengesApi,
};

export default api;

