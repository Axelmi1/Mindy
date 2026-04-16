import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from './achievements.service';

export type AchievementTrigger =
  | 'lesson_completed'
  | 'master_quiz_completed'
  | 'xp_gained'
  | 'streak_updated'
  | 'daily_challenge'
  | 'referral';

/** Extra context passed alongside a trigger */
export interface TriggerContext {
  /** Domain of the completed lesson/master quiz (CRYPTO | FINANCE | TRADING) */
  domain?: string;
}

@Injectable()
export class AchievementCheckerService {
  private readonly logger = new Logger(AchievementCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  /**
   * Check and unlock achievements based on a trigger event.
   * Pass an optional `context` with `domain` for master quiz triggers.
   */
  async checkAndUnlock(
    userId: string,
    trigger: AchievementTrigger,
    context: TriggerContext = {},
  ): Promise<string[]> {
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
        if (this.shouldUnlock(achievement, stats, trigger, context)) {
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

    // Count completed lessons by domain (non-master quizzes + master quizzes)
    const lessonsByDomain = await this.prisma.lesson.findMany({
      where: {
        progress: { some: { userId, isCompleted: true } },
      },
      select: { domain: true, isMasterQuiz: true },
    });

    const regularCounts: Record<string, number> = {};
    const masterQuizCounts: Record<string, number> = {};

    for (const l of lessonsByDomain) {
      if (l.isMasterQuiz) {
        masterQuizCounts[l.domain] = (masterQuizCounts[l.domain] || 0) + 1;
      } else {
        regularCounts[l.domain] = (regularCounts[l.domain] || 0) + 1;
      }
    }

    const cryptoLessonsCompleted = regularCounts['CRYPTO'] || 0;
    const financeLessonsCompleted = regularCounts['FINANCE'] || 0;
    const tradingLessonsCompleted = regularCounts['TRADING'] || 0;

    const cryptoMasterQuizCompleted = masterQuizCounts['CRYPTO'] || 0;
    const financeMasterQuizCompleted = masterQuizCounts['FINANCE'] || 0;
    const tradingMasterQuizCompleted = masterQuizCounts['TRADING'] || 0;

    // A domain is "completed" if ≥5 lessons done
    const domainsCompleted = [cryptoLessonsCompleted, financeLessonsCompleted, tradingLessonsCompleted]
      .filter((c) => c >= 5).length;

    return {
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      streak: user?.streak ?? 0,
      lessonsCompleted,
      dailyChallengesCompleted,
      domainsCompleted,
      cryptoLessonsCompleted,
      financeLessonsCompleted,
      tradingLessonsCompleted,
      cryptoMasterQuizCompleted,
      financeMasterQuizCompleted,
      tradingMasterQuizCompleted,
      referralsCount,
    };
  }

  /**
   * Determine if an achievement should be unlocked
   */
  private shouldUnlock(
    achievement: { requirementType: string; requirementValue: number },
    stats: ReturnType<AchievementCheckerService['getUserStats']> extends Promise<infer T> ? T : never,
    trigger: AchievementTrigger,
    context: TriggerContext,
  ): boolean {
    // Only check relevant achievements based on trigger
    const triggerRelevance: Record<AchievementTrigger, string[]> = {
      lesson_completed: [
        'LESSONS_COMPLETED',
        'DOMAIN_COMPLETED',
        'CRYPTO_LESSONS_COMPLETED',
        'FINANCE_LESSONS_COMPLETED',
        'TRADING_LESSONS_COMPLETED',
      ],
      master_quiz_completed: [
        'CRYPTO_MASTER_QUIZ_COMPLETED',
        'FINANCE_MASTER_QUIZ_COMPLETED',
        'TRADING_MASTER_QUIZ_COMPLETED',
      ],
      xp_gained: ['XP_EARNED', 'LEVEL_REACHED'],
      streak_updated: ['STREAK_DAYS'],
      daily_challenge: ['DAILY_CHALLENGES'],
      referral: ['REFERRALS_MADE'],
    };

    const relevantTypes = triggerRelevance[trigger];
    if (!relevantTypes.includes(achievement.requirementType)) {
      return false;
    }

    // For master quiz achievements, check domain-specific condition
    if (trigger === 'master_quiz_completed' && context.domain) {
      const domainUpper = context.domain.toUpperCase();
      if (achievement.requirementType === 'CRYPTO_MASTER_QUIZ_COMPLETED' && domainUpper !== 'CRYPTO') return false;
      if (achievement.requirementType === 'FINANCE_MASTER_QUIZ_COMPLETED' && domainUpper !== 'FINANCE') return false;
      if (achievement.requirementType === 'TRADING_MASTER_QUIZ_COMPLETED' && domainUpper !== 'TRADING') return false;
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
      case 'TRADING_LESSONS_COMPLETED':
        current = stats.tradingLessonsCompleted;
        break;
      case 'CRYPTO_MASTER_QUIZ_COMPLETED':
        current = stats.cryptoMasterQuizCompleted;
        break;
      case 'FINANCE_MASTER_QUIZ_COMPLETED':
        current = stats.financeMasterQuizCompleted;
        break;
      case 'TRADING_MASTER_QUIZ_COMPLETED':
        current = stats.tradingMasterQuizCompleted;
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
