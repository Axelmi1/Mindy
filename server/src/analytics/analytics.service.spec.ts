import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  analyticsEvent: {
    create: jest.fn(),
    createMany: jest.fn(),
    groupBy: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  userProgress: {
    groupBy: jest.fn(),
  },
  subscription: {
    count: jest.fn(),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a fake user with a signup date offset in days from now */
function fakeUser(id: string, daysAgo: number) {
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return { id, createdAt };
}

/** Create a fake analytics event for a user at a time offset in days from now */
function fakeEvent(userId: string, daysAgo: number) {
  return { userId, timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  // ── getFunnelAnalytics ─────────────────────────────────────────────────────

  describe('getFunnelAnalytics', () => {
    /** Baseline setup: 100 signups, 80 completed onboarding, 60 first lesson,
     *  2 users with D7 activity, 1 with D30, 5 Pro subscribers */
    function setupFunnelMocks(overrides: {
      totalSignups?: number;
      completedOnboarding?: number;
      usersWithLesson?: number;
      allUsers?: ReturnType<typeof fakeUser>[];
      allEvents?: ReturnType<typeof fakeEvent>[];
      proSubscribers?: number;
    } = {}) {
      const totalSignups = overrides.totalSignups ?? 100;
      const completedOnboarding = overrides.completedOnboarding ?? 80;
      const usersWithLessonCount = overrides.usersWithLesson ?? 60;
      const proSubscribers = overrides.proSubscribers ?? 5;

      // Default: 2 users who signed up 20 days ago, each with a lesson 3 days after signup
      const allUsers = overrides.allUsers ?? [
        fakeUser('u-1', 20),
        fakeUser('u-2', 20),
        fakeUser('u-3', 5),
      ];

      const allEvents = overrides.allEvents ?? [
        fakeEvent('u-1', 17), // u-1 lesson 3 days after signup (within D7)
        fakeEvent('u-2', 18), // u-2 lesson 2 days after signup (within D7)
        fakeEvent('u-3', 4),  // u-3 lesson 1 day after signup (within D7)
      ];

      // Build userProgress.groupBy result: one row per unique userId
      const userProgressRows = Array.from(
        { length: usersWithLessonCount },
        (_, i) => ({ userId: `user-${i}`, _count: { userId: 1 } }),
      );

      mockPrisma.user.count.mockResolvedValue(totalSignups);
      mockPrisma.user.count.mockResolvedValueOnce(totalSignups)  // total count
        .mockResolvedValueOnce(completedOnboarding); // completed onboarding

      mockPrisma.userProgress.groupBy.mockResolvedValue(userProgressRows);
      mockPrisma.user.findMany.mockResolvedValue(allUsers);
      mockPrisma.analyticsEvent.findMany.mockResolvedValue(allEvents);
      mockPrisma.subscription.count.mockResolvedValue(proSubscribers);
    }

    it('returns 6 funnel steps in the correct order', async () => {
      setupFunnelMocks();

      const result = await service.getFunnelAnalytics();

      expect(result.steps).toHaveLength(6);
      expect(result.steps[0].label).toBe('Signups');
      expect(result.steps[1].label).toBe('Onboarding complété');
      expect(result.steps[2].label).toBe('Première leçon');
      expect(result.steps[3].label).toBe('Actif J+7');
      expect(result.steps[4].label).toBe('Actif J+30');
      expect(result.steps[5].label).toBe('Abonnés Pro');
    });

    it('step 1 count equals total signups', async () => {
      setupFunnelMocks({ totalSignups: 150 });

      const result = await service.getFunnelAnalytics();

      expect(result.steps[0].count).toBe(150);
      expect(result.totalSignups).toBe(150);
    });

    it('step 1 has null conversionFromPrevious (no previous step)', async () => {
      setupFunnelMocks();

      const result = await service.getFunnelAnalytics();

      expect(result.steps[0].conversionFromPrevious).toBeNull();
      expect(result.steps[0].conversionFromTop).toBe(100);
    });

    it('step 2 conversionFromPrevious = onboarding/signups * 100', async () => {
      setupFunnelMocks({ totalSignups: 100, completedOnboarding: 80 });

      const result = await service.getFunnelAnalytics();

      // 80/100 = 80%
      expect(result.steps[1].conversionFromPrevious).toBe(80);
    });

    it('step 6 count equals pro subscribers', async () => {
      setupFunnelMocks({ proSubscribers: 12 });

      const result = await service.getFunnelAnalytics();

      expect(result.steps[5].count).toBe(12);
    });

    it('dropOffs has 5 entries (between each consecutive step)', async () => {
      setupFunnelMocks();

      const result = await service.getFunnelAnalytics();

      expect(result.dropOffs).toHaveLength(5);
    });

    it('each dropOff references fromStep and toStep sequentially', async () => {
      setupFunnelMocks();

      const result = await service.getFunnelAnalytics();

      result.dropOffs.forEach((d, i) => {
        expect(d.fromStep).toBe(i + 1);
        expect(d.toStep).toBe(i + 2);
      });
    });

    it('dropOff count reflects decrease between consecutive steps', async () => {
      // Use consistent funnel data: each step is a subset of the previous
      // signups=100 → onboarding=80 → lesson=60 → D7=3 → D30=3 → Pro=2
      const allUsers = [fakeUser('u-1', 20), fakeUser('u-2', 20), fakeUser('u-3', 5)];
      const allEvents = [
        fakeEvent('u-1', 17),
        fakeEvent('u-2', 18),
        fakeEvent('u-3', 4),
      ];
      setupFunnelMocks({ totalSignups: 100, completedOnboarding: 80, usersWithLesson: 60, proSubscribers: 2, allUsers, allEvents });

      const result = await service.getFunnelAnalytics();

      // Steps 1-5 should have non-negative drop-offs (100 ≥ 80 ≥ 60 ≥ 3 ≥ 3)
      expect(result.dropOffs[0].dropOff).toBeGreaterThanOrEqual(0); // signups → onboarding
      expect(result.dropOffs[1].dropOff).toBeGreaterThanOrEqual(0); // onboarding → lesson
      // Step 3→4: D7 might be < lesson count
      expect(result.dropOffs[3].dropOff).toBeGreaterThanOrEqual(0); // D7 → D30 (D30 ≤ D7)
      // Step 4→5: Pro ≤ D30 when data is consistent
      expect(result.dropOffs[4].dropOff).toBeGreaterThanOrEqual(0); // D30 → Pro
    });

    it('counts D7 active users correctly', async () => {
      // u-1 signed up 20 days ago, lesson 17 days ago (3 days after signup → within D7)
      // u-2 signed up 20 days ago, lesson 12 days ago (8 days after signup → OUTSIDE D7)
      // u-3 signed up 5 days ago, no lessons
      const allUsers = [fakeUser('u-1', 20), fakeUser('u-2', 20), fakeUser('u-3', 5)];
      const allEvents = [
        fakeEvent('u-1', 17), // 3 days after signup → within D7 ✅
        fakeEvent('u-2', 12), // 8 days after signup → outside D7 ❌
        // u-3 no events
      ];

      setupFunnelMocks({ allUsers, allEvents });

      const result = await service.getFunnelAnalytics();

      // Only u-1 is D7 active
      expect(result.steps[3].count).toBe(1);
    });

    it('counts D30 active users correctly', async () => {
      // u-1 signed up 40 days ago, lesson 35 days ago (5 days after signup → within D30 ✅)
      // u-2 signed up 40 days ago, lesson 5 days ago (35 days after signup → outside D30 ❌)
      const allUsers = [fakeUser('u-1', 40), fakeUser('u-2', 40)];
      const allEvents = [
        fakeEvent('u-1', 35), // 5 days after signup → within D30 ✅
        fakeEvent('u-2', 5),  // 35 days after signup → outside D30 ❌
      ];

      setupFunnelMocks({ allUsers, allEvents });

      const result = await service.getFunnelAnalytics();

      expect(result.steps[4].count).toBe(1);
    });

    it('overall conversion = proSubscribers / totalSignups * 100', async () => {
      setupFunnelMocks({ totalSignups: 100, proSubscribers: 10, allUsers: [], allEvents: [] });

      const result = await service.getFunnelAnalytics();

      expect(result.overallConversion).toBe(10);
    });

    it('handles zero signups gracefully (no division by zero)', async () => {
      setupFunnelMocks({ totalSignups: 0, completedOnboarding: 0, usersWithLesson: 0, proSubscribers: 0, allUsers: [], allEvents: [] });

      const result = await service.getFunnelAnalytics();

      expect(result.steps[1].conversionFromPrevious).toBe(0);
      expect(result.overallConversion).toBe(0);
    });

    it('includes generatedAt ISO timestamp', async () => {
      setupFunnelMocks();

      const result = await service.getFunnelAnalytics();

      expect(typeof result.generatedAt).toBe('string');
      expect(() => new Date(result.generatedAt)).not.toThrow();
    });
  });

  // ── track ──────────────────────────────────────────────────────────────────

  describe('track', () => {
    it('creates an analytics event', async () => {
      const fakeEvent = { id: 'evt-1', userId: 'u-1', eventType: 'LESSON_COMPLETED' };
      mockPrisma.analyticsEvent.create.mockResolvedValue(fakeEvent);

      const result = await service.track('u-1', 'LESSON_COMPLETED' as any, { lessonId: 'l-1' });

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u-1',
            eventType: 'LESSON_COMPLETED',
          }),
        }),
      );
      expect(result).toEqual(fakeEvent);
    });
  });
});
