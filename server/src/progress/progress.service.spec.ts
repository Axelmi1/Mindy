import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeProgress = (overrides: Partial<{
  id: string;
  userId: string;
  lessonId: string;
  completedSteps: number[];
  isCompleted: boolean;
  lesson: { id: string; title: string; domain: string; xpReward: number; content: any };
}> = {}) => ({
  id: 'prog_001',
  userId: 'user_abc',
  lessonId: 'lesson_001',
  completedSteps: [],
  isCompleted: false,
  lesson: {
    id: 'lesson_001',
    title: 'Introduction au Bitcoin',
    domain: 'CRYPTO',
    xpReward: 50,
    content: { steps: [{ type: 'INFO' }, { type: 'QUIZ' }, { type: 'QUIZ' }] },
  },
  ...overrides,
});

const makeLesson = (overrides: Partial<{
  id: string;
  title: string;
  domain: string;
  xpReward: number;
  content: any;
}> = {}) => ({
  id: 'lesson_001',
  title: 'Introduction au Bitcoin',
  domain: 'CRYPTO',
  xpReward: 50,
  content: { steps: [{ type: 'INFO' }, { type: 'QUIZ' }, { type: 'QUIZ' }] },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPrisma = {
  userProgress: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  analyticsEvent: {
    count: jest.fn().mockResolvedValue(0),
  },
};

const mockUsers = {
  findById: jest.fn().mockResolvedValue({ id: 'user_abc', username: 'testuser' }),
  addXp: jest.fn().mockResolvedValue(undefined),
  updateStreak: jest.fn().mockResolvedValue(undefined),
};

const mockLessons = {
  findById: jest.fn().mockResolvedValue(makeLesson()),
  getStepCount: jest.fn().mockReturnValue(3), // 3 steps in default lesson
};

const mockLeaderboard = {
  recordXp: jest.fn().mockResolvedValue(undefined),
};

const mockAnalytics = {
  track: jest.fn().mockResolvedValue(undefined),
};

const mockAchievementChecker = {
  checkAndUnlock: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsers },
        { provide: LessonsService, useValue: mockLessons },
        { provide: LeaderboardService, useValue: mockLeaderboard },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: AchievementCheckerService, useValue: mockAchievementChecker },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create progress for a valid user and lesson', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(null);
      const created = makeProgress();
      mockPrisma.userProgress.create.mockResolvedValue(created);

      const result = await service.create({ userId: 'user_abc', lessonId: 'lesson_001' });

      expect(mockPrisma.userProgress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_abc',
          lessonId: 'lesson_001',
          completedSteps: [],
          isCompleted: false,
        }),
      });
      expect(result).toEqual(created);
    });

    it('should throw ConflictException when progress already exists', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(makeProgress());

      await expect(
        service.create({ userId: 'user_abc', lessonId: 'lesson_001' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should track LESSON_STARTED analytics event', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(null);
      mockPrisma.userProgress.create.mockResolvedValue(makeProgress());

      await service.create({ userId: 'user_abc', lessonId: 'lesson_001' });

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'user_abc',
        'LESSON_STARTED',
        expect.objectContaining({ lessonId: 'lesson_001' }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUsers.findById.mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(
        service.create({ userId: 'bad_user', lessonId: 'lesson_001' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('should return progress with lesson details', async () => {
      const prog = makeProgress();
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);

      const result = await service.findById('prog_001');

      expect(result).toEqual(prog);
    });

    it('should throw NotFoundException when progress not found', async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // completeStep
  // -------------------------------------------------------------------------
  describe('completeStep', () => {
    it('should add step to completedSteps array', async () => {
      const prog = makeProgress({ completedSteps: [] });
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      mockPrisma.userProgress.update.mockResolvedValue({
        ...prog,
        completedSteps: [0],
        isCompleted: false,
      });

      const result = await service.completeStep('prog_001', 0);

      expect(mockPrisma.userProgress.update).toHaveBeenCalledWith({
        where: { id: 'prog_001' },
        data: expect.objectContaining({
          completedSteps: [0],
          isCompleted: false,
        }),
      });
      expect(result.justCompleted).toBe(false);
    });

    it('should mark lesson as completed when all steps are done', async () => {
      // 3-step lesson, steps 0 and 1 already done
      const prog = makeProgress({ completedSteps: [0, 1], isCompleted: false });
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      mockPrisma.userProgress.update.mockResolvedValue({
        ...prog,
        completedSteps: [0, 1, 2],
        isCompleted: true,
      });

      const result = await service.completeStep('prog_001', 2);

      const updateCall = mockPrisma.userProgress.update.mock.calls[0][0];
      expect(updateCall.data.isCompleted).toBe(true);
      expect(result.justCompleted).toBe(true);
    });

    it('should award XP and update streak on lesson completion', async () => {
      const prog = makeProgress({ completedSteps: [0, 1], isCompleted: false });
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      mockPrisma.userProgress.update.mockResolvedValue({
        ...prog,
        completedSteps: [0, 1, 2],
        isCompleted: true,
      });

      await service.completeStep('prog_001', 2);

      expect(mockUsers.addXp).toHaveBeenCalledWith('user_abc', 50); // xpReward
      expect(mockUsers.updateStreak).toHaveBeenCalledWith('user_abc');
      expect(mockLeaderboard.recordXp).toHaveBeenCalledWith('user_abc', 50);
    });

    it('should NOT award XP if lesson was already completed', async () => {
      // Progress already marked as completed
      const prog = makeProgress({ completedSteps: [0, 1, 2], isCompleted: true });
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      mockPrisma.userProgress.update.mockResolvedValue(prog);

      await service.completeStep('prog_001', 2);

      expect(mockUsers.addXp).not.toHaveBeenCalled();
      expect(mockLeaderboard.recordXp).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid step index', async () => {
      const prog = makeProgress({ completedSteps: [] });
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      // getStepCount returns 3, so index 5 is invalid

      await expect(service.completeStep('prog_001', 5)).rejects.toThrow(NotFoundException);
    });

    it('should deduplicate steps (idempotent re-submission)', async () => {
      const prog = makeProgress({ completedSteps: [0] }); // Step 0 already done
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      mockPrisma.userProgress.update.mockResolvedValue({ ...prog, completedSteps: [0] });

      await service.completeStep('prog_001', 0); // Submit step 0 again

      const updateCall = mockPrisma.userProgress.update.mock.calls[0][0];
      // completedSteps should still be [0], not [0, 0]
      expect(updateCall.data.completedSteps).toEqual([0]);
    });
  });

  // -------------------------------------------------------------------------
  // findByUserId
  // -------------------------------------------------------------------------
  describe('findByUserId', () => {
    it('should verify user exists before fetching progress', async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([makeProgress()]);

      await service.findByUserId('user_abc');

      expect(mockUsers.findById).toHaveBeenCalledWith('user_abc');
    });

    it('should return empty array when user has no progress', async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([]);

      const result = await service.findByUserId('user_abc');

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // resetProgress
  // -------------------------------------------------------------------------
  describe('resetProgress', () => {
    it('should reset steps and completion status', async () => {
      const prog = makeProgress({ completedSteps: [0, 1, 2], isCompleted: true });
      mockPrisma.userProgress.findUnique.mockResolvedValue(prog);
      mockPrisma.userProgress.update.mockResolvedValue({
        ...prog,
        completedSteps: [],
        isCompleted: false,
      });

      const result = await service.resetProgress('prog_001');

      expect(mockPrisma.userProgress.update).toHaveBeenCalledWith({
        where: { id: 'prog_001' },
        data: {
          completedSteps: [],
          isCompleted: false,
        },
      });
      expect(result.isCompleted).toBe(false);
      expect(result.completedSteps).toEqual([]);
    });
  });
});
