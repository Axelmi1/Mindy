import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

const mockPrisma = {
  analyticsEvent: { count: jest.fn(), findMany: jest.fn() },
  dailyChallenge: { findUnique: jest.fn() },
  dailyQuestClaim: { findMany: jest.fn(), create: jest.fn() },
};

const mockUsersService = {
  addXp: jest.fn(),
};

function setupMocks({
  lessonsToday = 0,
  xpEventsToday = [] as number[],
  dailyChallengeDone = false,
  claimedKeys = [] as string[],
} = {}) {
  mockPrisma.analyticsEvent.count.mockResolvedValue(lessonsToday);
  mockPrisma.analyticsEvent.findMany.mockResolvedValue(
    xpEventsToday.map((amount) => ({ eventData: { amount } })),
  );
  mockPrisma.dailyChallenge.findUnique.mockResolvedValue(
    dailyChallengeDone ? { isCompleted: true } : null,
  );
  mockPrisma.dailyQuestClaim.findMany.mockResolvedValue(
    claimedKeys.map((questKey) => ({ questKey })),
  );
  mockPrisma.dailyQuestClaim.create.mockResolvedValue({ id: 'claim-1' });
  mockUsersService.addXp.mockResolvedValue({ xp: 500, level: 3 });
}

describe('QuestsService', () => {
  let service: QuestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get(QuestsService);
    jest.clearAllMocks();
  });

  describe('getTodayQuests', () => {
    it('returns the 3 quests with zero progress on a fresh day', async () => {
      setupMocks();

      const quests = await service.getTodayQuests('user-1');

      expect(quests).toHaveLength(3);
      expect(quests.map((q) => q.key)).toEqual(['lessons_2', 'xp_50', 'daily_challenge']);
      for (const quest of quests) {
        expect(quest.progress).toBe(0);
        expect(quest.isCompleted).toBe(false);
        expect(quest.claimed).toBe(false);
      }
    });

    it('computes lesson progress from LESSON_COMPLETED events', async () => {
      setupMocks({ lessonsToday: 1 });

      const quests = await service.getTodayQuests('user-1');
      const lessons = quests.find((q) => q.key === 'lessons_2')!;

      expect(lessons.progress).toBe(1);
      expect(lessons.isCompleted).toBe(false);
    });

    it('caps progress at target and marks quest completed', async () => {
      setupMocks({ lessonsToday: 5, xpEventsToday: [60, 40] });

      const quests = await service.getTodayQuests('user-1');
      const lessons = quests.find((q) => q.key === 'lessons_2')!;
      const xp = quests.find((q) => q.key === 'xp_50')!;

      expect(lessons.progress).toBe(2);
      expect(lessons.isCompleted).toBe(true);
      expect(xp.progress).toBe(50);
      expect(xp.isCompleted).toBe(true);
    });

    it('ignores XP events with malformed eventData', async () => {
      setupMocks();
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        { eventData: { amount: 30 } },
        { eventData: null },
        { eventData: { amount: 'oops' } },
      ]);

      const quests = await service.getTodayQuests('user-1');
      const xp = quests.find((q) => q.key === 'xp_50')!;

      expect(xp.progress).toBe(30);
    });

    it('marks the daily challenge quest from the DailyChallenge table', async () => {
      setupMocks({ dailyChallengeDone: true });

      const quests = await service.getTodayQuests('user-1');
      const challenge = quests.find((q) => q.key === 'daily_challenge')!;

      expect(challenge.isCompleted).toBe(true);
    });

    it('reflects already-claimed quests', async () => {
      setupMocks({ dailyChallengeDone: true, claimedKeys: ['daily_challenge'] });

      const quests = await service.getTodayQuests('user-1');
      const challenge = quests.find((q) => q.key === 'daily_challenge')!;

      expect(challenge.claimed).toBe(true);
    });
  });

  describe('claim', () => {
    it('awards XP for a completed unclaimed quest', async () => {
      setupMocks({ dailyChallengeDone: true });

      const result = await service.claim('user-1', 'daily_challenge');

      expect(mockPrisma.dailyQuestClaim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 'user-1', questKey: 'daily_challenge' }),
      });
      expect(mockUsersService.addXp).toHaveBeenCalledWith('user-1', 20);
      expect(result.xpAwarded).toBe(20);
      expect(result.quest.claimed).toBe(true);
    });

    it('rejects an unknown quest key', async () => {
      setupMocks();

      await expect(service.claim('user-1', 'nope')).rejects.toThrow(NotFoundException);
      expect(mockUsersService.addXp).not.toHaveBeenCalled();
    });

    it('rejects an incomplete quest', async () => {
      setupMocks({ lessonsToday: 1 });

      await expect(service.claim('user-1', 'lessons_2')).rejects.toThrow(BadRequestException);
      expect(mockUsersService.addXp).not.toHaveBeenCalled();
    });

    it('rejects a double claim', async () => {
      setupMocks({ dailyChallengeDone: true, claimedKeys: ['daily_challenge'] });

      await expect(service.claim('user-1', 'daily_challenge')).rejects.toThrow(ConflictException);
      expect(mockUsersService.addXp).not.toHaveBeenCalled();
    });

    it('maps a P2002 race on the unique constraint to ConflictException', async () => {
      setupMocks({ dailyChallengeDone: true });
      mockPrisma.dailyQuestClaim.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.claim('user-1', 'daily_challenge')).rejects.toThrow(ConflictException);
      expect(mockUsersService.addXp).not.toHaveBeenCalled();
    });
  });
});
