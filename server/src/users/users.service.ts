import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import type { CreateUserDto, UpdateUserDto } from '@mindy/shared';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: AnalyticsService,
    private readonly achievementCheckerService: AchievementCheckerService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  /**
   * Create a new user.
   * Email is optional — falls back to a generated address when omitted.
   */
  async create(data: CreateUserDto) {
    const referralCode = this.generateShortCode();
    const ts = Date.now();
    const finalEmail =
      data.email ??
      `${data.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${ts}@mindy.app`;
    return this.prisma.user.create({
      data: {
        email: finalEmail,
        username: data.username,
        referralCode,
        preferredDomain: data.preferredDomain ?? null,
        userGoal: data.userGoal ?? null,
        dailyMinutes: data.dailyMinutes ?? null,
        reminderHour: data.reminderHour ?? null,
      },
    });
  }

  /**
   * Generate a short alphanumeric code for referrals
   */
  private generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Find all users (with pagination)
   */
  async findAll(limit = 20, offset = 0) {
    return this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by username (case-insensitive)
   */
  async findByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Update a user
   */
  async update(id: string, data: UpdateUserDto) {
    await this.findById(id); // Ensure user exists

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(data.dailyMinutes !== undefined && { dailyMinutes: data.dailyMinutes }),
        ...(data.reminderHour !== undefined && { reminderHour: data.reminderHour }),
        ...(data.hasSeenInvitePrompt !== undefined && { hasSeenInvitePrompt: data.hasSeenInvitePrompt }),
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Add XP to user and handle level-up logic
   */
  async addXp(id: string, xpAmount: number) {
    const user = await this.findById(id);
    const newXp = user.xp + xpAmount;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > user.level;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        xp: newXp,
        level: newLevel,
        lastActiveAt: new Date(),
      },
    });

    // Send level up notification and track analytics
    if (leveledUp) {
      await this.notificationsService.sendLevelUpNotification(id, newLevel);
      await this.analyticsService.track(id, 'LEVEL_UP', {
        previousLevel: user.level,
        newLevel,
        xpAwarded: xpAmount,
      });
    }

    // Check achievements for XP milestones
    await this.achievementCheckerService.checkAndUnlock(id, 'xp_gained');

    return updatedUser;
  }

  /**
   * Update user streak with streak freeze logic
   */
  async updateStreak(id: string) {
    const user = await this.findById(id);
    const now = new Date();
    const lastActive = user.lastActiveAt;

    let newStreak = user.streak;
    let freezeUsed = false;

    if (!lastActive) {
      // First activity
      newStreak = 1;
    } else {
      const daysSinceLastActive = this.daysBetween(lastActive, now);

      if (daysSinceLastActive === 0) {
        // Same day, no change
      } else if (daysSinceLastActive === 1) {
        // Consecutive day, increment streak
        newStreak = user.streak + 1;
      } else if (daysSinceLastActive === 2 && user.streakFreezes > 0) {
        // Missed one day but have freeze available
        // Check if freeze wasn't already used today
        const freezeUsedToday = user.streakFreezeUsedAt &&
          this.daysBetween(user.streakFreezeUsedAt, now) === 0;

        if (!freezeUsedToday) {
          // Use streak freeze to maintain streak
          newStreak = user.streak + 1;
          freezeUsed = true;
        } else {
          // Freeze already used, reset streak
          newStreak = 1;
        }
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    }

    // Update maxStreak if needed
    const newMaxStreak = Math.max(user.maxStreak, newStreak);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        streak: newStreak,
        maxStreak: newMaxStreak,
        lastActiveAt: now,
        ...(freezeUsed && {
          streakFreezes: { decrement: 1 },
          streakFreezeUsedAt: now,
        }),
      },
    });

    // Track analytics
    await this.analyticsService.track(id, 'STREAK_UPDATED', {
      previousStreak: user.streak,
      newStreak,
      freezeUsed,
    });

    // Send streak milestone notification
    await this.notificationsService.sendStreakMilestoneNotification(id, newStreak);

    // Check achievements for streak milestones
    await this.achievementCheckerService.checkAndUnlock(id, 'streak_updated');

    return updatedUser;
  }

  /**
   * Check if user's streak is at risk (missed today)
   */
  isStreakAtRisk(lastActiveAt: Date | null): boolean {
    if (!lastActiveAt) return false;
    const daysSince = this.daysBetween(lastActiveAt, new Date());
    return daysSince >= 1;
  }

  /**
   * Update user settings (sound, etc.)
   */
  async updateSettings(id: string, settings: { soundEnabled?: boolean }) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: settings,
    });
  }

  /**
   * Buy a streak freeze using XP (costs FREEZE_COST XP, max 3 freezes).
   * Throws BadRequestException if insufficient XP or already at max.
   */
  async buyStreakFreeze(id: string): Promise<{
    xp: number;
    streakFreezes: number;
    xpSpent: number;
  }> {
    const FREEZE_COST = 50;
    const MAX_FREEZES = 3;

    const user = await this.findById(id);

    if (user.streakFreezes >= MAX_FREEZES) {
      throw new BadRequestException(`Maximum ${MAX_FREEZES} streak freezes allowed`);
    }
    if (user.xp < FREEZE_COST) {
      throw new BadRequestException(`Not enough XP — need ${FREEZE_COST} XP (you have ${user.xp})`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        xp: { decrement: FREEZE_COST },
        streakFreezes: { increment: 1 },
      },
    });

    this.analyticsService.track(id, 'STREAK_FREEZE_PURCHASED', {
      xpSpent: FREEZE_COST,
      freezesAfter: updated.streakFreezes,
    });

    return {
      xp: updated.xp,
      streakFreezes: updated.streakFreezes,
      xpSpent: FREEZE_COST,
    };
  }

  /**
   * Get user stats for dashboard — includes rank and domain breakdown
   */
  async getStats(id: string) {
    const user = await this.findById(id);

    // Run all queries in parallel for performance
    const [completedCount, totalCount, achievementsUnlocked, weeklyStats, domainBreakdown] =
      await Promise.all([
        this.prisma.userProgress.count({
          where: { userId: id, isCompleted: true },
        }),
        this.prisma.lesson.count(),
        this.prisma.userAchievement.count({
          where: { userId: id },
        }),
        // Get weekly rank (non-blocking — null if not on leaderboard yet)
        this.leaderboardService.getUserWeeklyStats(id).catch(() => null),
        // Get per-domain completion breakdown
        this.getDomainStats(id),
      ]);

    return {
      username: user.username,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      maxStreak: user.maxStreak,
      streakFreezes: user.streakFreezes,
      streakAtRisk: this.isStreakAtRisk(user.lastActiveAt),
      soundEnabled: user.soundEnabled,
      lessonsCompleted: completedCount,
      totalLessons: totalCount,
      achievementsUnlocked,
      referralCode: user.referralCode,
      userRank: weeklyStats?.rank ?? null,
      domainStats: domainBreakdown,
    };
  }

  /**
   * Get the last N activity events for a user's timeline feed.
   * Returns a human-readable list of actions (lessons, streaks, achievements, challenges).
   */
  async getRecentActivity(userId: string, limit = 10) {
    await this.findById(userId); // ensure user exists

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventType: {
          in: [
            'LESSON_COMPLETED',
            'STREAK_UPDATED',
            'STREAK_FREEZE_PURCHASED',
            'ACHIEVEMENT_UNLOCKED',
            'CHALLENGE_SENT',
            'CHALLENGE_ACCEPTED',
            'CHALLENGE_COMPLETED',
            'XP_EARNED',
            'COMBO_BONUS',
          ] as any,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        eventData: true,
        timestamp: true,
      },
    });

    return events.map((ev) => {
      const data = ev.eventData as Record<string, unknown> | null;
      return {
        id: ev.id,
        type: ev.eventType,
        timestamp: ev.timestamp.toISOString(),
        label: this.formatActivityLabel(ev.eventType, data),
        icon: this.getActivityIcon(ev.eventType),
        meta: data,
      };
    });
  }

  /** Human-readable label for each event type */
  private formatActivityLabel(
    eventType: string,
    data: Record<string, unknown> | null,
  ): string {
    switch (eventType) {
      case 'LESSON_COMPLETED': {
        const title = data?.lessonTitle as string | undefined;
        const xp = data?.xpEarned as number | undefined;
        return title
          ? `Leçon terminée : ${title}${xp ? ` (+${xp} XP)` : ''}`
          : 'Leçon terminée';
      }
      case 'STREAK_UPDATED': {
        const streak = data?.streak as number | undefined;
        return streak != null ? `Streak mis à jour : ${streak} jours 🔥` : 'Streak mis à jour';
      }
      case 'STREAK_FREEZE_PURCHASED':
        return 'Streak Freeze acheté ❄️';
      case 'ACHIEVEMENT_UNLOCKED': {
        const name = data?.achievementName as string | undefined;
        return name ? `Badge débloqué : ${name} 🏆` : 'Badge débloqué';
      }
      case 'CHALLENGE_SENT': {
        const challenged = data?.challengedUsername as string | undefined;
        return challenged ? `Défi envoyé à ${challenged} ⚔️` : 'Défi envoyé';
      }
      case 'CHALLENGE_ACCEPTED': {
        const challenger = data?.challengerUsername as string | undefined;
        return challenger ? `Défi accepté de ${challenger} ⚔️` : 'Défi accepté';
      }
      case 'CHALLENGE_COMPLETED':
        return 'Défi terminé ⚔️';
      case 'COMBO_BONUS': {
        const mult = data?.comboMultiplier as number | undefined;
        return mult ? `Combo ×${mult} activé 🔥` : 'Combo bonus activé';
      }
      case 'XP_EARNED': {
        const xp = data?.xpEarned as number | undefined;
        return xp ? `+${xp} XP gagné` : 'XP gagné';
      }
      default:
        return eventType.replace(/_/g, ' ').toLowerCase();
    }
  }

  /** Emoji icon for timeline display */
  private getActivityIcon(eventType: string): string {
    const icons: Record<string, string> = {
      LESSON_COMPLETED: '📖',
      STREAK_UPDATED: '🔥',
      STREAK_FREEZE_PURCHASED: '❄️',
      ACHIEVEMENT_UNLOCKED: '🏆',
      CHALLENGE_SENT: '⚔️',
      CHALLENGE_ACCEPTED: '⚔️',
      CHALLENGE_COMPLETED: '⚔️',
      COMBO_BONUS: '🔥',
      XP_EARNED: '⚡',
    };
    return icons[eventType] ?? '📌';
  }

  /**
   * Get completed + total lesson counts per domain
   */
  private async getDomainStats(userId: string) {
    const domains = ['CRYPTO', 'FINANCE', 'TRADING'] as const;
    const domainMeta: Record<string, { label: string; emoji: string }> = {
      CRYPTO: { label: 'Crypto', emoji: '₿' },
      FINANCE: { label: 'Finance', emoji: '📈' },
      TRADING: { label: 'Trading', emoji: '📊' },
    };

    const results = await Promise.all(
      domains.map(async (domain) => {
        const [completed, total] = await Promise.all([
          this.prisma.userProgress.count({
            where: {
              userId,
              isCompleted: true,
              lesson: { domain },
            },
          }),
          this.prisma.lesson.count({ where: { domain } }),
        ]);

        return {
          domain,
          completed,
          total,
          label: domainMeta[domain].label,
          emoji: domainMeta[domain].emoji,
        };
      }),
    );

    return results;
  }

  /**
   * Calculate level based on XP
   * Level formula: level = floor(sqrt(xp / 100)) + 1
   */
  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round(Math.abs((d2.getTime() - d1.getTime()) / oneDay));
  }

  /**
   * Get social stats for a user:
   * - Challenges sent / received / won / lost / draw
   * - Average weekly rank over the last 4 weeks
   * - Win rate (%) rounded to 1 decimal
   */
  async getSocialStats(userId: string): Promise<{
    challengesSent: number;
    challengesReceived: number;
    challengesWon: number;
    challengesLost: number;
    challengesDraw: number;
    winRate: number;
    avgRank4Weeks: number | null;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // ── Challenge stats ────────────────────────────────────────────────────
    const [asSent, asReceived] = await Promise.all([
      this.prisma.lessonChallenge.findMany({
        where: { challengerId: userId, status: 'COMPLETED' },
        select: { challengerXp: true, challengedXp: true },
      }),
      this.prisma.lessonChallenge.findMany({
        where: { challengedId: userId, status: 'COMPLETED' },
        select: { challengerXp: true, challengedXp: true },
      }),
    ]);

    const [totalSent, totalReceived] = await Promise.all([
      this.prisma.lessonChallenge.count({ where: { challengerId: userId } }),
      this.prisma.lessonChallenge.count({ where: { challengedId: userId } }),
    ]);

    let won = 0, lost = 0, draw = 0;

    for (const c of asSent) {
      const myXp    = c.challengerXp ?? 0;
      const theirXp = c.challengedXp ?? 0;
      if (myXp > theirXp)       won++;
      else if (myXp < theirXp)  lost++;
      else                       draw++;
    }
    for (const c of asReceived) {
      const myXp    = c.challengedXp ?? 0;
      const theirXp = c.challengerXp ?? 0;
      if (myXp > theirXp)       won++;
      else if (myXp < theirXp)  lost++;
      else                       draw++;
    }

    const totalCompleted = asSent.length + asReceived.length;
    const winRate = totalCompleted > 0
      ? Math.round((won / totalCompleted) * 1000) / 10
      : 0;

    // ── Average rank over last 4 weeks ─────────────────────────────────────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weeklyEntries = await this.prisma.weeklyXp.findMany({
      where: {
        weekStart: { gte: fourWeeksAgo },
        xpEarned:  { gt: 0 },
      },
      orderBy: [{ weekStart: 'asc' }, { xpEarned: 'desc' }],
    });

    // Group by weekStart, compute rank for the user in each week
    const weekMap = new Map<string, { userId: string; xpEarned: number }[]>();
    for (const e of weeklyEntries) {
      const key = e.weekStart.toISOString();
      if (!weekMap.has(key)) weekMap.set(key, []);
      weekMap.get(key)!.push({ userId: e.userId, xpEarned: e.xpEarned });
    }

    const ranks: number[] = [];
    for (const participants of weekMap.values()) {
      const sorted = [...participants].sort((a, b) => b.xpEarned - a.xpEarned);
      const idx = sorted.findIndex((p) => p.userId === userId);
      if (idx !== -1) ranks.push(idx + 1);
    }

    const avgRank4Weeks =
      ranks.length > 0
        ? Math.round((ranks.reduce((s, r) => s + r, 0) / ranks.length) * 10) / 10
        : null;

    return {
      challengesSent: totalSent,
      challengesReceived: totalReceived,
      challengesWon: won,
      challengesLost: lost,
      challengesDraw: draw,
      winRate,
      avgRank4Weeks,
    };
  }

  /**
   * Soft-delete a user account:
   * - Anonymises email + username
   * - Clears push tokens (isActive = false)
   * - Sets deletedAt timestamp
   */
  async softDelete(userId: string): Promise<{ deleted: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const anonymised = `deleted_${userId.slice(0, 8)}`;

    await this.prisma.$transaction([
      // Deactivate push tokens
      this.prisma.pushToken.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
      // Anonymise & mark deleted
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email:     `${anonymised}@deleted.mindly`,
          username:  anonymised,
          deletedAt: new Date(),
        },
      }),
    ]);

    return { deleted: true };
  }
}

