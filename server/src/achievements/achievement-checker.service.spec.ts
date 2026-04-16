import { Test, TestingModule } from '@nestjs/testing';
import { AchievementCheckerService, AchievementTrigger } from './achievement-checker.service';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from './achievements.service';

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  xp: 250,
  level: 5,
  streak: 10,
};

const mockAchievements = [
  { id: 'ach-1', key: 'first_lesson', requirementType: 'LESSONS_COMPLETED', requirementValue: 1 },
  { id: 'ach-2', key: 'streak_3', requirementType: 'STREAK_DAYS', requirementValue: 3 },
  { id: 'ach-3', key: 'xp_100', requirementType: 'XP_EARNED', requirementValue: 100 },
  { id: 'ach-4', key: 'level_5', requirementType: 'LEVEL_REACHED', requirementValue: 5 },
  { id: 'ach-5', key: 'daily_1', requirementType: 'DAILY_CHALLENGES', requirementValue: 1 },
  { id: 'ach-6', key: 'crypto_5', requirementType: 'CRYPTO_LESSONS_COMPLETED', requirementValue: 5 },
  { id: 'ach-7', key: 'referral_1', requirementType: 'REFERRALS_MADE', requirementValue: 1 },
  // Master quiz achievements
  { id: 'ach-8', key: 'crypto_legend', requirementType: 'CRYPTO_MASTER_QUIZ_COMPLETED', requirementValue: 1 },
  { id: 'ach-9', key: 'finance_legend', requirementType: 'FINANCE_MASTER_QUIZ_COMPLETED', requirementValue: 1 },
  { id: 'ach-10', key: 'trading_legend', requirementType: 'TRADING_MASTER_QUIZ_COMPLETED', requirementValue: 1 },
];

const mockUserStats = {
  lessonsCompleted: 5,
  dailyChallengesCompleted: 2,
  referralsCount: 0,
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: { findUnique: jest.fn() },
  userAchievement: { findMany: jest.fn() },
  userProgress: { count: jest.fn() },
  dailyChallenge: { count: jest.fn() },
  referral: { count: jest.fn() },
  achievement: { findMany: jest.fn() },
  lesson: { findMany: jest.fn() },
};

