/**
 * WeeklyRecapService
 *
 * Generates a motivational weekly learning recap for a user.
 * Returns stats for the current week (Mon-Sun):
 *   - XP earned this week
 *   - Lessons completed this week
 *   - Streak delta
 *   - Best day (most XP)
 *   - Domain breakdown for the week
 *   - Comparison with previous week
 *   - Personalized motivational message
 *   - League progress
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Domain, EventType } from '@prisma/client';

export interface DayActivity {
  date: string; // ISO date YYYY-MM-DD
  dayName: string; // Mon, Tue, ...
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
  domainBreakdown: Record<Domain, number>;
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

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Injectable()
export class WeeklyRecapService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyRecap(userId: string): Promise<WeeklyRecap> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, xp: true, streak: true, level: true },
    });

    if (!user) {
      return this.emptyRecap(userId);
    }

    const now = new Date();

    // ── Week boundaries (Mon–Sun) ──────────────────────────────────────────
    const weekStart = this.getMonday(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setMilliseconds(-1);

    // ── Use analytics events (LESSON_COMPLETED) to count this week ────────
    const thisWeekEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventType: EventType.LESSON_COMPLETED,
        timestamp: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true, eventData: true },
    });

    const lastWeekEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventType: EventType.LESSON_COMPLETED,
        timestamp: { gte: lastWeekStart, lte: lastWeekEnd },
      },
      select: { timestamp: true, eventData: true },
    });

    // ── Build daily breakdown ─────────────────────────────────────────────
    const dailyMap: Record<string, DayActivity> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const iso = this.toIso(date);
      dailyMap[iso] = {
        date: iso,
        dayName: DAY_NAMES[date.getDay()],
        xpEarned: 0,
        lessonsCompleted: 0,
      };
    }

    // Fill with this week events
    for (const ev of thisWeekEvents) {
      const iso = this.toIso(ev.timestamp);
      if (dailyMap[iso]) {
        dailyMap[iso].lessonsCompleted++;
        // Try to extract xpReward from eventData
        const xp = this.extractXp(ev.eventData);
        dailyMap[iso].xpEarned += xp;
      }
    }

    const dailyActivity = Object.values(dailyMap);

    // ── Domain breakdown — derive from all progress completed this week ────
    // Since UserProgress has no timestamp, fall back to eventData
    const domainBreakdown: Record<Domain, number> = {
      CRYPTO: 0,
      FINANCE: 0,
      TRADING: 0,
    };
    for (const ev of thisWeekEvents) {
      const domain = this.extractDomain(ev.eventData);
      if (domain && domain in domainBreakdown) {
        domainBreakdown[domain as Domain]++;
      }
    }

    // ── Aggregate stats ───────────────────────────────────────────────────
    const lessonsThisWeek = thisWeekEvents.length;
    const lessonsLastWeek = lastWeekEvents.length;

    // XP: sum from event data, fallback to estimate (20 XP per lesson)
    const xpThisWeek = thisWeekEvents.reduce(
      (sum, ev) => sum + this.extractXp(ev.eventData),
      0,
    ) || lessonsThisWeek * 20;

    const xpLastWeek = lastWeekEvents.reduce(
      (sum, ev) => sum + this.extractXp(ev.eventData),
      0,
    ) || lessonsLastWeek * 20;

    const activeDays = dailyActivity.filter((d) => d.lessonsCompleted > 0).length;
    const bestDay =
      dailyActivity.reduce(
        (best, d) =>
          d.xpEarned > (best?.xpEarned ?? -1) ? d : best,
        null as DayActivity | null,
      ) ?? null;

    const xpDelta = xpThisWeek - xpLastWeek;
    const lessonsDelta = lessonsThisWeek - lessonsLastWeek;

    // ── Message + badge ───────────────────────────────────────────────────
    const { message, badge } = this.buildMessage(
      user.username,
      xpThisWeek,
      lessonsThisWeek,
      activeDays,
      xpDelta,
      user.streak,
    );

    return {
      userId,
      weekStart: this.toIso(weekStart),
      weekEnd: this.toIso(weekEnd),
      xpThisWeek,
      lessonsThisWeek,
      activeDays,
      bestDay: bestDay && bestDay.xpEarned > 0 ? bestDay : null,
      domainBreakdown,
      dailyActivity,
      xpLastWeek,
      lessonsLastWeek,
      xpDelta,
      lessonsDelta,
      currentStreak: user.streak,
      streakDelta: activeDays,
      message,
      badge,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private extractXp(eventData: unknown): number {
    if (typeof eventData === 'object' && eventData !== null) {
      const data = eventData as Record<string, unknown>;
      return typeof data['xpReward'] === 'number'
        ? data['xpReward']
        : typeof data['xpEarned'] === 'number'
        ? data['xpEarned']
        : 20;
    }
    return 20;
  }

  private extractDomain(eventData: unknown): string | null {
    if (typeof eventData === 'object' && eventData !== null) {
      const data = eventData as Record<string, unknown>;
      return typeof data['domain'] === 'string' ? data['domain'] : null;
    }
    return null;
  }

  private buildMessage(
    username: string,
    xpThisWeek: number,
    lessonsThisWeek: number,
    activeDays: number,
    xpDelta: number,
    streak: number,
  ): { message: string; badge: string | null } {
    if (lessonsThisWeek === 0) {
      return {
        message: `Hey ${username}, this week was quiet. Let's change that — even 1 lesson a day adds up fast. 💪`,
        badge: null,
      };
    }

    if (activeDays >= 7) {
      return {
        message: `PERFECT WEEK, ${username}! 🏆 7 days of learning in a row — that's elite discipline. Keep the streak alive!`,
        badge: '🏆 Perfect Week',
      };
    }

    if (xpDelta > 0 && xpThisWeek >= 200) {
      return {
        message: `On fire this week, ${username}! +${xpThisWeek} XP${xpDelta > 0 ? ` and +${xpDelta} vs last week` : ''}. You're in the top tier 🔥`,
        badge: '🔥 On Fire',
      };
    }

    if (lessonsThisWeek >= 5) {
      return {
        message: `Solid week, ${username}! ${lessonsThisWeek} lessons completed. ${streak >= 7 ? `That ${streak}-day streak is real momentum` : 'Build your streak for bonus XP'}. 📈`,
        badge: activeDays >= 5 ? '⚡ Consistent' : null,
      };
    }

    return {
      message: `Good start, ${username}. ${lessonsThisWeek} lesson${lessonsThisWeek > 1 ? 's' : ''} this week. Push for ${Math.max(5, lessonsThisWeek + 2)} next week to level up faster. 🚀`,
      badge: null,
    };
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toIso(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private emptyRecap(userId: string): WeeklyRecap {
    const weekStart = this.getMonday(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const dailyActivity: DayActivity[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return {
        date: this.toIso(date),
        dayName: DAY_NAMES[date.getDay()],
        xpEarned: 0,
        lessonsCompleted: 0,
      };
    });

    return {
      userId,
      weekStart: this.toIso(weekStart),
      weekEnd: this.toIso(weekEnd),
      xpThisWeek: 0,
      lessonsThisWeek: 0,
      activeDays: 0,
      bestDay: null,
      domainBreakdown: { CRYPTO: 0, FINANCE: 0, TRADING: 0 },
      dailyActivity,
      xpLastWeek: 0,
      lessonsLastWeek: 0,
      xpDelta: 0,
      lessonsDelta: 0,
      currentStreak: 0,
      streakDelta: 0,
      message: "Let's start your learning journey! 🚀",
      badge: null,
    };
  }
}
