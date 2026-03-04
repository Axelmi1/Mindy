import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get all achievement definitions
   */
  async getAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  /**
   * Get achievement by key
   */
  async getByKey(key: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key },
    });

    if (!achievement) {
      throw new NotFoundException(`Achievement with key ${key} not found`);
    }

    return achievement;
  }

  /**
   * Get achievement by ID
   */
  async getById(id: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }

    return achievement;
  }

  /**
   * Get user's achievements (unlocked and locked with progress)
   */
  async getUserAchievements(userId: string) {
    const [allAchievements, userAchievements, userStats] = await Promise.all([
      this.prisma.achievement.findMany({
        orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      }),
      this.getUserStats(userId),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const unlocked = userAchievements.map((ua) => ({
      id: ua.id,
      unlockedAt: ua.unlockedAt,
      xpAwarded: ua.xpAwarded,
      achievement: ua.achievement,
    }));

    const locked = allAchievements
      .filter((a) => !unlockedIds.has(a.id))
      .map((a) => ({
        ...a,
        progress: this.calculateProgress(a, userStats),
      }));

    return { unlocked, locked };
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(userId: string, key: string) {
    const achievement = await this.getByKey(key);

    // Check if already unlocked
    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (existing) {
      return { alreadyUnlocked: true, userAchievement: existing };
    }

    // Create user achievement and award XP
    const [userAchievement] = await this.prisma.$transaction([
      this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          xpAwarded: achievement.xpReward,
        },
        include: { achievement: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: achievement.xpReward },
        },
      }),
    ]);

    // Track analytics
    await this.analyticsService.track(userId, 'ACHIEVEMENT_UNLOCKED', {
      achievementKey: key,
      achievementName: achievement.name,
      xpAwarded: achievement.xpReward,
      rarity: achievement.rarity,
    });

    // Send notification
    await this.notificationsService.sendAchievementUnlockedNotification(
      userId,
      achievement.name,
      achievement.xpReward,
    );

    return { alreadyUnlocked: false, userAchievement };
  }

  /**
   * Get user stats for progress calculation
   */
  private async getUserStats(userId: string) {
    const [user, lessonsCompleted, dailyChallengesCompleted, domainProgress, referralsCount] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.userProgress.count({
          where: { userId, isCompleted: true },
        }),
        this.prisma.dailyChallenge.count({
          where: { userId, isCompleted: true },
        }),
        this.prisma.userProgress.groupBy({
          by: ['lessonId'],
          where: { userId, isCompleted: true },
          _count: true,
        }),
        this.prisma.referral.count({
          where: { referrerId: userId },
        }),
      ]);

    // Count completed domains (simplified - assumes 5 lessons per domain completes it)
    const lessonsByDomain = await this.prisma.lesson.findMany({
      where: {
        progress: {
          some: { userId, isCompleted: true },
        },
      },
      select: { domain: true },
    });

    const domainCounts = lessonsByDomain.reduce(
      (acc, l) => {
        acc[l.domain] = (acc[l.domain] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const domainsCompleted = Object.values(domainCounts).filter((c) => c >= 5).length;

    return {
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      streak: user?.streak ?? 0,
      lessonsCompleted,
      dailyChallengesCompleted,
      domainsCompleted,
      referralsCount,
    };
  }

  /**
   * Calculate progress towards an achievement
   */
  private calculateProgress(
    achievement: { requirementType: string; requirementValue: number },
    stats: {
      xp: number;
      level: number;
      streak: number;
      lessonsCompleted: number;
      dailyChallengesCompleted: number;
      domainsCompleted: number;
      referralsCount: number;
    },
  ): number {
    let current = 0;

    switch (achievement.requirementType) {
      case 'LESSONS_COMPLETED':
        current = stats.lessonsCompleted;
        break;
      case 'STREAK_DAYS':
        current = stats.streak;
        break;
      case 'XP_EARNED':
        current = stats.xp;
        break;
      case 'DAILY_CHALLENGES':
        current = stats.dailyChallengesCompleted;
        break;
      case 'DOMAIN_COMPLETED':
        current = stats.domainsCompleted;
        break;
      case 'LEVEL_REACHED':
        current = stats.level;
        break;
      case 'REFERRALS_MADE':
        current = stats.referralsCount;
        break;
    }

    return Math.min(Math.round((current / achievement.requirementValue) * 100), 100);
  }
}
