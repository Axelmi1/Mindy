import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { PushTokenService } from './push-token.service';
import { NotificationType, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushTokenService: PushTokenService,
  ) {
    this.expo = new Expo();
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private async shouldSendNotification(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // If no preferences, use defaults (all enabled)
    if (!prefs) return true;

    switch (type) {
      case 'STREAK_AT_RISK':
        return prefs.streakReminder;
      case 'DAILY_CHALLENGE':
        return prefs.dailyChallenge;
      case 'INACTIVITY_REMINDER':
        return prefs.inactivityReminder;
      case 'LEVEL_UP':
        return prefs.levelUpCelebration;
      case 'STREAK_MILESTONE':
        return prefs.streakMilestone;
      case 'ACHIEVEMENT_UNLOCKED':
        return prefs.levelUpCelebration; // Use same pref as level up
      case 'REFERRAL_COMPLETED':
        return true; // Always send referral notifications
      case 'LESSON_CHALLENGE_RECEIVED':
      case 'LESSON_CHALLENGE_ACCEPTED':
        return true; // Always send challenge notifications
      default:
        return true;
    }
  }

  /**
   * Send a notification to a user
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<ExpoPushTicket[] | null> {
    // Check user preferences
    const shouldSend = await this.shouldSendNotification(userId, type);
    if (!shouldSend) {
      this.logger.debug(`Notification ${type} disabled for user ${userId}`);
      return null;
    }

    // Get active tokens
    const tokens = await this.pushTokenService.getActiveTokensForUser(userId);
    if (tokens.length === 0) {
      this.logger.debug(`No active tokens for user ${userId}`);
      return null;
    }

    // Filter valid Expo tokens
    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t.token));
    if (validTokens.length === 0) {
      this.logger.warn(`No valid Expo tokens for user ${userId}`);
      return null;
    }

    // Build messages
    const messages: ExpoPushMessage[] = validTokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: { type, ...data },
    }));

    // Send in chunks
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        // Handle errors and deactivate bad tokens
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          if (ticket.status === 'error') {
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.details?.error === 'InvalidCredentials'
            ) {
              await this.pushTokenService.deactivateInvalidToken(
                validTokens[i].token,
              );
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send notifications: ${error}`);
      }
    }

    // Log the notification
    await this.prisma.notificationLog.create({
      data: {
        userId,
        type,
        title,
        body,
        status: tickets.length > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED,
        expoTicketId: tickets[0]?.status === 'ok' ? (tickets[0] as any).id : null,
        sentAt: new Date(),
      },
    });

    this.logger.log(`Sent ${type} notification to user ${userId}`);
    return tickets;
  }

  /**
   * Send level up notification
   */
  async sendLevelUpNotification(userId: string, newLevel: number) {
    return this.sendNotification(
      userId,
      'LEVEL_UP',
      'Level Up! 🎉',
      `Bravo ! Tu as atteint le niveau ${newLevel} !`,
      { newLevel },
    );
  }

  /**
   * Send streak milestone notification
   */
  async sendStreakMilestoneNotification(userId: string, streak: number) {
    const milestones = [7, 14, 30, 60, 100, 365];
    if (!milestones.includes(streak)) return null;

    const emoji = streak >= 30 ? '🔥' : '✨';
    return this.sendNotification(
      userId,
      'STREAK_MILESTONE',
      `${streak} jours de streak ! ${emoji}`,
      `Incroyable ! Tu maintiens ta série depuis ${streak} jours !`,
      { streak },
    );
  }

  /**
   * Send streak at risk notification
   */
  async sendStreakAtRiskNotification(userId: string, currentStreak: number) {
    return this.sendNotification(
      userId,
      'STREAK_AT_RISK',
      'Ta streak est en danger ! ⚠️',
      `Complète une leçon pour garder ta série de ${currentStreak} jours !`,
      { streak: currentStreak },
    );
  }

  /**
   * Send daily challenge notification
   */
  async sendDailyChallengeNotification(userId: string) {
    return this.sendNotification(
      userId,
      'DAILY_CHALLENGE',
      'Défi du jour disponible ! 🎯',
      'Un nouveau défi t\'attend avec +50 XP bonus !',
    );
  }

  /**
   * Send inactivity reminder notification
   */
  async sendInactivityReminderNotification(userId: string, daysSinceActive: number) {
    return this.sendNotification(
      userId,
      'INACTIVITY_REMINDER',
      'Tu nous manques ! 👋',
      `Ça fait ${daysSinceActive} jours... Reviens apprendre quelque chose de nouveau !`,
      { daysSinceActive },
    );
  }

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlockedNotification(
    userId: string,
    achievementName: string,
    xpAwarded: number,
  ) {
    return this.sendNotification(
      userId,
      'ACHIEVEMENT_UNLOCKED',
      'Achievement Unlocked! 🏆',
      `Tu as débloqué "${achievementName}" et gagné +${xpAwarded} XP !`,
      { achievementName, xpAwarded },
    );
  }

  /**
   * Send referral completed notification
   */
  async sendReferralCompletedNotification(
    userId: string,
    refereeUsername: string,
    xpAwarded: number,
  ) {
    return this.sendNotification(
      userId,
      'REFERRAL_COMPLETED',
      'Nouveau parrainage ! 🎉',
      `${refereeUsername} a utilisé ton code ! Tu gagnes +${xpAwarded} XP !`,
      { refereeUsername, xpAwarded },
    );
  }

  /**
   * Send push notification when a user receives a lesson challenge
   */
  async sendChallengeReceivedNotification(
    challengedUserId: string,
    challengerUsername: string,
    lessonTitle: string,
    challengeId: string,
  ) {
    return this.sendNotification(
      challengedUserId,
      'LESSON_CHALLENGE_RECEIVED',
      `⚔️ Nouveau défi de ${challengerUsername} !`,
      `${challengerUsername} te défie sur "${lessonTitle}". Tu as 48h pour relever le challenge !`,
      { challengeId, challengerUsername, lessonTitle, action: 'open_challenge' },
    );
  }

  /**
   * Send push notification when a challenge is accepted
   */
  async sendChallengeAcceptedNotification(
    challengerUserId: string,
    challengedUsername: string,
    lessonTitle: string,
    challengeId: string,
  ) {
    return this.sendNotification(
      challengerUserId,
      'LESSON_CHALLENGE_ACCEPTED',
      `🔥 ${challengedUsername} a accepté ton défi !`,
      `La battle sur "${lessonTitle}" commence. Montre ce que tu vaux !`,
      { challengeId, challengedUsername, lessonTitle, action: 'open_challenge' },
    );
  }
}
