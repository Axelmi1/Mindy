import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';
import type { CreateProgressDto, UpdateProgressDto } from '@mindy/shared';

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
    private readonly leaderboardService: LeaderboardService,
    private readonly analyticsService: AnalyticsService,
    private readonly achievementCheckerService: AchievementCheckerService,
  ) {}

  /**
   * Start tracking progress for a user on a lesson
   */
  async create(data: CreateProgressDto) {
    // Verify user and lesson exist
    await this.usersService.findById(data.userId);
    await this.lessonsService.findById(data.lessonId);

    // Check if progress already exists
    const existing = await this.prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: data.userId,
          lessonId: data.lessonId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Progress already exists for this user and lesson');
    }

    const progress = await this.prisma.userProgress.create({
      data: {
        userId: data.userId,
        lessonId: data.lessonId,
        completedSteps: [],
        isCompleted: false,
      },
    });

    // Track lesson started analytics
    const lesson = await this.lessonsService.findById(data.lessonId);
    await this.analyticsService.track(data.userId, 'LESSON_STARTED', {
      lessonId: data.lessonId,
      lessonTitle: lesson.title,
      domain: lesson.domain,
    });

    return progress;
  }

  /**
   * Get progress by ID
   */
  async findById(id: string) {
    const progress = await this.prisma.userProgress.findUnique({
      where: { id },
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

    if (!progress) {
      throw new NotFoundException(`Progress with ID ${id} not found`);
    }

    return progress;
  }

  /**
   * Get all progress for a user
   */
  async findByUserId(userId: string) {
    await this.usersService.findById(userId); // Verify user exists

    return this.prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            domain: true,
            xpReward: true,
          },
        },
      },
      orderBy: {
        lesson: { orderIndex: 'asc' },
      },
    });
  }

  /**
   * Get progress for a specific user and lesson
   */
  async findByUserAndLesson(userId: string, lessonId: string) {
    return this.prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      include: {
        lesson: true,
      },
    });
  }

  /**
   * Update progress
   */
  async update(id: string, data: UpdateProgressDto) {
    const progress = await this.findById(id);

    return this.prisma.userProgress.update({
      where: { id },
      data: {
        ...(data.completedSteps !== undefined && { completedSteps: data.completedSteps }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    });
  }

  /**
   * Mark a single step as completed
   */
  async completeStep(id: string, stepIndex: number) {
    const progress = await this.findById(id);
    const lesson = await this.lessonsService.findById(progress.lessonId);
    const totalSteps = this.lessonsService.getStepCount(lesson.content);

    // Validate step index
    if (stepIndex < 0 || stepIndex >= totalSteps) {
      throw new NotFoundException(`Step ${stepIndex} does not exist in this lesson`);
    }

    // Add step to completed if not already there
    const completedSteps = [...new Set([...progress.completedSteps, stepIndex])].sort(
      (a, b) => a - b,
    );

    // Check if all steps are completed
    const isCompleted = completedSteps.length === totalSteps;

    const updatedProgress = await this.prisma.userProgress.update({
      where: { id },
      data: {
        completedSteps,
        isCompleted,
      },
    });

    // Track step completion analytics
    await this.analyticsService.track(progress.userId, 'STEP_COMPLETED', {
      lessonId: progress.lessonId,
      stepIndex,
      totalSteps,
    });

    // If lesson just completed, award XP and update streak
    let comboCount = 0;
    let comboMultiplier = 1.0;
    let bonusXp = 0;

    if (isCompleted && !progress.isCompleted) {
      // ── Combo Multiplier ─────────────────────────────────────────────────
      // Count LESSON_COMPLETED events in the last 2 hours for this user
      const sessionStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const recentCompletions = await this.prisma.analyticsEvent.count({
        where: {
          userId: progress.userId,
          eventType: 'LESSON_COMPLETED',
          timestamp: { gte: sessionStart },
        },
      });

      // This lesson is about to be the (recentCompletions + 1)th in session
      comboCount = recentCompletions + 1;

      if (comboCount >= 5) {
        comboMultiplier = 2.0;      // ×2 after 5+ lessons in session
      } else if (comboCount >= 3) {
        comboMultiplier = 1.5;      // ×1.5 after 3+ lessons in session
      }

      const baseXp = lesson.xpReward;
      const totalXp = Math.round(baseXp * comboMultiplier);
      bonusXp = totalXp - baseXp;

      await this.usersService.addXp(progress.userId, totalXp);
      await this.usersService.updateStreak(progress.userId);
      // Record XP for weekly leaderboard (including combo bonus)
      await this.leaderboardService.recordXp(progress.userId, totalXp);

      // Track lesson completion analytics
      await this.analyticsService.track(progress.userId, 'LESSON_COMPLETED', {
        lessonId: progress.lessonId,
        lessonTitle: lesson.title,
        domain: lesson.domain,
        xpAwarded: totalXp,
        comboCount,
        comboMultiplier,
      });

      // Track combo bonus event if applicable
      if (comboMultiplier > 1.0) {
        await this.analyticsService.track(progress.userId, 'COMBO_BONUS', {
          lessonId: progress.lessonId,
          comboCount,
          comboMultiplier,
          bonusXp,
          baseXp,
        });
      }

      // Check achievements for lesson completion
      await this.achievementCheckerService.checkAndUnlock(progress.userId, 'lesson_completed');

      // If this is a master quiz, also fire master_quiz_completed trigger
      if (lesson.isMasterQuiz) {
        await this.achievementCheckerService.checkAndUnlock(
          progress.userId,
          'master_quiz_completed',
          { domain: lesson.domain },
        );
      }
    }

    return {
      ...updatedProgress,
      justCompleted: isCompleted && !progress.isCompleted,
      xpAwarded: isCompleted && !progress.isCompleted ? Math.round(lesson.xpReward * comboMultiplier) : 0,
      comboCount: isCompleted && !progress.isCompleted ? comboCount : 0,
      comboMultiplier: isCompleted && !progress.isCompleted ? comboMultiplier : 1.0,
      bonusXp: isCompleted && !progress.isCompleted ? bonusXp : 0,
    };
  }

  /**
   * Get user's current/in-progress lesson
   */
  async getCurrentLesson(userId: string) {
    const progress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        isCompleted: false,
      },
      include: {
        lesson: true,
      },
      orderBy: {
        lesson: { orderIndex: 'asc' },
      },
    });

    if (!progress) {
      // Return first lesson without progress
      const nextLesson = await this.prisma.lesson.findFirst({
        where: {
          NOT: {
            progress: {
              some: { userId },
            },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      return nextLesson ? { lesson: nextLesson, progress: null } : null;
    }

    return {
      lesson: progress.lesson,
      progress: {
        id: progress.id,
        userId: progress.userId,
        lessonId: progress.lessonId,
        completedSteps: progress.completedSteps,
        isCompleted: progress.isCompleted,
      },
    };
  }

  /**
   * Reset progress for a lesson (for retrying)
   */
  async resetProgress(id: string) {
    await this.findById(id); // Verify exists

    return this.prisma.userProgress.update({
      where: { id },
      data: {
        completedSteps: [],
        isCompleted: false,
      },
    });
  }

  /**
   * Get activity heatmap data for a user (last N days).
   * Uses LESSON_COMPLETED analytics events as the source of truth.
   * Returns one entry per calendar day: { date, count, xpEarned }
   */
  async getActivityHeatmap(
    userId: string,
    days = 56,
  ): Promise<{ date: string; count: number; xpEarned: number }[]> {
    await this.usersService.findById(userId);

    // Use UTC throughout to avoid timezone drift (server runs in UTC+7 Bangkok)
    const now = new Date();
    const since = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days + 1),
    );

    // Pull LESSON_COMPLETED events from analytics — they carry xpAwarded in eventData
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventType: 'LESSON_COMPLETED',
        timestamp: { gte: since },
      },
      select: {
        timestamp: true,
        eventData: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Build map: date → { count, xpEarned } — keys are UTC date strings (YYYY-MM-DD)
    const dateMap = new Map<string, { count: number; xpEarned: number }>();

    for (const ev of events) {
      const dateKey = ev.timestamp.toISOString().slice(0, 10);
      const existing = dateMap.get(dateKey) ?? { count: 0, xpEarned: 0 };
      const xp =
        ev.eventData && typeof ev.eventData === 'object' && !Array.isArray(ev.eventData)
          ? ((ev.eventData as Record<string, unknown>).xpAwarded as number) ?? 0
          : 0;
      dateMap.set(dateKey, {
        count: existing.count + 1,
        xpEarned: existing.xpEarned + xp,
      });
    }

    // Fill all N days (including zero-activity days) — fully UTC
    const result: { date: string; count: number; xpEarned: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      const entry = dateMap.get(dateKey) ?? { count: 0, xpEarned: 0 };
      result.push({ date: dateKey, ...entry });
    }

    return result;
  }

  /**
   * Delete progress
   */
  async delete(id: string) {
    await this.findById(id); // Verify exists

    return this.prisma.userProgress.delete({
      where: { id },
    });
  }

  /**
   * Get the current combo status for a user.
   * Returns count of LESSON_COMPLETED events in the last 2 hours + derived multiplier.
   * Used by the Learn screen to display the active combo indicator.
   */
  async getCurrentCombo(userId: string): Promise<{
    comboCount: number;
    comboMultiplier: number;
    active: boolean;
  }> {
    const sessionStart = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const recentCompletions = await this.prisma.analyticsEvent.count({
      where: {
        userId,
        eventType: 'LESSON_COMPLETED',
        timestamp: { gte: sessionStart },
      },
    });

    let comboMultiplier = 1.0;
    if (recentCompletions >= 5) {
      comboMultiplier = 2.0;
    } else if (recentCompletions >= 3) {
      comboMultiplier = 1.5;
    }

    return {
      comboCount: recentCompletions,
      comboMultiplier,
      active: recentCompletions >= 3,
    };
  }
}