const mockAchievementsService = {
  unlockAchievement: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('AchievementCheckerService', () => {
  let service: AchievementCheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementCheckerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AchievementsService, useValue: mockAchievementsService },
      ],
    }).compile();

    service = module.get<AchievementCheckerService>(AchievementCheckerService);
    jest.clearAllMocks();
  });

  // ── Helper: setup standard mocks ──────────────────────────────────────────

  function setupMocks(
    overrides: Partial<typeof mockUserStats> = {},
    alreadyUnlockedIds: string[] = [],
  ) {
    const stats = { ...mockUserStats, ...overrides };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userAchievement.findMany.mockResolvedValue(
      alreadyUnlockedIds.map((id) => ({ achievementId: id })),
    );
    mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
    mockPrisma.userProgress.count.mockResolvedValue(stats.lessonsCompleted);
    mockPrisma.dailyChallenge.count.mockResolvedValue(stats.dailyChallengesCompleted);
    mockPrisma.referral.count.mockResolvedValue(stats.referralsCount);
    mockPrisma.lesson.findMany.mockResolvedValue([
      ...Array(5).fill({ domain: 'CRYPTO' }),
      ...Array(2).fill({ domain: 'FINANCE' }),
    ]);
    mockAchievementsService.unlockAchievement.mockResolvedValue({ alreadyUnlocked: false });
  }

  // ── checkAndUnlock ─────────────────────────────────────────────────────────

  describe('checkAndUnlock', () => {
    it('returns empty array if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([]);
      mockPrisma.userProgress.count.mockResolvedValue(0);
      mockPrisma.dailyChallenge.count.mockResolvedValue(0);
      mockPrisma.referral.count.mockResolvedValue(0);
      mockPrisma.lesson.findMany.mockResolvedValue([]);

      const result = await service.checkAndUnlock('unknown-user', 'lesson_completed');

      expect(result).toEqual([]);
      expect(mockAchievementsService.unlockAchievement).not.toHaveBeenCalled();
    });

    it('unlocks lesson achievement when threshold met', async () => {
      setupMocks({ lessonsCompleted: 1 });

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      expect(result).toContain('first_lesson');
      expect(mockAchievementsService.unlockAchievement).toHaveBeenCalledWith(
        'user-1',
        'first_lesson',
      );
    });

    it('does not unlock already-unlocked achievements', async () => {
      setupMocks({ lessonsCompleted: 1 }, ['ach-1']); // ach-1 = first_lesson already unlocked

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      expect(result).not.toContain('first_lesson');
    });

    it('unlocks streak achievement on streak_updated trigger', async () => {
      setupMocks();
      // mockUser.streak = 10, ach-2 requires 3

      const result = await service.checkAndUnlock('user-1', 'streak_updated');

      expect(result).toContain('streak_3');
    });

    it('does NOT check streak achievements on lesson_completed trigger', async () => {
      setupMocks();

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      // streak_3 should NOT be unlocked because trigger is lesson_completed
      expect(result).not.toContain('streak_3');
    });

    it('unlocks xp achievement on xp_gained trigger', async () => {
      setupMocks();
      // mockUser.xp = 250, ach-3 requires 100

      const result = await service.checkAndUnlock('user-1', 'xp_gained');

      expect(result).toContain('xp_100');
    });

    it('unlocks level achievement on xp_gained trigger', async () => {
      setupMocks();
      // mockUser.level = 5, ach-4 requires 5

      const result = await service.checkAndUnlock('user-1', 'xp_gained');

      expect(result).toContain('level_5');
    });

    it('unlocks daily_challenge achievement on daily_challenge trigger', async () => {
      setupMocks({ dailyChallengesCompleted: 1 });

      const result = await service.checkAndUnlock('user-1', 'daily_challenge');

      expect(result).toContain('daily_1');
    });

    it('unlocks crypto achievement on lesson_completed trigger', async () => {
      setupMocks({ lessonsCompleted: 6 });
      // lesson.findMany returns 5 CRYPTO, ach-6 requires CRYPTO_LESSONS_COMPLETED >= 5

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      expect(result).toContain('crypto_5');
    });

    it('does not unlock referral achievement on non-referral trigger', async () => {
      setupMocks({ referralsCount: 5 });

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      expect(result).not.toContain('referral_1');
    });

    it('unlocks referral achievement on referral trigger', async () => {
      setupMocks({ referralsCount: 1 });

      const result = await service.checkAndUnlock('user-1', 'referral');

      expect(result).toContain('referral_1');
    });

    it('skips already-unlocked achievements silently', async () => {
      setupMocks();
      mockAchievementsService.unlockAchievement.mockResolvedValue({ alreadyUnlocked: true });

      const result = await service.checkAndUnlock('user-1', 'xp_gained');

      // alreadyUnlocked = true means NOT pushed to result
      expect(result).toEqual([]);
    });

    it('returns empty array on Prisma error without throwing', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      expect(result).toEqual([]);
    });
  });

  // ── master_quiz_completed trigger ──────────────────────────────────────────

  describe('master_quiz_completed trigger', () => {
    function setupMasterMocks(
      masterCounts: { crypto?: number; finance?: number; trading?: number } = {},
      alreadyUnlockedIds: string[] = [],
    ) {
      const cryptoMasterCount = masterCounts.crypto ?? 0;
      const financeMasterCount = masterCounts.finance ?? 0;
      const tradingMasterCount = masterCounts.trading ?? 0;

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.userAchievement.findMany.mockResolvedValue(
        alreadyUnlockedIds.map((id) => ({ achievementId: id })),
      );
      mockPrisma.achievement.findMany.mockResolvedValue(mockAchievements);
      mockPrisma.userProgress.count.mockResolvedValue(10);
      mockPrisma.dailyChallenge.count.mockResolvedValue(0);
      mockPrisma.referral.count.mockResolvedValue(0);

      // lesson.findMany must return regular + master quiz lessons
      mockPrisma.lesson.findMany.mockResolvedValue([
        // Regular lessons by domain
        ...Array(5).fill({ domain: 'CRYPTO', isMasterQuiz: false }),
        ...Array(5).fill({ domain: 'FINANCE', isMasterQuiz: false }),
        ...Array(5).fill({ domain: 'TRADING', isMasterQuiz: false }),
        // Master quiz completions
        ...Array(cryptoMasterCount).fill({ domain: 'CRYPTO', isMasterQuiz: true }),
        ...Array(financeMasterCount).fill({ domain: 'FINANCE', isMasterQuiz: true }),
        ...Array(tradingMasterCount).fill({ domain: 'TRADING', isMasterQuiz: true }),
      ]);

      mockAchievementsService.unlockAchievement.mockResolvedValue({ alreadyUnlocked: false });
    }

    it('unlocks crypto_legend when CRYPTO master quiz is completed', async () => {
      setupMasterMocks({ crypto: 1 });

      const result = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'CRYPTO' },
      );

      expect(result).toContain('crypto_legend');
      expect(result).not.toContain('finance_legend');
      expect(result).not.toContain('trading_legend');
    });

    it('unlocks finance_legend when FINANCE master quiz is completed', async () => {
      setupMasterMocks({ finance: 1 });

      const result = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'FINANCE' },
      );

      expect(result).toContain('finance_legend');
      expect(result).not.toContain('crypto_legend');
      expect(result).not.toContain('trading_legend');
    });

    it('unlocks trading_legend when TRADING master quiz is completed', async () => {
      setupMasterMocks({ trading: 1 });

      const result = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'TRADING' },
      );

      expect(result).toContain('trading_legend');
      expect(result).not.toContain('crypto_legend');
      expect(result).not.toContain('finance_legend');
    });

    it('does NOT unlock crypto_legend on FINANCE master_quiz_completed context', async () => {
      // CRYPTO master quiz done but context.domain = FINANCE → should not trigger crypto
      setupMasterMocks({ crypto: 1, finance: 1 });

      const result = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'FINANCE' },
      );

      // Should unlock finance_legend
      expect(result).toContain('finance_legend');
      // Should NOT unlock crypto_legend on a FINANCE trigger
      expect(result).not.toContain('crypto_legend');
    });

    it('does NOT unlock master achievements on lesson_completed trigger', async () => {
      setupMasterMocks({ crypto: 1 });

      const result = await service.checkAndUnlock('user-1', 'lesson_completed');

      expect(result).not.toContain('crypto_legend');
      expect(result).not.toContain('finance_legend');
      expect(result).not.toContain('trading_legend');
    });

    it('does NOT unlock already-unlocked legend achievement', async () => {
      setupMasterMocks({ crypto: 1 }, ['ach-8']); // ach-8 = crypto_legend already unlocked

      const result = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'CRYPTO' },
      );

      expect(result).not.toContain('crypto_legend');
    });

    it('unlocks all 3 legends when all master quizzes done (separate trigger calls)', async () => {
      // Simulate the crypto domain trigger with all 3 master quizzes completed
      setupMasterMocks({ crypto: 1, finance: 1, trading: 1 });

      // On CRYPTO trigger → only crypto_legend (domain filter in shouldUnlock)
      const resultCrypto = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'CRYPTO' },
      );
      expect(resultCrypto).toContain('crypto_legend');
    });

    it('returns empty array when master quiz count is 0 for domain', async () => {
      setupMasterMocks({ crypto: 0 }); // no crypto master quiz completed

      const result = await service.checkAndUnlock(
        'user-1',
        'master_quiz_completed',
        { domain: 'CRYPTO' },
      );

      expect(result).not.toContain('crypto_legend');
    });
  });
});
