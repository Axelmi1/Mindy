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

    // A domain is "completed" if ≥5 lessons done (works for every Domain value)
    const domainsCompleted = Object.values(regularCounts).filter((c) => c >= 5).length;

    return {
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      streak: user?.streak ?? 0,
      lessonsCompleted,
      dailyChallengesCompleted,
      domainsCompleted,
      regularCounts,
      masterQuizCounts,
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
    const type = achievement.requirementType;
    // Domain-specific requirement types follow a naming convention so every
    // Domain value (CRYPTO … TAXES, REAL_ESTATE, ENTREPRENEURSHIP) is covered.
    const domainLessons = /^(.+)_LESSONS_COMPLETED$/.exec(type);
    const masterQuiz = /^(.+)_MASTER_QUIZ_COMPLETED$/.exec(type);

    // Only check relevant achievements based on trigger
    let relevant = false;
    switch (trigger) {
      case 'lesson_completed':
        relevant = type === 'LESSONS_COMPLETED' || type === 'DOMAIN_COMPLETED' || !!domainLessons;
        break;
      case 'master_quiz_completed':
        relevant = !!masterQuiz;
        break;
      case 'xp_gained':
        relevant = type === 'XP_EARNED' || type === 'LEVEL_REACHED';
        break;
      case 'streak_updated':
        relevant = type === 'STREAK_DAYS';
        break;
      case 'daily_challenge':
        relevant = type === 'DAILY_CHALLENGES';
        break;
      case 'referral':
        relevant = type === 'REFERRALS_MADE';
        break;
    }
    if (!relevant) return false;

    // For master quiz achievements, only the completed quiz's domain counts
    if (masterQuiz && context.domain && masterQuiz[1] !== context.domain.toUpperCase()) {
      return false;
    }

    let current = 0;

    if (domainLessons) {
      current = stats.regularCounts[domainLessons[1]] || 0;
    } else if (masterQuiz) {
      current = stats.masterQuizCounts[masterQuiz[1]] || 0;
    } else {
      switch (type) {
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
        default:
          return false;
      }
    }

    return current >= achievement.requirementValue;
  }
}
