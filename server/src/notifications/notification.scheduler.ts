import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get start of today in UTC
   */
  private getStartOfToday(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  /**
   * Send streak-at-risk notifications
   * Runs every hour to catch users in different timezones
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendStreakAtRiskNotifications() {
    const currentHour = new Date().getHours();
    this.logger.debug(`Running streak-at-risk check for hour ${currentHour}`);

    try {
      // Find users who:
      // 1. Have streak > 0
      // 2. Haven't been active today
      // 3. Have notifications enabled
      // 4. Their reminder hour matches current hour
      // 5. Have active push tokens
      const users = await this.prisma.user.findMany({
        where: {
          streak: { gt: 0 },
          lastActiveAt: {
            lt: this.getStartOfToday(),
          },
          pushTokens: {
            some: { isActive: true },
          },
          OR: [
            {
              notificationPreferences: {
                streakReminder: true,
                reminderHour: currentHour,
              },
            },
            {
              // Users without preferences use default (19h)
              notificationPreferences: null,
              AND: [{ id: { not: '' } }], // Always true, just to structure the query
            },
          ],
        },
        select: {
          id: true,
          streak: true,
          notificationPreferences: true,
        },
      });

      // Filter users whose reminder hour matches (including defaults)
      const usersToNotify = users.filter((user) => {
        const reminderHour = user.notificationPreferences?.reminderHour ?? 19;
        return reminderHour === currentHour;
      });

      for (const user of usersToNotify) {
        await this.notificationsService.sendStreakAtRiskNotification(
          user.id,
          user.streak,
        );
      }

      if (usersToNotify.length > 0) {
        this.logger.log(
          `Sent ${usersToNotify.length} streak-at-risk notifications`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send streak-at-risk notifications: ${error}`);
    }
  }

  /**
   * Send daily challenge notifications
   * Runs at 9 AM every day
   */
  @Cron('0 9 * * *')
  async sendDailyChallengeNotifications() {
    this.logger.debug('Running daily challenge notification check');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find users who:
      // 1. Haven't completed today's challenge
      // 2. Have daily challenge notifications enabled
      // 3. Have active push tokens
      const users = await this.prisma.user.findMany({
        where: {
          pushTokens: {
            some: { isActive: true },
          },
          OR: [
            { notificationPreferences: { dailyChallenge: true } },
            { notificationPreferences: null }, // Default enabled
          ],
          dailyChallenges: {
            none: {
              date: today,
              isCompleted: true,
            },
          },
        },
        select: { id: true },
      });

      for (const user of users) {
        await this.notificationsService.sendDailyChallengeNotification(user.id);
      }

      if (users.length > 0) {
        this.logger.log(
          `Sent ${users.length} daily challenge notifications`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send daily challenge notifications: ${error}`);
    }
  }

  /**
   * Send inactivity reminder notifications
   * Runs at noon every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async sendInactivityReminders() {
    this.logger.debug('Running inactivity reminder check');

    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);

      // Find users who:
      // 1. Were last active 2-3 days ago (not too long, not too recent)
      // 2. Have inactivity notifications enabled
      // 3. Have active push tokens
      const users = await this.prisma.user.findMany({
        where: {
          lastActiveAt: {
            gte: threeDaysAgo,
            lt: twoDaysAgo,
          },
          pushTokens: {
            some: { isActive: true },
          },
          OR: [
            { notificationPreferences: { inactivityReminder: true } },
            { notificationPreferences: null }, // Default enabled
          ],
        },
        select: {
          id: true,
          lastActiveAt: true,
        },
      });

      for (const user of users) {
        const daysSinceActive = user.lastActiveAt
          ? Math.floor(
              (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24),
            )
          : 2;

        await this.notificationsService.sendInactivityReminderNotification(
          user.id,
          daysSinceActive,
        );
      }

      if (users.length > 0) {
        this.logger.log(`Sent ${users.length} inactivity reminder notifications`);
      }
    } catch (error) {
      this.logger.error(`Failed to send inactivity reminders: ${error}`);
    }
  }
}
