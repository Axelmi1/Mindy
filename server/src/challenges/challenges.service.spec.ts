import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(id: string, username = `user_${id}`) {
  return { id, username, xp: 100, streak: 3, email: `${id}@test.com` };
}

function makeLesson(id: string, title = `Lesson ${id}`) {
  return { id, title, domain: 'CRYPTO', xpReward: 50, difficulty: 'BEGINNER' };
}

function makeChallenge(overrides: Partial<{
  id: string;
  challengerId: string;
  challengedId: string;
  lessonId: string;
  status: string;
  expiresAt: Date;
  challengerXp: number | null;
  challengedXp: number | null;
  message: string | null;
}> = {}) {
  const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
  return {
    id: 'ch-1',
    challengerId: 'u-1',
    challengedId: 'u-2',
    lessonId: 'l-1',
    status: 'PENDING',
    expiresAt: future,
    challengerXp: null,
    challengedXp: null,
    message: null,
    challenger: makeUser('u-1'),
    challenged: makeUser('u-2'),
    lesson: makeLesson('l-1'),
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Mock setup ───────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  lesson: {
    findUnique: jest.fn(),
  },
  lessonChallenge: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
};

const mockAnalytics = {
  track: jest.fn().mockResolvedValue(undefined),
};

const mockNotifications = {
  sendChallengeReceivedNotification: jest.fn().mockResolvedValue(undefined),
  sendChallengeAcceptedNotification: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ChallengesService', () => {
  let service: ChallengesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: PrismaService,      useValue: mockPrisma },
        { provide: AnalyticsService,   useValue: mockAnalytics },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
  });

  // ── createChallenge ─────────────────────────────────────────────────────────

  describe('createChallenge', () => {
    const dto = { challengerId: 'u-1', challengedId: 'u-2', lessonId: 'l-1' };

    it('creates a challenge and returns it', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));
      mockPrisma.lessonChallenge.findFirst.mockResolvedValue(null);
      const created = makeChallenge();
      mockPrisma.lessonChallenge.create.mockResolvedValue(created);

      const result = await service.createChallenge(dto);

      expect(result).toEqual(created);
      expect(mockPrisma.lessonChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            challengerId: 'u-1',
            challengedId: 'u-2',
            lessonId: 'l-1',
            status: 'PENDING',
          }),
        }),
      );
    });

    it('throws NotFoundException when challenger not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));

      await expect(service.createChallenge(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when challenged user not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(null);
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));

      await expect(service.createChallenge(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when lesson not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.createChallenge(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when challenger === challenged', async () => {
      const selfDto = { ...dto, challengedId: 'u-1' };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-1'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));

      await expect(service.createChallenge(selfDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when duplicate pending challenge exists', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));
      mockPrisma.lessonChallenge.findFirst.mockResolvedValue(makeChallenge());

      await expect(service.createChallenge(dto)).rejects.toThrow(BadRequestException);
    });

    it('tracks analytics event after creating challenge', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));
      mockPrisma.lessonChallenge.findFirst.mockResolvedValue(null);
      mockPrisma.lessonChallenge.create.mockResolvedValue(makeChallenge());

      await service.createChallenge(dto);

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'u-1',
        'CHALLENGE_SENT',
        expect.objectContaining({ lessonId: 'l-1' }),
      );
    });

    it('sends push notification to challenged user (fire-and-forget)', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));
      mockPrisma.lessonChallenge.findFirst.mockResolvedValue(null);
      mockPrisma.lessonChallenge.create.mockResolvedValue(makeChallenge());

      await service.createChallenge(dto);
      // Notification is fire-and-forget; give micro-task queue time to flush
      await Promise.resolve();

      expect(mockNotifications.sendChallengeReceivedNotification).toHaveBeenCalledWith(
        'u-2',
        'user_u-1',
        'Lesson l-1',
        'ch-1',
      );
    });

    it('includes optional message in the challenge', async () => {
      const dtoWithMsg = { ...dto, message: 'Come at me!' };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(makeUser('u-1'))
        .mockResolvedValueOnce(makeUser('u-2'));
      mockPrisma.lesson.findUnique.mockResolvedValue(makeLesson('l-1'));
      mockPrisma.lessonChallenge.findFirst.mockResolvedValue(null);
      mockPrisma.lessonChallenge.create.mockResolvedValue(makeChallenge({ message: 'Come at me!' }));

      await service.createChallenge(dtoWithMsg);

      expect(mockPrisma.lessonChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ message: 'Come at me!' }),
        }),
      );
    });
  });

  // ── getChallengesForUser ────────────────────────────────────────────────────

  describe('getChallengesForUser', () => {
    it('returns received and sent challenges', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-1'));
      mockPrisma.lessonChallenge.updateMany.mockResolvedValue({ count: 0 });
      const received = [makeChallenge({ challengedId: 'u-1' })];
      const sent = [makeChallenge({ challengerId: 'u-1', challengedId: 'u-3' })];
      mockPrisma.lessonChallenge.findMany
        .mockResolvedValueOnce(received)
        .mockResolvedValueOnce(sent);

      const result = await service.getChallengesForUser('u-1');

      expect(result.received).toHaveLength(1);
      expect(result.sent).toHaveLength(1);
    });

    it('throws NotFoundException for unknown user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getChallengesForUser('unknown')).rejects.toThrow(NotFoundException);
    });

    it('auto-expires stale PENDING challenges', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-1'));
      mockPrisma.lessonChallenge.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.lessonChallenge.findMany.mockResolvedValue([]);

      await service.getChallengesForUser('u-1');

      expect(mockPrisma.lessonChallenge.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'EXPIRED' } }),
      );
    });
  });

  // ── respondToChallenge ──────────────────────────────────────────────────────

  describe('respondToChallenge', () => {
    it('accepts a pending challenge', async () => {
      const ch = makeChallenge();
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);
      const updated = { ...ch, status: 'ACCEPTED' };
      mockPrisma.lessonChallenge.update.mockResolvedValue(updated);
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-2'));

      const result = await service.respondToChallenge('ch-1', 'u-2', { status: 'ACCEPTED' });

      expect(result.status).toBe('ACCEPTED');
      expect(mockPrisma.lessonChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACCEPTED' } }),
      );
    });

    it('declines a pending challenge', async () => {
      const ch = makeChallenge();
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);
      const updated = { ...ch, status: 'DECLINED' };
      mockPrisma.lessonChallenge.update.mockResolvedValue(updated);

      const result = await service.respondToChallenge('ch-1', 'u-2', { status: 'DECLINED' });

      expect(result.status).toBe('DECLINED');
    });

    it('throws NotFoundException for unknown challenge', async () => {
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.respondToChallenge('bad-id', 'u-2', { status: 'ACCEPTED' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not the challenged party', async () => {
      const ch = makeChallenge({ challengedId: 'u-2' });
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);

      await expect(
        service.respondToChallenge('ch-1', 'u-999', { status: 'ACCEPTED' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when challenge is already ACCEPTED', async () => {
      const ch = makeChallenge({ status: 'ACCEPTED' });
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);

      await expect(
        service.respondToChallenge('ch-1', 'u-2', { status: 'ACCEPTED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when challenge has expired', async () => {
      const past = new Date(Date.now() - 1000);
      const ch = makeChallenge({ expiresAt: past });
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);

      await expect(
        service.respondToChallenge('ch-1', 'u-2', { status: 'ACCEPTED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('tracks analytics on ACCEPTED response', async () => {
      const ch = makeChallenge();
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);
      mockPrisma.lessonChallenge.update.mockResolvedValue({ ...ch, status: 'ACCEPTED' });
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-2'));

      await service.respondToChallenge('ch-1', 'u-2', { status: 'ACCEPTED' });

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'u-2',
        'CHALLENGE_ACCEPTED',
        expect.objectContaining({ challengeId: 'ch-1' }),
      );
    });

    it('does NOT track analytics on DECLINED response', async () => {
      const ch = makeChallenge();
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);
      mockPrisma.lessonChallenge.update.mockResolvedValue({ ...ch, status: 'DECLINED' });

      await service.respondToChallenge('ch-1', 'u-2', { status: 'DECLINED' });

      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });
  });

  // ── getPendingCount ─────────────────────────────────────────────────────────

  describe('getPendingCount', () => {
    it('returns the count of pending received challenges', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-2'));
      mockPrisma.lessonChallenge.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.lessonChallenge.count.mockResolvedValue(3);

      const result = await service.getPendingCount('u-2');

      expect(result).toEqual({ pendingCount: 3 });
    });

    it('returns 0 when no pending challenges', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-2'));
      mockPrisma.lessonChallenge.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.lessonChallenge.count.mockResolvedValue(0);

      const result = await service.getPendingCount('u-2');

      expect(result).toEqual({ pendingCount: 0 });
    });

    it('throws NotFoundException for unknown user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getPendingCount('ghost')).rejects.toThrow(NotFoundException);
    });

    it('auto-expires stale PENDING before counting', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-2'));
      mockPrisma.lessonChallenge.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.lessonChallenge.count.mockResolvedValue(0);

      await service.getPendingCount('u-2');

      expect(mockPrisma.lessonChallenge.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            challengedId: 'u-2',
            status: 'PENDING',
            expiresAt: expect.objectContaining({ lt: expect.any(Date) }),
          }),
          data: { status: 'EXPIRED' },
        }),
      );
    });

    it('queries count with correct filters (challengedId + PENDING)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser('u-2'));
      mockPrisma.lessonChallenge.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.lessonChallenge.count.mockResolvedValue(5);

      await service.getPendingCount('u-2');

      expect(mockPrisma.lessonChallenge.count).toHaveBeenCalledWith({
        where: { challengedId: 'u-2', status: 'PENDING' },
      });
    });
  });

  // ── recordCompletion ────────────────────────────────────────────────────────

  describe('recordCompletion', () => {
    it('records challenger XP and marks COMPLETED when both are done', async () => {
      const ch = makeChallenge({ status: 'ACCEPTED', challengerXp: null, challengedXp: 80 });
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);

      const afterFirst = { ...ch, challengerXp: 90 };
      const afterComplete = { ...afterFirst, challengedXp: 80, status: 'COMPLETED' };
      mockPrisma.lessonChallenge.update
        .mockResolvedValueOnce(afterFirst)
        .mockResolvedValueOnce(afterComplete);

      const result = await service.recordCompletion('ch-1', { userId: 'u-1', xpEarned: 90 });

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.lessonChallenge.update).toHaveBeenCalledTimes(2);
    });

    it('does not mark COMPLETED if only one participant has finished', async () => {
      const ch = makeChallenge({ status: 'ACCEPTED', challengerXp: null, challengedXp: null });
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);

      // After updating challengerXp, challengedXp is still null → not COMPLETED yet
      const afterFirst = { ...ch, challengerXp: 90, challengedXp: null };
      mockPrisma.lessonChallenge.update.mockResolvedValueOnce(afterFirst);

      const result = await service.recordCompletion('ch-1', { userId: 'u-1', xpEarned: 90 });

      // Status remains ACCEPTED (not PENDING, not COMPLETED) while waiting for the other player
      expect(result.status).toBe('ACCEPTED');
      // Only one update call — the second (mark COMPLETED) should NOT happen
      expect(mockPrisma.lessonChallenge.update).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException for unknown challenge', async () => {
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.recordCompletion('bad-id', { userId: 'u-1', xpEarned: 50 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if challenge is not ACCEPTED', async () => {
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(makeChallenge({ status: 'PENDING' }));

      await expect(
        service.recordCompletion('ch-1', { userId: 'u-1', xpEarned: 50 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if user is not a participant', async () => {
      const ch = makeChallenge({ status: 'ACCEPTED' });
      mockPrisma.lessonChallenge.findUnique.mockResolvedValue(ch);

      await expect(
        service.recordCompletion('ch-1', { userId: 'u-999', xpEarned: 50 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
