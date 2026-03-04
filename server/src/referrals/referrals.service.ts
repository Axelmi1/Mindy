import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';

@Injectable()
export class ReferralsService {
  private readonly BASE_REFERRAL_XP = 100;
  private readonly TIER_BONUSES: Record<number, number> = {
    3: 50,
    5: 100,
    10: 200,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: AnalyticsService,
    private readonly achievementCheckerService: AchievementCheckerService,
  ) {}

  /**
   * Generate a short alphanumeric referral code
   */
  generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get user by referral code
   */
  async getUserByReferralCode(code: string) {
    const user = await this.prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, username: true, referralCode: true },
    });

    return user;
  }

  /**
   * Validate a referral code
   */
  async validateReferralCode(code: string) {
    const user = await this.getUserByReferralCode(code);
    if (!user) {
      return { valid: false };
    }
    return { valid: true, referrerUsername: user.username };
  }

  /**
   * Apply a referral code for a new user
   */
  async applyReferralCode(refereeId: string, referralCode: string) {
    // Validate the code
    const referrer = await this.getUserByReferralCode(referralCode);
    if (!referrer) {
      throw new NotFoundException('Invalid referral code');
    }

    // Prevent self-referral
    if (referrer.id === refereeId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    // Check if referee already has a referral
    const existingReferral = await this.prisma.referral.findUnique({
      where: { refereeId },
    });

    if (existingReferral) {
      throw new ConflictException('Referral code already applied');
    }

    // Get current referral count for tier bonus
    const currentReferralCount = await this.prisma.referral.count({
      where: { referrerId: referrer.id },
    });

    const newReferralCount = currentReferralCount + 1;
    const tierBonus = this.TIER_BONUSES[newReferralCount] || 0;
    const referrerXp = this.BASE_REFERRAL_XP + tierBonus;
    const refereeXp = this.BASE_REFERRAL_XP;

    // Create referral and award XP in a transaction
    const [referral] = await this.prisma.$transaction([
      this.prisma.referral.create({
        data: {
          referrerId: referrer.id,
          refereeId,
          xpAwarded: referrerXp,
        },
      }),
      // Award XP to referrer
      this.prisma.user.update({
        where: { id: referrer.id },
        data: {
          xp: { increment: referrerXp },
          referralXpEarned: { increment: referrerXp },
        },
      }),
      // Award XP to referee
      this.prisma.user.update({
        where: { id: refereeId },
        data: {
          xp: { increment: refereeXp },
        },
      }),
    ]);

    // Get referee username for notification
    const referee = await this.prisma.user.findUnique({
      where: { id: refereeId },
      select: { username: true },
    });

    // Track analytics
    await Promise.all([
      this.analyticsService.track(referrer.id, 'REFERRAL_COMPLETED', {
        refereeId,
        xpAwarded: referrerXp,
        tierBonus,
        totalReferrals: newReferralCount,
      }),
      this.analyticsService.track(refereeId, 'REFERRAL_COMPLETED', {
        referrerId: referrer.id,
        xpAwarded: refereeXp,
        isReferee: true,
      }),
    ]);

    // Send notifications
    await this.notificationsService.sendReferralCompletedNotification(
      referrer.id,
      referee?.username ?? 'New user',
      referrerXp,
    );

    // Check achievements for referrer
    await this.achievementCheckerService.checkAndUnlock(referrer.id, 'referral');

    return {
      success: true,
      xpAwarded: refereeXp,
      message: `Welcome bonus! You earned ${refereeXp} XP!`,
      referrerXpAwarded: referrerXp,
    };
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string) {
    const [user, referrals] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true, referralXpEarned: true },
      }),
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referee: {
            select: { username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalReferrals = referrals.length;

    // Calculate next tier
    let nextTierAt: number | null = null;
    let nextTierBonus: number | null = null;

    const tierThresholds = Object.keys(this.TIER_BONUSES)
      .map(Number)
      .sort((a, b) => a - b);

    for (const threshold of tierThresholds) {
      if (totalReferrals < threshold) {
        nextTierAt = threshold;
        nextTierBonus = this.TIER_BONUSES[threshold];
        break;
      }
    }

    return {
      referralCode: user.referralCode,
      totalReferrals,
      xpEarned: user.referralXpEarned,
      referrals: referrals.map((r) => ({
        refereeUsername: r.referee.username,
        createdAt: r.createdAt,
        xpAwarded: r.xpAwarded,
      })),
      nextTierAt,
      nextTierBonus,
    };
  }

  /**
   * Ensure user has a referral code (for existing users)
   */
  async ensureReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user already has a code, return it
    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate and save a new code
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = this.generateReferralCode();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode: code },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code! },
    });

    return code!;
  }
}
