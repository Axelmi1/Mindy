import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';
import type { CreateUserDto, UpdateUserDto } from '@mindy/shared';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: AnalyticsService,
    private readonly achievementCheckerService: AchievementCheckerService,
  ) {}

  /**
   * Create a new user
   */
  async create(data: CreateUserDto) {
    const referralCode = this.generateShortCode();
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        referralCode,
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
   * Update a user
   */
  async update(id: string, data: UpdateUserDto) {
    await this.findById(id); // Ensure user exists

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
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
   * Get user stats for dashboard
   */
  async getStats(id: string) {
    const user = await this.findById(id);

    const [completedCount, totalCount, achievementsUnlocked] = await Promise.all([
      this.prisma.userProgress.count({
        where: { userId: id, isCompleted: true },
      }),
      this.prisma.lesson.count(),
      this.prisma.userAchievement.count({
        where: { userId: id },
      }),
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
    };
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
}

