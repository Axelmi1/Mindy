import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DailyChallengeService } from './daily-challenge.service';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';

// ─── Mock data ───────────────────────────────────────────────────────────────

const mockLesson = {
  id: 'lesson-1',
  title: 'Bitcoin Basics',
  domain: 'CRYPTO',
  xpReward: 50,
  content: {},
  orderIndex: 0,
};

const mockChallenge = {
  id: 'challenge-1',
  userId: 'user-1',
  date: new Date('2026-03-09'),
  lessonId: 'lesson-1',
  isCompleted: false,
  xpBonusAwarded: 0,
  completedAt: null,
  lesson: mockLesson,
};

const mockUser = { id: 'user-1', xp: 100 };

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  dailyChallenge: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  lesson: {
    findFirst: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAchievementChecker = {
  checkAndUnlock: jest.fn().mockResolvedValue([]),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('DailyChallengeService', () => {
  let service: DailyChallengeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyChallengeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AchievementCheckerService, useValue: mockAchievementChecker },
      ],
    }).compile();

    service = module.get<DailyChallengeService>(DailyChallengeService);
    jest.clearAllMocks();
  });

  // ── getTodayChallenge ──────────────────────────────────────────────────────

  describe('getTodayChallenge', () => {
    it('returns existing challenge when already created for today', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(mockChallenge);

      const result = await service.getTodayChallenge('user-1');

      expect(result.id).toBe('challenge-1');
      expect(result.xpBonus).toBe(50);
      expect(result.timeUntilReset).toBeGreaterThan(0);
      expect(mockPrisma.dailyChallenge.create).not.toHaveBeenCalled();
    });

    it('creates a new challenge when none exists for today', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(null);
      mockPrisma.dailyChallenge.findMany.mockResolvedValue([]);
      mockPrisma.lesson.findFirst.mockResolvedValue(mockLesson);
      mockPrisma.dailyChallenge.create.mockResolvedValue(mockChallenge);

      const result = await service.getTodayChallenge('user-1');

      expect(mockPrisma.dailyChallenge.create).toHaveBeenCalledTimes(1);
      expect(result.lesson.id).toBe('lesson-1');
    });

    it('throws NotFoundException when no lesson is available', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(null);
      mockPrisma.dailyChallenge.findMany.mockResolvedValue([]);
      mockPrisma.lesson.findFirst.mockResolvedValue(null);

      await expect(service.getTodayChallenge('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('avoids recently used lesson IDs when picking challenge', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(null);
      mockPrisma.dailyChallenge.findMany.mockResolvedValue([
        { lessonId: 'lesson-old-1' },
        { lessonId: 'lesson-old-2' },
      ]);
      mockPrisma.lesson.findFirst.mockResolvedValueOnce(mockLesson);
      mockPrisma.dailyChallenge.create.mockResolvedValue(mockChallenge);

      await service.getTodayChallenge('user-1');

      // Verify the first findFirst call excluded recent lessons
      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { notIn: ['lesson-old-1', 'lesson-old-2'] } },
        }),
      );
    });

    it('falls back to any lesson when all recent lessons used', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(null);
      mockPrisma.dailyChallenge.findMany.mockResolvedValue([{ lessonId: 'lesson-1' }]);
      // First call (with notIn) returns null
      mockPrisma.lesson.findFirst
        .mockResolvedValueOnce(null)
        // Fallback call returns a lesson
        .mockResolvedValueOnce(mockLesson);
      mockPrisma.dailyChallenge.create.mockResolvedValue(mockChallenge);

      await service.getTodayChallenge('user-1');

      expect(mockPrisma.lesson.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  // ── completeChallenge ──────────────────────────────────────────────────────

  describe('completeChallenge', () => {
    it('completes challenge, awards 50 XP, triggers achievement check', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(mockChallenge);
      const completedChallenge = { ...mockChallenge, isCompleted: true, xpBonusAwarded: 50 };
      const updatedUser = { ...mockUser, xp: 150 };
      mockPrisma.$transaction.mockResolvedValue([completedChallenge, updatedUser]);

      const result = await service.completeChallenge('user-1');

      expect(result.xpAwarded).toBe(50);
      expect(result.newTotalXp).toBe(150);
      expect(mockAchievementChecker.checkAndUnlock).toHaveBeenCalledWith('user-1', 'daily_challenge');
    });

    it('throws NotFoundException when no challenge exists for today', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(null);

      await expect(service.completeChallenge('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when challenge already completed', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue({
        ...mockChallenge,
        isCompleted: true,
      });

      await expect(service.completeChallenge('user-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('runs complete + XP update in a single transaction', async () => {
      mockPrisma.dailyChallenge.findUnique.mockResolvedValue(mockChallenge);
      mockPrisma.$transaction.mockResolvedValue([
        { ...mockChallenge, isCompleted: true },
        mockUser,
      ]);

      await service.completeChallenge('user-1');

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── getChallengeHistory ────────────────────────────────────────────────────

  describe('getChallengeHistory', () => {
    it('returns up to 7 challenges ordered by date desc (default)', async () => {
      const history = Array.from({ length: 7 }, (_, i) => ({
        ...mockChallenge,
        id: `c-${i}`,
        isCompleted: i < 5,
      }));
      mockPrisma.dailyChallenge.findMany.mockResolvedValue(history);

      const result = await service.getChallengeHistory('user-1');

      expect(result).toHaveLength(7);
      expect(mockPrisma.dailyChallenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 7, orderBy: { date: 'desc' } }),
      );
    });

    it('respects custom limit parameter', async () => {
      mockPrisma.dailyChallenge.findMany.mockResolvedValue([]);

      await service.getChallengeHistory('user-1', 30);

      expect(mockPrisma.dailyChallenge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 30 }),
      );
    });

    it('returns empty array when user has no history', async () => {
      mockPrisma.dailyChallenge.findMany.mockResolvedValue([]);

      const result = await service.getChallengeHistory('user-1');

      expect(result).toEqual([]);
    });
  });
});
