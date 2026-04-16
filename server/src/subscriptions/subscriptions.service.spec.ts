import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService, PLANS } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SubscriptionPlan, SubStatus } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'axel@mindy.app',
    username: 'axel',
    xp: 500,
    level: 3,
    streak: 5,
    streakFreezes: 2,
    ...overrides,
  };
}

function baseSub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    plan: SubscriptionPlan.FREE,
    status: SubStatus.ACTIVE,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripePriceId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-03-09'),
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAnalytics = { track: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getPlans()
  // ────────────────────────────────────────────────────────────────────────────

  describe('getPlans()', () => {
    it('returns all 3 plans', () => {
      const plans = service.getPlans();
      expect(plans).toHaveLength(3);
      expect(plans.map((p) => p.plan)).toEqual([
        SubscriptionPlan.FREE,
        SubscriptionPlan.PRO_MONTHLY,
        SubscriptionPlan.PRO_ANNUAL,
      ]);
    });

    it('FREE plan has price 0 and no stripePriceId', () => {
      const free = service.getPlans().find((p) => p.plan === SubscriptionPlan.FREE)!;
      expect(free.price).toBe(0);
      expect(free.stripePriceId).toBeNull();
      expect(free.interval).toBeNull();
    });

    it('PRO_MONTHLY has monthly interval and price > 0', () => {
      const monthly = service.getPlans().find((p) => p.plan === SubscriptionPlan.PRO_MONTHLY)!;
      expect(monthly.interval).toBe('month');
      expect(monthly.price).toBeGreaterThan(0);
    });

    it('PRO_ANNUAL has yearly interval and cheaper per-month than monthly', () => {
      const annual = service.getPlans().find((p) => p.plan === SubscriptionPlan.PRO_ANNUAL)!;
      const monthly = service.getPlans().find((p) => p.plan === SubscriptionPlan.PRO_MONTHLY)!;
      expect(annual.interval).toBe('year');
      // annual / 12 < monthly
      expect(annual.price / 12).toBeLessThan(monthly.price);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getSubscription()
  // ────────────────────────────────────────────────────────────────────────────

  describe('getSubscription()', () => {
    it('throws NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getSubscription('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns existing subscription with planDetails and isPro=false for FREE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      const sub = baseSub();
      mockPrisma.subscription.findUnique.mockResolvedValue(sub);

      const result = await service.getSubscription('user-1');

      expect(result.plan).toBe(SubscriptionPlan.FREE);
      expect(result.isPro).toBe(false);
      expect(result.planDetails).toBeDefined();
      expect(result.planDetails.plan).toBe(SubscriptionPlan.FREE);
    });

    it('returns isPro=true for PRO_MONTHLY subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      mockPrisma.subscription.findUnique.mockResolvedValue(
        baseSub({ plan: SubscriptionPlan.PRO_MONTHLY }),
      );

      const result = await service.getSubscription('user-1');
      expect(result.isPro).toBe(true);
      expect(result.planDetails.plan).toBe(SubscriptionPlan.PRO_MONTHLY);
    });

    it('auto-creates FREE subscription if none exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      const createdSub = baseSub();
      mockPrisma.subscription.create.mockResolvedValue(createdSub);

      const result = await service.getSubscription('user-1');

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          plan: SubscriptionPlan.FREE,
          status: SubStatus.ACTIVE,
        },
      });
      expect(result.plan).toBe(SubscriptionPlan.FREE);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // subscribe()
  // ────────────────────────────────────────────────────────────────────────────

  describe('subscribe()', () => {
    it('throws NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.subscribe('ghost', SubscriptionPlan.PRO_MONTHLY),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when trying to subscribe to FREE plan', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      await expect(
        service.subscribe('user-1', SubscriptionPlan.FREE),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('upserts PRO_MONTHLY subscription with correct periodEnd (~30 days)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      const sub = baseSub({ plan: SubscriptionPlan.PRO_MONTHLY, status: SubStatus.ACTIVE });
      mockPrisma.subscription.upsert.mockResolvedValue(sub);
      mockPrisma.user.update.mockResolvedValue(baseUser());

      const before = new Date();
      await service.subscribe('user-1', SubscriptionPlan.PRO_MONTHLY);
      const after = new Date();

      const { update: updateArg } = mockPrisma.subscription.upsert.mock.calls[0][0];
      const periodEnd: Date = updateArg.currentPeriodEnd;

      // Should be approximately 1 month from now
      expect(periodEnd.getTime()).toBeGreaterThan(before.getTime() + 28 * 86400 * 1000);
      expect(periodEnd.getTime()).toBeLessThan(after.getTime() + 32 * 86400 * 1000);
    });

    it('upserts PRO_ANNUAL subscription with periodEnd ~1 year out', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      const sub = baseSub({ plan: SubscriptionPlan.PRO_ANNUAL, status: SubStatus.ACTIVE });
      mockPrisma.subscription.upsert.mockResolvedValue(sub);
      mockPrisma.user.update.mockResolvedValue(baseUser());

      const before = new Date();
      await service.subscribe('user-1', SubscriptionPlan.PRO_ANNUAL);

      const { update: updateArg } = mockPrisma.subscription.upsert.mock.calls[0][0];
      const periodEnd: Date = updateArg.currentPeriodEnd;

      expect(periodEnd.getTime()).toBeGreaterThan(before.getTime() + 360 * 86400 * 1000);
    });

    it('grants 10 streak freezes on Pro subscribe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      mockPrisma.subscription.upsert.mockResolvedValue(baseSub({ plan: SubscriptionPlan.PRO_MONTHLY }));
      mockPrisma.user.update.mockResolvedValue(baseUser());

      await service.subscribe('user-1', SubscriptionPlan.PRO_MONTHLY);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { streakFreezes: { increment: 10 } },
      });
    });

    it('tracks analytics event on subscribe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      mockPrisma.subscription.upsert.mockResolvedValue(baseSub({ plan: SubscriptionPlan.PRO_MONTHLY }));
      mockPrisma.user.update.mockResolvedValue(baseUser());

      await service.subscribe('user-1', SubscriptionPlan.PRO_MONTHLY);

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'user-1',
        expect.anything(), // EventType
        expect.objectContaining({ action: 'subscription_started', plan: SubscriptionPlan.PRO_MONTHLY }),
      );
    });

    it('returns isPro=true after subscribing', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser());
      const sub = baseSub({ plan: SubscriptionPlan.PRO_MONTHLY });
      mockPrisma.subscription.upsert.mockResolvedValue(sub);
      mockPrisma.user.update.mockResolvedValue(baseUser());

      const result = await service.subscribe('user-1', SubscriptionPlan.PRO_MONTHLY);
      expect(result.isPro).toBe(true);
      expect(result.planDetails.plan).toBe(SubscriptionPlan.PRO_MONTHLY);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // cancelSubscription()
  // ────────────────────────────────────────────────────────────────────────────

  describe('cancelSubscription()', () => {
    it('throws NotFoundException if no subscription exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      await expect(service.cancelSubscription('user-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sets cancelAtPeriodEnd=true without immediately deactivating', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        baseSub({ plan: SubscriptionPlan.PRO_MONTHLY }),
      );
      const updated = baseSub({ plan: SubscriptionPlan.PRO_MONTHLY, cancelAtPeriodEnd: true });
      mockPrisma.subscription.update.mockResolvedValue(updated);

      const result = await service.cancelSubscription('user-1');

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { cancelAtPeriodEnd: true },
      });
      expect(result.cancelAtPeriodEnd).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // isPro()
  // ────────────────────────────────────────────────────────────────────────────

  describe('isPro()', () => {
    it('returns false when no subscription exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      expect(await service.isPro('user-1')).toBe(false);
    });

    it('returns false for FREE plan', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(baseSub());
      expect(await service.isPro('user-1')).toBe(false);
    });

    it('returns true for active PRO_MONTHLY plan', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        baseSub({ plan: SubscriptionPlan.PRO_MONTHLY, status: SubStatus.ACTIVE }),
      );
      expect(await service.isPro('user-1')).toBe(true);
    });

    it('returns true for active PRO_ANNUAL plan', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        baseSub({ plan: SubscriptionPlan.PRO_ANNUAL, status: SubStatus.ACTIVE }),
      );
      expect(await service.isPro('user-1')).toBe(true);
    });

    it('returns false for canceled (CANCELED status) PRO plan', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(
        baseSub({ plan: SubscriptionPlan.PRO_MONTHLY, status: SubStatus.CANCELLED }),
      );
      expect(await service.isPro('user-1')).toBe(false);
    });
  });
});
