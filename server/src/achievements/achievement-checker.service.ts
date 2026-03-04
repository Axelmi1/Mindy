import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from './achievements.service';

export type AchievementTrigger =
  | 'lesson_completed'
  | 'xp_gained'
  | 'streak_updated'
  | 'daily_challenge'
  | 'referral';

@Injectable()
export class AchievementCheckerService {
  private readonly logger = new Logger(AchievementCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /**
   * Check and unlock achievements based on a trigger event
   */
  async checkAndUnlock(userId: string, trigger: AchievementTrigger): Promise<string[]> {
    const unlockedKeys: string[] = [];

    try {
      const [user, stats] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.getUserStats(userId),
      ]);

      if (!user) {
        this.logger.warn(`User ${userId} not found for achievement check`);
        return [];
      }

      // Get all achievements that haven't been unlocked yet
      const unlockedAchievementIds = await this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });

      const unlockedIds = new Set(unlockedAchievementIds.map((ua) => ua.achievementId));

      const allAchievements = await this.prisma.achievement.findMany();
      const lockedAchievements = allAchievements.filter((a) => !unlockedIds.has(a.id));

      // Check each locked achievement
      for (const achievement of lockedAchievements) {
        if (this.shouldUnlock(achievement, stats, trigger)) {
          const result = await this.achievementsService.unlockAchievement(userId, achievement.key);
          if (!result.alreadyUnlocked) {
            unlockedKeys.push(achievement.key);
            this.logger.log(`Achievement unlocked: ${achievement.key} for user ${userId}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking achievements for user ${userId}:`, error);
    }

    return unlockedKeys;
  }

  /**
   * Get user stats for achievement checking
   */
  private async getUserStats(userId: string) {
    const [user, lessonsCompleted, dailyChallengesCompleted, referralsCount] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.userProgress.count({
        where: { userId, isCompleted: true },
      }),
      this.prisma.dailyChallenge.count({
        where: { userId, isCompleted: true },
      }),
      this.prisma.referral.count({
        where: { referrerId: userId },
      }),
    ]);

    // Count completed lessons by domain
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

    const cryptoLessonsCompleted = domainCounts['CRYPTO'] || 0;
    const financeLessonsCompleted = domainCounts['FINANCE'] || 0;
    const domainsCompleted = Object.values(domainCounts).filter((c) => c >= 5).length;

    return {
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      streak: user?.streak ?? 0,
      lessonsCompleted,
      dailyChallengesCompleted,
      domainsCompleted,
      cryptoLessonsCompleted,
      financeLessonsCompleted,
      referralsCount,
    };
  }

  /**
   * Determine if an achievement should be unlocked
   */
  private shouldUnlock(
    achievement: { requirementType: string; requirementValue: number },
    stats: {
      xp: number;
      level: number;
      streak: number;
      lessonsCompleted: number;
      dailyChallengesCompleted: number;
      domainsCompleted: number;
      cryptoLessonsCompleted: number;
      financeLessonsCompleted: number;
      referralsCount: number;
    },
    trigger: AchievementTrigger,
  ): boolean {
    // Only check relevant achievements based on trigger
    const triggerRelevance: Record<AchievementTrigger, string[]> = {
      lesson_completed: ['LESSONS_COMPLETED', 'DOMAIN_COMPLETED', 'CRYPTO_LESSONS_COMPLETED', 'FINANCE_LESSONS_COMPLETED'],
      xp_gained: ['XP_EARNED', 'LEVEL_REACHED'],
      streak_updated: ['STREAK_DAYS'],
      daily_challenge: ['DAILY_CHALLENGES'],
      referral: ['REFERRALS_MADE'],
    };

    const relevantTypes = triggerRelevance[trigger];
    if (!relevantTypes.includes(achievement.requirementType)) {
      return false;
    }

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
      case 'CRYPTO_LESSONS_COMPLETED':
        current = stats.cryptoLessonsCompleted;
        break;
      case 'FINANCE_LESSONS_COMPLETED':
        current = stats.financeLessonsCompleted;
        break;
      case 'LEVEL_REACHED':
        current = stats.level;
        break;
      case 'REFERRALS_MADE':
        current = stats.referralsCount;
        break;
      default:
        return false;
    }

    return current >= achievement.requirementValue;
  }
}
