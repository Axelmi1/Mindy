import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

// ── League thresholds (must mirror mobile utils/league.ts) ────────────────────
const LEAGUE_TIERS = [
  { rank: 0, name: 'Iron',     minXp: 0     },
  { rank: 1, name: 'Bronze',   minXp: 100   },
  { rank: 2, name: 'Silver',   minXp: 500   },
  { rank: 3, name: 'Gold',     minXp: 2000  },
  { rank: 4, name: 'Platinum', minXp: 5000  },
] as const;

const LEAGUE_EMOJIS: Record<string, string> = {
  Iron: '⚙️', Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💠',
};

function getLeagueRank(xp: number): { rank: number; name: string } {
  for (let i = LEAGUE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEAGUE_TIERS[i].minXp) return LEAGUE_TIERS[i];
  }
  return LEAGUE_TIERS[0];
}

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
   * High-streak protection alert — runs daily at 12:00 UTC (19:00 Bangkok).
   * Targets users with a streak > 7 who haven't been active today yet.
   * These are the most engaged users: protecting their streaks dramatically
   * reduces churn and improves D30 retention metrics.
   */
  @Cron('0 12 * * *', { name: 'high-streak-protection' })
  async sendHighStreakProtectionAlerts() {
    this.logger.debug('Running high-streak protection alert (19h Bangkok)');
    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const atRiskUsers = await this.prisma.user.findMany({
        where: {
          streak: { gt: 7 },          // Only high-value streaks
          lastActiveAt: {
            lt: todayStart,            // Haven't completed a lesson today
          },
          pushTokens: {
            some: { isActive: true }, // Have a push token
          },
        },
        select: { id: true, streak: true },
      });

      let sent = 0;
      for (const user of atRiskUsers) {
        await this.notificationsService.sendStreakAtRiskNotification(user.id, user.streak);
        sent++;
      }

      if (sent > 0) {
        this.logger.log(`[HighStreakAlert] Sent ${sent} high-streak protection notifications`);
      }
    } catch (error) {
      this.logger.error(`[HighStreakAlert] Failed: ${error}`);
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

  /**
   * League Promotion Check — runs every Sunday at 00:05 UTC (after weekly XP reset).
   *
   * For each user who earned XP this past week, we compare:
   *   • currentLeague  = getLeagueRank(user.totalXp)
   *   • previousLeague = getLeagueRank(user.totalXp - weekXpEarned)
   *
   * If currentLeague.rank > previousLeague.rank → the user was promoted this week.
   * We send a LEVEL_UP celebration push notification and log the total count.
   *
   * No schema change required — league rank is always derived from totalXp on-the-fly.
   */
  @Cron('5 0 * * 0', { name: 'league-promotion-check' })
  async checkLeaguePromotions() {
    this.logger.log('[LeaguePromotion] Running weekly league promotion check');

    try {
      const now = new Date();
      // "Last week" = the UTC week that just ended (Sunday midnight reset)
      const lastWeekStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7),
      );

      // Fetch all WeeklyXp entries from last week with user's total XP
      const weeklyEntries = await this.prisma.weeklyXp.findMany({
        where: {
          weekStart: lastWeekStart,
          xpEarned: { gt: 0 },
        },
        include: {
          user: {
            select: {
              id: true,
              xp: true,
              username: true,
              pushTokens: {
                where: { isActive: true },
                select: { id: true },
              },
            },
          },
        },
      });

      let promotedCount = 0;

      for (const entry of weeklyEntries) {
        const { user } = entry;

        // Skip users with no active push tokens
        if (user.pushTokens.length === 0) continue;

        const currentXp = user.xp;
        const previousXp = Math.max(0, currentXp - entry.xpEarned);

        const currentLeague = getLeagueRank(currentXp);
        const previousLeague = getLeagueRank(previousXp);

        // Promoted if league rank went up
        if (currentLeague.rank > previousLeague.rank) {
          const emoji = LEAGUE_EMOJIS[currentLeague.name] ?? '🏅';
          await this.notificationsService.sendNotification(
            user.id,
            'LEVEL_UP',
            `${emoji} Promotion de ligue !`,
            `Tu es maintenant en ligue ${currentLeague.name} ! Continue comme ça ! 🚀`,
            {
              type: 'league_promotion',
              newLeague: currentLeague.name,
              previousLeague: previousLeague.name,
              totalXp: currentXp,
            },
          );
          promotedCount++;
          this.logger.log(
            `[LeaguePromotion] ${user.username} promoted ${previousLeague.name} → ${currentLeague.name}`,
          );
        }
      }

      this.logger.log(
        `[LeaguePromotion] Done — ${promotedCount} promotion(s) notified out of ${weeklyEntries.length} active users`,
      );
    } catch (error) {
      this.logger.error(`[LeaguePromotion] Failed: ${error}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Challenge Expiry — runs every hour
  // Marks PENDING / ACCEPTED challenges past their expiresAt as EXPIRED
  // and sends a push notification to the challenger.
  // ─────────────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR, { name: 'challenge-expiry' })
  async expireStaleChallenges() {
    this.logger.debug('[ChallengeExpiry] Running challenge expiry check');

    try {
      const now = new Date();

      // Find all stale challenges
      const stale = await this.prisma.lessonChallenge.findMany({
        where: {
          expiresAt: { lt: now },
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
        include: {
          challenger: {
            select: {
              id: true,
              username: true,
              pushTokens: { where: { isActive: true }, select: { id: true } },
            },
          },
          challenged: { select: { id: true, username: true } },
          lesson:     { select: { title: true } },
        },
      });

      if (stale.length === 0) {
        this.logger.debug('[ChallengeExpiry] No stale challenges found');
        return;
      }

      // Batch-update to EXPIRED
      const ids = stale.map((c) => c.id);
      await this.prisma.lessonChallenge.updateMany({
        where: { id: { in: ids } },
        data: { status: 'EXPIRED', updatedAt: now },
      });

      this.logger.log(`[ChallengeExpiry] Expired ${ids.length} challenge(s)`);

      // Notify challenger for each expired challenge (fire-and-forget)
      for (const challenge of stale) {
        // Only push if challenger has an active token
        if (challenge.challenger.pushTokens.length === 0) continue;

        const title = '⏰ Défi expiré';
        const body =
          `Ton défi "${challenge.lesson.title}" contre ` +
          `${challenge.challenged.username} a expiré sans réponse.`;

        await this.notificationsService.sendNotification(
          challenge.challenger.id,
          'LESSON_CHALLENGE_RECEIVED', // reuse existing type — no schema change
          title,
          body,
          {
            type: 'challenge_expired',
            challengeId: challenge.id,
            lessonTitle: challenge.lesson.title,
          },
        );
      }

      this.logger.log(
        `[ChallengeExpiry] Notified ${stale.filter((c) => c.challenger.pushTokens.length > 0).length} challenger(s)`,
      );
    } catch (error) {
      this.logger.error(`[ChallengeExpiry] Failed: ${error}`);
    }
  }
}
