import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';

@Injectable()
export class DailyChallengeService {
  private readonly XP_BONUS = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementCheckerService: AchievementCheckerService,
  ) {}

  /**
   * Get today's challenge for a user
   * Creates a new challenge if none exists for today
   */
  async getTodayChallenge(userId: string) {
    const today = this.getDateOnly(new Date());

    // Check if challenge already exists for today
    let challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            domain: true,
            xpReward: true,
            content: true,
          },
        },
      },
    });

    if (!challenge) {
      // Pick a random lesson the user hasn't completed recently
      const lesson = await this.pickChallengeLesson(userId);

      if (!lesson) {
        throw new NotFoundException('No lessons available for daily challenge');
      }

      challenge = await this.prisma.dailyChallenge.create({
        data: {
          userId,
          date: today,
          lessonId: lesson.id,
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              domain: true,
              xpReward: true,
              content: true,
            },
          },
        },
      });
    }

    return {
      ...challenge,
      xpBonus: this.XP_BONUS,
      timeUntilReset: this.getTimeUntilMidnight(),
    };
  }

  /**
   * Complete today's daily challenge
   */
  async completeChallenge(userId: string) {
    const today = this.getDateOnly(new Date());

    const challenge = await this.prisma.dailyChallenge.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('No daily challenge found for today');
    }

    if (challenge.isCompleted) {
      throw new ConflictException('Daily challenge already completed');
    }

    // Mark as completed and award bonus XP
    const [updatedChallenge, user] = await this.prisma.$transaction([
      this.prisma.dailyChallenge.update({
        where: { id: challenge.id },
        data: {
          isCompleted: true,
          xpBonusAwarded: this.XP_BONUS,
          completedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: this.XP_BONUS },
        },
      }),
    ]);

    // Check achievements for daily challenge completion
    await this.achievementCheckerService.checkAndUnlock(userId, 'daily_challenge');

    return {
      challenge: updatedChallenge,
      xpAwarded: this.XP_BONUS,
      newTotalXp: user.xp,
    };
  }

  /**
   * Get daily challenge history for a user
   */
  async getChallengeHistory(userId: string, limit = 7) {
    return this.prisma.dailyChallenge.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            domain: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  /**
   * Pick a lesson for today's challenge
   * Prefers lessons the user hasn't done recently
   */
  private async pickChallengeLesson(userId: string) {
    // Get recent challenge lesson IDs to avoid repeats
    const recentChallenges = await this.prisma.dailyChallenge.findMany({
      where: { userId },
      select: { lessonId: true },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const recentLessonIds = recentChallenges.map((c) => c.lessonId);

    // Try to find a lesson not in recent challenges
    let lesson = await this.prisma.lesson.findFirst({
      where: {
        id: { notIn: recentLessonIds.length > 0 ? recentLessonIds : undefined },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Fallback to any lesson if all have been used
    if (!lesson) {
      lesson = await this.prisma.lesson.findFirst({
        orderBy: { orderIndex: 'asc' },
      });
    }

    return lesson;
  }

  /**
   * Get date without time component
   */
  private getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Get milliseconds until midnight
   */
  private getTimeUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return midnight.getTime() - now.getTime();
  }
}
