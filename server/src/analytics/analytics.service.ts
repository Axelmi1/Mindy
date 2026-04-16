import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType, Prisma } from '@prisma/client';

// ─── Retention Metrics ────────────────────────────────────────────────────────
export interface RetentionMetrics {
  /** Daily Active Users (last 24h unique users) */
  dau: number;
  /** Monthly Active Users (last 30 days unique users) */
  mau: number;
  /** DAU/MAU ratio (stickiness, 0–1) */
  dauMauRatio: number;
  /** D1 retention: % of users who came back on day 2 after signup */
  d1Retention: number;
  /** D7 retention: % of users active within days 2–8 of signup */
  d7Retention: number;
  /** D30 retention: % of users active within days 2–31 of signup */
  d30Retention: number;
  /** 30-day DAU trend [{date, dau}] */
  dauTrend: Array<{ date: string; dau: number }>;
  /** Avg sessions per DAU (last 7 days) */
  avgSessionsPerUser: number;
  /** Churn rate (% MAU lost since last month) */
  churnRate: number;
  /** New users last 7 days */
  newUsersLast7d: number;
  /** New users last 30 days */
  newUsersLast30d: number;
  /** Avg lessons per DAU */
  avgLessonsPerDau: number;
}

export interface AdminDashboardStats {
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
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a single analytics event
   */
  async track(
    userId: string,
    eventType: EventType,
    eventData?: Record<string, unknown>,
    sessionId?: string,
  ) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventData: eventData as Prisma.JsonValue ?? Prisma.JsonNull,
        sessionId,
      },
    });
  }

  /**
   * Track multiple events at once (batch insert)
   */
  async trackBatch(
    events: Array<{
      userId: string;
      eventType: EventType;
      eventData?: Record<string, unknown>;
      sessionId?: string;
      timestamp?: Date;
    }>,
  ) {
    return this.prisma.analyticsEvent.createMany({
      data: events.map((e) => ({
        userId: e.userId,
        eventType: e.eventType,
        eventData: e.eventData as Prisma.JsonValue ?? Prisma.JsonNull,
        sessionId: e.sessionId,
        timestamp: e.timestamp ?? new Date(),
      })),
    });
  }

  /**
   * Get event counts by type for a date range
   */
  async getEventCounts(startDate: Date, endDate: Date) {
    return this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });
  }

  /**
   * Get daily active users count
   */
  async getDailyActiveUsers(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return result.length;
  }

  /**
   * Get summary stats for dashboard
   */
  async getSummary(startDate: Date, endDate: Date) {
    const [eventCounts, totalEvents, uniqueUsers] = await Promise.all([
      this.getEventCounts(startDate, endDate),
      this.prisma.analyticsEvent.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return {
      totalEvents,
      uniqueUsers: uniqueUsers.length,
      eventsByType: eventCounts.reduce(
        (acc, item) => {
          acc[item.eventType] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Full admin dashboard stats — all KPIs in one query batch
   */
  async getAdminDashboard(): Promise<AdminDashboardStats> {
    const now = new Date();

    // Date boundaries
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Run all queries in parallel
    const [
      totalUsers,
      usersRaw,
      activeTodayGroups,
      activeWeekGroups,
      newThisWeek,
      completionsTotal,
      completionsToday,
      completionsThisWeek,
      topLessonsRaw,
      xpEvents,
      freezeEvents,
      eventCountsByType,
    ] = await Promise.all([
      // Total users
      this.prisma.user.count(),

      // All users for streak/XP aggregates (limit 500 for performance)
      this.prisma.user.findMany({
        select: { xp: true, streak: true, lastActiveAt: true },
        take: 500,
      }),

      // Active today (unique users with events today)
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: todayStart } },
      }),

      // Active this week
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: weekStart } },
      }),

      // New users this week
      this.prisma.user.count({
        where: { createdAt: { gte: weekStart } },
      }),

      // Total lesson completions
      this.prisma.userProgress.count({ where: { isCompleted: true } }),

      // Completions today (via analytics events)
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'LESSON_COMPLETED',
          timestamp: { gte: todayStart },
        },
      }),

      // Completions this week (via analytics events)
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'LESSON_COMPLETED',
          timestamp: { gte: weekStart },
        },
      }),

      // Top lessons by completion count
      this.prisma.userProgress.groupBy({
        by: ['lessonId'],
        where: { isCompleted: true },
        _count: { lessonId: true },
        orderBy: { _count: { lessonId: 'desc' } },
        take: 10,
      }),

      // XP events this week for total XP distributed
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'LESSON_COMPLETED',
          timestamp: { gte: weekStart },
        },
        select: { eventData: true },
        take: 1000,
      }),

      // Streak freeze purchases this week
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'STREAK_FREEZE_PURCHASED',
          timestamp: { gte: weekStart },
        },
      }),

      // Event counts by type this week
      this.prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: { timestamp: { gte: weekStart } },
        _count: true,
        orderBy: { _count: { eventType: 'desc' } },
      }),
    ]);

    // Resolve top lesson titles
    const lessonIds = topLessonsRaw.map((r) => r.lessonId);
    const lessonsInfo = lessonIds.length > 0
      ? await this.prisma.lesson.findMany({
          where: { id: { in: lessonIds } },
          select: { id: true, title: true, domain: true },
        })
      : [];

    const lessonMap = new Map(lessonsInfo.map((l) => [l.id, l]));
    const topLessons = topLessonsRaw.map((r) => ({
      id: r.lessonId,
      title: lessonMap.get(r.lessonId)?.title ?? 'Unknown',
      domain: lessonMap.get(r.lessonId)?.domain ?? 'UNKNOWN',
      completions: r._count.lessonId,
    }));

    // Aggregate XP from LESSON_COMPLETED events
    let xpThisWeek = 0;
    for (const ev of xpEvents) {
      const data = ev.eventData as Record<string, unknown> | null;
      if (data && typeof data['xpEarned'] === 'number') {
        xpThisWeek += data['xpEarned'];
      }
    }

    // User aggregates
    const totalXp = usersRaw.reduce((sum, u) => sum + u.xp, 0);
    const avgXp = usersRaw.length > 0 ? Math.round(totalXp / usersRaw.length) : 0;
    const totalStreak = usersRaw.reduce((sum, u) => sum + u.streak, 0);
    const avgStreak = usersRaw.length > 0 ? Math.round((totalStreak / usersRaw.length) * 10) / 10 : 0;

    // Users with streak at risk (lastActiveAt = yesterday, not today)
    const usersWithStreakAtRisk = usersRaw.filter((u) => {
      if (!u.lastActiveAt || u.streak === 0) return false;
      const lastActive = new Date(u.lastActiveAt);
      return lastActive < todayStart && lastActive >= yesterday;
    }).length;

    // Events by day (last 7 days)
    const byDay: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await this.prisma.analyticsEvent.count({
        where: { timestamp: { gte: dayStart, lte: dayEnd } },
      });

      byDay.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    return {
      users: {
        total: totalUsers,
        activeToday: activeTodayGroups.length,
        activeThisWeek: activeWeekGroups.length,
        newThisWeek,
        avgStreak,
        avgXp,
      },
      lessons: {
        totalCompletions: completionsTotal,
        completionsToday,
        completionsThisWeek,
        topLessons,
      },
      xp: {
        totalDistributed: totalXp,
        distributedThisWeek: xpThisWeek,
        avgPerUser: avgXp,
      },
      streaks: {
        freezesPurchased: freezeEvents,
        usersWithStreakAtRisk,
      },
      events: {
        totalThisWeek: eventCountsByType.reduce((s, e) => s + e._count, 0),
        byType: eventCountsByType.reduce(
          (acc, item) => {
            acc[item.eventType] = item._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        byDay,
      },
    };
  }

  /**
   * Retention Metrics — investor-grade KPIs
   * D1/D7/D30 retention, DAU/MAU stickiness, churn rate, 30-day trend
   */
  async getRetentionMetrics(): Promise<RetentionMetrics> {
    const now = new Date();

    // ── Time boundaries ──────────────────────────────────────────────────────
    const last24h    = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30d    = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60d    = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const last7d     = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev30dEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev30dStart= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // ── DAU / MAU ────────────────────────────────────────────────────────────
    const [dauRaw, mauRaw] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: last24h } },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: last30d } },
      }),
    ]);

    const dau = dauRaw.length;
    const mau = mauRaw.length;
    const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 1000) / 1000 : 0;

    // ── New users last 7d / 30d ──────────────────────────────────────────────
    const [newUsersLast7d, newUsersLast30d] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: last7d } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30d } } }),
    ]);

    // ── D1 retention ─────────────────────────────────────────────────────────
    // Cohort: users who registered 2+ days ago (so day-2 window has passed)
    const d1CohortStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d1CohortEnd   = new Date(now.getTime() - 2  * 24 * 60 * 60 * 1000);

    const d1Cohort = await this.prisma.user.findMany({
      where: { createdAt: { gte: d1CohortStart, lte: d1CohortEnd } },
      select: { id: true, createdAt: true },
    });

    let d1Returned = 0;
    for (const user of d1Cohort) {
      const day2Start = new Date(user.createdAt.getTime() + 24 * 60 * 60 * 1000);
      const day2End   = new Date(user.createdAt.getTime() + 48 * 60 * 60 * 1000);
      const returned = await this.prisma.analyticsEvent.count({
        where: {
          userId: user.id,
          timestamp: { gte: day2Start, lte: day2End },
        },
      });
      if (returned > 0) d1Returned++;
    }
    const d1Retention = d1Cohort.length > 0
      ? Math.round((d1Returned / d1Cohort.length) * 1000) / 10
      : 0;

    // ── D7 retention ─────────────────────────────────────────────────────────
    const d7CohortStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d7CohortEnd   = new Date(now.getTime() - 8  * 24 * 60 * 60 * 1000);

    const d7Cohort = await this.prisma.user.findMany({
      where: { createdAt: { gte: d7CohortStart, lte: d7CohortEnd } },
      select: { id: true, createdAt: true },
      take: 200, // performance cap
    });

    let d7Returned = 0;
    for (const user of d7Cohort) {
      const windowStart = new Date(user.createdAt.getTime() + 24 * 60 * 60 * 1000);
      const windowEnd   = new Date(user.createdAt.getTime() + 8  * 24 * 60 * 60 * 1000);
      const returned = await this.prisma.analyticsEvent.count({
        where: {
          userId: user.id,
          timestamp: { gte: windowStart, lte: windowEnd },
        },
      });
      if (returned > 0) d7Returned++;
    }
    const d7Retention = d7Cohort.length > 0
      ? Math.round((d7Returned / d7Cohort.length) * 1000) / 10
      : 0;

    // ── D30 retention ────────────────────────────────────────────────────────
    const d30CohortStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const d30CohortEnd   = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

    const d30Cohort = await this.prisma.user.findMany({
      where: { createdAt: { gte: d30CohortStart, lte: d30CohortEnd } },
      select: { id: true, createdAt: true },
      take: 200,
    });

    let d30Returned = 0;
    for (const user of d30Cohort) {
      const windowStart = new Date(user.createdAt.getTime() + 24  * 60 * 60 * 1000);
      const windowEnd   = new Date(user.createdAt.getTime() + 31 * 24 * 60 * 60 * 1000);
      const returned = await this.prisma.analyticsEvent.count({
        where: {
          userId: user.id,
          timestamp: { gte: windowStart, lte: windowEnd },
        },
      });
      if (returned > 0) d30Returned++;
    }
    const d30Retention = d30Cohort.length > 0
      ? Math.round((d30Returned / d30Cohort.length) * 1000) / 10
      : 0;

    // ── 30-day DAU trend ─────────────────────────────────────────────────────
    const dauTrend: Array<{ date: string; dau: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const uniqueUsers = await this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: dayStart, lte: dayEnd } },
      });
      dauTrend.push({
        date: dayStart.toISOString().slice(0, 10),
        dau: uniqueUsers.length,
      });
    }

    // ── Avg sessions per user (last 7d) ──────────────────────────────────────
    const appOpenedLast7d = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'APP_OPENED',
        timestamp: { gte: last7d },
      },
    });
    const activeUsersLast7d = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: last7d } },
    });
    const avgSessionsPerUser = activeUsersLast7d.length > 0
      ? Math.round((appOpenedLast7d / activeUsersLast7d.length) * 10) / 10
      : 0;

    // ── Churn rate ───────────────────────────────────────────────────────────
    // % of users active 30–60 days ago who were NOT active in the last 30 days
    const prevMonthUsersRaw = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: prev30dStart, lte: prev30dEnd } },
    });
    const prevMonthUserIds = new Set(prevMonthUsersRaw.map((u) => u.userId));
    const currentMonthUsersRaw = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: last30d } },
    });
    const currentMonthUserIds = new Set(currentMonthUsersRaw.map((u) => u.userId));

    let churned = 0;
    for (const uid of prevMonthUserIds) {
      if (!currentMonthUserIds.has(uid)) churned++;
    }
    const churnRate = prevMonthUserIds.size > 0
      ? Math.round((churned / prevMonthUserIds.size) * 1000) / 10
      : 0;

    // ── Avg lessons per DAU ──────────────────────────────────────────────────
    const lessonsToday = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'LESSON_COMPLETED',
        timestamp: { gte: last24h },
      },
    });
    const avgLessonsPerDau = dau > 0
      ? Math.round((lessonsToday / dau) * 10) / 10
      : 0;

    return {
      dau,
      mau,
      dauMauRatio,
      d1Retention,
      d7Retention,
      d30Retention,
      dauTrend,
      avgSessionsPerUser,
      churnRate,
      newUsersLast7d,
      newUsersLast30d,
      avgLessonsPerDau,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FUNNEL ANALYTICS — conversion steps from signup → paying
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Investor-grade acquisition & conversion funnel
   *
   * Steps:
   *  1. Total registered users (signups)
   *  2. Completed onboarding (set a domain preference)
   *  3. Completed first lesson
   *  4. Active at D7 (≥1 lesson in first 7 days)
   *  5. Active at D30 (≥1 lesson in first 30 days)
   *  6. Current Pro subscribers
   *
   * Returns absolute counts + conversion rates between each step.
   */
  async getFunnelAnalytics() {
    // Step 1: Total signups
    const totalSignups = await this.prisma.user.count();

    // Step 2: Completed onboarding (preferredDomain is set)
    const completedOnboarding = await this.prisma.user.count({
      where: { preferredDomain: { not: null } },
    });

    // Step 3: Completed first lesson (has at least 1 completed UserProgress)
    const completedFirstLesson = await this.prisma.userProgress.groupBy({
      by: ['userId'],
      where: { isCompleted: true },
      _count: { userId: true },
    });
    const usersWithLesson = completedFirstLesson.length;

    // Step 4: Active at D7 — users who completed ≥1 lesson within 7 days of signup
    const now = new Date();
    const allUsers = await this.prisma.user.findMany({
      select: { id: true, createdAt: true },
    });

    let activeD7 = 0;
    let activeD30 = 0;

    // Batch: use LESSON_COMPLETED analytics events to determine activity dates
    const allProgress = await this.prisma.analyticsEvent.findMany({
      where: { eventType: 'LESSON_COMPLETED' },
      select: { userId: true, timestamp: true },
    });

    // Build a map: userId → list of completion dates
    const progressByUser = new Map<string, Date[]>();
    for (const p of allProgress) {
      const arr = progressByUser.get(p.userId) ?? [];
      arr.push(new Date(p.timestamp));
      progressByUser.set(p.userId, arr);
    }

    for (const user of allUsers) {
      const signupDate = new Date(user.createdAt);
      const d7Cutoff = new Date(signupDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const d30Cutoff = new Date(signupDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const completions = progressByUser.get(user.id) ?? [];
      const hasD7Activity = completions.some((d) => d >= signupDate && d <= d7Cutoff);
      const hasD30Activity = completions.some((d) => d >= signupDate && d <= d30Cutoff);

      if (hasD7Activity) activeD7++;
      if (hasD30Activity) activeD30++;
    }

    // Step 6: Pro subscribers (active, non-expired)
    const proSubscribers = await this.prisma.subscription.count({
      where: {
        plan: { not: 'FREE' },
        status: 'ACTIVE',
      },
    });

    // ── Conversion rates ────────────────────────────────────────────────────
    const pct = (a: number, b: number) =>
      b === 0 ? 0 : Math.round((a / b) * 1000) / 10; // 1 decimal

    const steps = [
      {
        step: 1,
        label: 'Signups',
        icon: '👤',
        count: totalSignups,
        conversionFromPrevious: null,
        conversionFromTop: 100,
      },
      {
        step: 2,
        label: 'Onboarding complété',
        icon: '🎯',
        count: completedOnboarding,
        conversionFromPrevious: pct(completedOnboarding, totalSignups),
        conversionFromTop: pct(completedOnboarding, totalSignups),
      },
      {
        step: 3,
        label: 'Première leçon',
        icon: '📖',
        count: usersWithLesson,
        conversionFromPrevious: pct(usersWithLesson, completedOnboarding),
        conversionFromTop: pct(usersWithLesson, totalSignups),
      },
      {
        step: 4,
        label: 'Actif J+7',
        icon: '🔥',
        count: activeD7,
        conversionFromPrevious: pct(activeD7, usersWithLesson),
        conversionFromTop: pct(activeD7, totalSignups),
      },
      {
        step: 5,
        label: 'Actif J+30',
        icon: '📅',
        count: activeD30,
        conversionFromPrevious: pct(activeD30, activeD7),
        conversionFromTop: pct(activeD30, totalSignups),
      },
      {
        step: 6,
        label: 'Abonnés Pro',
        icon: '⭐',
        count: proSubscribers,
        conversionFromPrevious: pct(proSubscribers, activeD30),
        conversionFromTop: pct(proSubscribers, totalSignups),
      },
    ];

    // Drop-off between each step
    const dropOffs = steps.slice(1).map((step, i) => ({
      fromStep: i + 1,
      toStep: step.step,
      dropOff: steps[i].count - step.count,
      dropOffPct: pct(steps[i].count - step.count, steps[i].count),
    }));

    return {
      generatedAt: now.toISOString(),
      totalSignups,
      steps,
      dropOffs,
      overallConversion: pct(proSubscribers, totalSignups),
    };
  }
}
