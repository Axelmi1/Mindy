import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventType } from '@prisma/client';

export interface PlanDetails {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | null;
  features: string[];
  stripePriceId: string | null;
}

export const PLANS: PlanDetails[] = [
  {
    plan: SubscriptionPlan.FREE,
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: null,
    features: [
      '5 lessons per day',
      'Basic streak tracking',
      'Standard leaderboard',
      'Daily challenge',
    ],
    stripePriceId: null,
  },
  {
    plan: SubscriptionPlan.PRO_MONTHLY,
    name: 'Pro Monthly',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited lessons',
      'AI-powered personalized path',
      'Advanced analytics',
      'Priority leaderboard badge',
      'Streak freeze × 10/month',
      'Offline mode (all content)',
      'Ad-free experience',
      'Pro profile badge',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
  },
  {
    plan: SubscriptionPlan.PRO_ANNUAL,
    name: 'Pro Annual',
    price: 79.99,
    currency: 'USD',
    interval: 'year',
    features: [
      'Everything in Pro Monthly',
      'Save 33% vs monthly',
      '2 months free',
      'Early access to new content',
      'Export progress PDF',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? null,
  },
];

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  /**
   * Get all available plans
   */
  getPlans(): PlanDetails[] {
    return PLANS;
  }

  /**
   * Get current subscription for a user
   */
  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    // Auto-create FREE subscription if none exists
    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: {
          userId,
          plan: SubscriptionPlan.FREE,
          status: SubStatus.ACTIVE,
        },
      });
    }

    return {
      ...sub,
      planDetails: PLANS.find((p) => p.plan === sub!.plan)!,
      isPro: sub.plan !== SubscriptionPlan.FREE,
    };
  }

  /**
   * Upgrade subscription (mock — real Stripe webhook in production)
   */
  async subscribe(userId: string, plan: SubscriptionPlan) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (plan === SubscriptionPlan.FREE) {
      throw new BadRequestException(
        'Use cancelSubscription to downgrade to Free',
      );
    }

    const periodEnd = new Date();
    if (plan === SubscriptionPlan.PRO_MONTHLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const sub = await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: SubStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        plan,
        status: SubStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
      },
    });

    // Grant Pro streak freezes bonus
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakFreezes: { increment: 10 } },
    });

    // Track analytics
    await this.analytics.track(userId, EventType.APP_OPENED, {
      action: 'subscription_started',
      plan,
    });

    return {
      ...sub,
      planDetails: PLANS.find((p) => p.plan === plan)!,
      isPro: true,
    };
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!sub) throw new NotFoundException('No active subscription');

    return this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }

  /**
   * Check if user has Pro access
   */
  async isPro(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return (
      !!sub &&
      sub.plan !== SubscriptionPlan.FREE &&
      sub.status === SubStatus.ACTIVE
    );
  }
}
