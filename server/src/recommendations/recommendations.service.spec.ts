import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from './recommendations.service';
import { PrismaService } from '../prisma/prisma.service';
import { Domain, Difficulty } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeLesson(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lesson-1',
    title: 'Intro to Bitcoin',
    domain: Domain.CRYPTO,
    difficulty: Difficulty.BEGINNER,
    xpReward: 20,
    orderIndex: 1,
    ...overrides,
  };
}

function makeProgress(lessonId: string, isCompleted = false, completedSteps: string[] = []) {
  return {
    lessonId,
    isCompleted,
    completedSteps,
    lesson: makeLesson({ id: lessonId }),
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    username: 'axel',
    xp: 0,
    level: 1,
    streak: 0,
    preferredDomain: Domain.CRYPTO,
    progress: [] as ReturnType<typeof makeProgress>[],
    ...overrides,
  };
}

// Build a set of 9 mock lessons across 3 domains
function makeLessonCatalog() {
  const domains = [Domain.CRYPTO, Domain.FINANCE, Domain.TRADING];
  const lessons = [];
  let idx = 1;
  for (const domain of domains) {
    for (let i = 0; i < 3; i++) {
      lessons.push(
        makeLesson({
          id: `lesson-${domain}-${i}`,
          title: `${domain} lesson ${i}`,
          domain,
          difficulty: i === 0 ? Difficulty.BEGINNER : i === 1 ? Difficulty.INTERMEDIATE : Difficulty.ADVANCED,
          orderIndex: idx++,
        }),
      );
    }
  }
  return lessons;
}

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

describe('RecommendationsService', () => {
  let service: RecommendationsService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    lesson: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getPersonalizedPath()
  // ────────────────────────────────────────────────────────────────────────────

  describe('getPersonalizedPath()', () => {
    it('returns an empty path with starter message when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getPersonalizedPath('ghost');

      expect(result.userId).toBe('ghost');
      expect(result.recommendations).toHaveLength(0);
      expect(result.completionRate).toBe(0);
      expect(result.aiMessage).toContain('🚀');
    });

    it('returns completionRate=0 for brand-new user with no progress', async () => {
      const user = makeUser({ progress: [] });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(makeLessonCatalog());

      const result = await service.getPersonalizedPath('user-1');

      expect(result.completionRate).toBe(0);
      expect(result.dominantDomain).toBeDefined(); // default to CRYPTO
    });

    it('returns up to 6 recommendations for a user with some incomplete lessons', async () => {
      const catalog = makeLessonCatalog();
      const user = makeUser({ progress: [] });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      expect(result.recommendations.length).toBeLessThanOrEqual(6);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('excludes already-completed lessons from recommendations', async () => {
      const catalog = makeLessonCatalog();
      const completedId = 'lesson-CRYPTO-0';
      const user = makeUser({
        progress: [{ ...makeProgress(completedId, true), lesson: catalog[0] }],
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      const recommendedIds = result.recommendations.map((r) => r.lessonId);
      expect(recommendedIds).not.toContain(completedId);
    });

    it('correctly computes completionRate when some lessons done', async () => {
      const catalog = makeLessonCatalog(); // 9 total
      const user = makeUser({
        progress: [
          { ...makeProgress('lesson-CRYPTO-0', true), lesson: catalog[0] },
          { ...makeProgress('lesson-CRYPTO-1', true), lesson: catalog[1] },
          { ...makeProgress('lesson-CRYPTO-2', true), lesson: catalog[2] },
        ],
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      // 3 completed out of 9 = 1/3 ≈ 0.333
      expect(result.completionRate).toBeCloseTo(1 / 3, 2);
    });

    it('identifies weak domain correctly when FINANCE has 0 completions', async () => {
      const catalog = makeLessonCatalog();
      const user = makeUser({
        xp: 100,
        progress: [
          { ...makeProgress('lesson-CRYPTO-0', true), lesson: catalog[0] },
          { ...makeProgress('lesson-TRADING-0', true), lesson: catalog[6] },
        ],
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      expect(result.weakDomain).toBe(Domain.FINANCE);
    });

    it('boosts in-progress lesson (started but incomplete) to highest priority', async () => {
      const catalog = makeLessonCatalog();
      const inProgressId = 'lesson-FINANCE-1';
      const user = makeUser({
        progress: [
          {
            lessonId: inProgressId,
            isCompleted: false,
            completedSteps: ['step-1', 'step-2'],
            lesson: catalog.find((l) => l.id === inProgressId)!,
          },
        ],
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      const inProgressRec = result.recommendations.find((r) => r.lessonId === inProgressId)!;
      expect(inProgressRec).toBeDefined();
      expect(inProgressRec.reason).toBe('Resume where you left off');
      // Should be top priority
      expect(result.recommendations[0].lessonId).toBe(inProgressId);
    });

    it('generates an encouraging aiMessage mentioning username', async () => {
      const catalog = makeLessonCatalog();
      const user = makeUser({ username: 'axel', progress: [] });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      expect(result.aiMessage).toContain('axel');
    });

    it('returns a valid nextMilestone with type, current, target and label', async () => {
      const catalog = makeLessonCatalog();
      const user = makeUser({ xp: 50, streak: 2, progress: [] });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      expect(result.nextMilestone).toMatchObject({
        type: expect.any(String),
        current: expect.any(Number),
        target: expect.any(Number),
        label: expect.any(String),
      });
      expect(result.nextMilestone.target).toBeGreaterThan(result.nextMilestone.current);
    });

    it('returns all 6 recommendations when enough lessons available', async () => {
      // Create 12 lessons so top 6 can be selected
      const lots = Array.from({ length: 12 }, (_, i) =>
        makeLesson({
          id: `lesson-${i}`,
          domain: i % 3 === 0 ? Domain.CRYPTO : i % 3 === 1 ? Domain.FINANCE : Domain.TRADING,
          orderIndex: i + 1,
        }),
      );
      const user = makeUser({ progress: [] });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(lots);

      const result = await service.getPersonalizedPath('user-1');

      expect(result.recommendations).toHaveLength(6);
    });

    it('marks weak domain lessons with isWeak=true', async () => {
      const catalog = makeLessonCatalog();
      // Only complete CRYPTO → FINANCE is weak
      const user = makeUser({
        progress: [
          { ...makeProgress('lesson-CRYPTO-0', true), lesson: catalog[0] },
          { ...makeProgress('lesson-CRYPTO-1', true), lesson: catalog[1] },
          { ...makeProgress('lesson-CRYPTO-2', true), lesson: catalog[2] },
          { ...makeProgress('lesson-TRADING-0', true), lesson: catalog[6] },
        ],
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.lesson.findMany.mockResolvedValue(catalog);

      const result = await service.getPersonalizedPath('user-1');

      const financeRecs = result.recommendations.filter(
        (r) => r.domain === Domain.FINANCE && r.isWeak,
      );
      expect(financeRecs.length).toBeGreaterThan(0);
    });
  });
});
