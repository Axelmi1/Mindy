import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementCheckerService } from '../achievements/achievement-checker.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<ReturnType<typeof baseUser>> = {}) {
  return { ...baseUser(), ...overrides };
}

function baseUser() {
  return {
    id: 'user-1',
    email: 'axel@mindy.app',
    username: 'axel',
    xp: 500,
    level: 3,
    streak: 5,
    maxStreak: 10,
    streakFreezes: 2,
    soundEnabled: true,
    lastActiveAt: new Date('2026-03-04T10:00:00Z'),
    preferredDomain: 'CRYPTO',
    userGoal: 'invest',
    referralCode: 'ABC123',
    streakFreezeUsedAt: null as Date | null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-03-04'),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userProgress: {
      count: jest.fn(),
    },
    userAchievement: {
      count: jest.fn(),
    },
    lesson: {
      count: jest.fn(),
    },
    analyticsEvent: {
      findMany: jest.fn(),
    },
  };

  const mockNotifications = { sendLevelUpNotification: jest.fn(), sendStreakMilestoneNotification: jest.fn() };
  const mockAnalytics = { track: jest.fn() };
  const mockAchievements = { checkAndUnlock: jest.fn() };
  const mockLeaderboard = { recordXp: jest.fn(), getUserWeeklyStats: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: AchievementCheckerService, useValue: mockAchievements },
        { provide: LeaderboardService, useValue: mockLeaderboard },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // create()
  // ────────────────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a user with a 6-char referral code', async () => {
      const user = makeUser();
      mockPrisma.user.create.mockResolvedValue(user);

      const result = await service.create({ email: user.email, username: user.username });

      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      const { data } = mockPrisma.user.create.mock.calls[0][0];
      expect(data.email).toBe(user.email);
      expect(data.username).toBe(user.username);
      expect(typeof data.referralCode).toBe('string');
      expect(data.referralCode).toHaveLength(6);
      expect(result).toEqual(user);
    });

    it('generates unique referral codes (probabilistic)', async () => {
      const codes = new Set<string>();
      // Call private method via reflection 100 times
      for (let i = 0; i < 100; i++) {
        const code = (service as any).generateShortCode();
        expect(code).toMatch(/^[A-Z2-9]{6}$/);
        codes.add(code);
      }
      // Collision probability < 1 in a million for 100 calls
      expect(codes.size).toBeGreaterThan(90);
    });

    it('auto-generates email when missing', async () => {
      const user = makeUser({ username: 'satoshi', email: 'satoshi_1234@mindy.app' });
      mockPrisma.user.create.mockResolvedValue(user);

      await service.create({ username: 'satoshi' });

      const arg = mockPrisma.user.create.mock.calls[0][0];
      expect(arg.data.email).toMatch(/^satoshi_\d+@mindy\.app$/);
    });

    it('uses provided email when present', async () => {
      const user = makeUser({ username: 'alice', email: 'alice@example.com' });
      mockPrisma.user.create.mockResolvedValue(user);

      await service.create({ username: 'alice', email: 'alice@example.com' });

      const arg = mockPrisma.user.create.mock.calls[0][0];
      expect(arg.data.email).toBe('alice@example.com');
    });

    it('persists dailyMinutes and reminderHour', async () => {
      const user = makeUser({ username: 'bob' });
      mockPrisma.user.create.mockResolvedValue(user);

      await service.create({ username: 'bob', dailyMinutes: 10, reminderHour: 20 });

      const arg = mockPrisma.user.create.mock.calls[0][0];
      expect(arg.data.dailyMinutes).toBe(10);
      expect(arg.data.reminderHour).toBe(20);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findById()
  // ────────────────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns a user when found', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');
      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // findByUsername()
  // ────────────────────────────────────────────────────────────────────────────

  describe('findByUsername()', () => {
    it('finds user case-insensitively', async () => {
      const user = makeUser();
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await service.findByUsername('AXEL');
      expect(result).toEqual(user);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: { equals: 'AXEL', mode: 'insensitive' },
        },
      });
    });

    it('returns null when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const result = await service.findByUsername('ghost');
      expect(result).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // update()
  // ────────────────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('persists hasSeenInvitePrompt', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ id: 'u1', hasSeenInvitePrompt: true });

      await service.update('u1', { hasSeenInvitePrompt: true });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({ hasSeenInvitePrompt: true }),
      }));
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // calculateLevel() — private, tested via addXp()
  // ────────────────────────────────────────────────────────────────────────────

  describe('level formula (floor(sqrt(xp/100)) + 1)', () => {
    const cases: [number, number][] = [
      [0, 1],     // floor(sqrt(0)) + 1 = 1
      [99, 1],    // floor(sqrt(0.99)) + 1 = 1
      [100, 2],   // floor(sqrt(1)) + 1 = 2
      [400, 3],   // floor(sqrt(4)) + 1 = 3
      [900, 4],   // floor(sqrt(9)) + 1 = 4
      [9999, 10], // floor(sqrt(99.99)) + 1 = 10
    ];

    it.each(cases)('xp=%d → level=%d', (xp, expectedLevel) => {
      const level = (service as any).calculateLevel(xp);
      expect(level).toBe(expectedLevel);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // addXp()
  // ────────────────────────────────────────────────────────────────────────────

  describe('addXp()', () => {
    it('adds XP and recalculates level', async () => {
      const user = makeUser({ xp: 0, level: 1 });
      const updated = makeUser({ xp: 100, level: 2 });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockNotifications.sendLevelUpNotification.mockResolvedValue(undefined);
      mockAnalytics.track.mockResolvedValue(undefined);
      mockAchievements.checkAndUnlock.mockResolvedValue(undefined);

      const result = await service.addXp('user-1', 100);

      expect(result).toEqual(updated);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { xp: 100, level: 2, lastActiveAt: expect.any(Date) },
      });
    });

    it('sends level-up notification when level increases', async () => {
      const user = makeUser({ xp: 0, level: 1 });
      const updated = makeUser({ xp: 100, level: 2 });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockNotifications.sendLevelUpNotification.mockResolvedValue(undefined);
      mockAnalytics.track.mockResolvedValue(undefined);
      mockAchievements.checkAndUnlock.mockResolvedValue(undefined);

      await service.addXp('user-1', 100);

      expect(mockNotifications.sendLevelUpNotification).toHaveBeenCalledWith('user-1', 2);
      expect(mockAnalytics.track).toHaveBeenCalledWith('user-1', 'LEVEL_UP', {
        previousLevel: 1,
        newLevel: 2,
        xpAwarded: 100,
      });
    });

    it('does NOT send level-up notification when level stays same', async () => {
      const user = makeUser({ xp: 100, level: 2 });
      const updated = makeUser({ xp: 150, level: 2 });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAchievements.checkAndUnlock.mockResolvedValue(undefined);

      await service.addXp('user-1', 50);

      expect(mockNotifications.sendLevelUpNotification).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getStats()
  // ────────────────────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('returns full stats with correct fields', async () => {
      const user = makeUser({ xp: 900, level: 4, streak: 7, maxStreak: 14 });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      // userProgress.count is called 4x: total completed + 3 domain counts
      mockPrisma.userProgress.count.mockResolvedValue(12);
      // lesson.count is called 4x: total + 3 domain counts
      mockPrisma.lesson.count.mockResolvedValue(70);
      mockPrisma.userAchievement.count.mockResolvedValue(3);
      mockLeaderboard.getUserWeeklyStats.mockResolvedValue({ rank: 2, xpThisWeek: 200 });

      const stats = await service.getStats('user-1');

      expect(stats).toMatchObject({
        username: 'axel',
        xp: 900,
        level: 4,
        streak: 7,
        maxStreak: 14,
        achievementsUnlocked: 3,
        referralCode: 'ABC123',
        userRank: 2,
      });
      expect(typeof stats.streakAtRisk).toBe('boolean');
      expect(Array.isArray(stats.domainStats)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateStreak()
  // ────────────────────────────────────────────────────────────────────────────

  describe('updateStreak()', () => {
    it('increments streak on consecutive day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const user = makeUser({ streak: 3, maxStreak: 5, lastActiveAt: yesterday });
      const updated = makeUser({ streak: 4, maxStreak: 5 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);
      mockNotifications.sendStreakMilestoneNotification.mockResolvedValue(undefined);
      mockAchievements.checkAndUnlock.mockResolvedValue(undefined);

      const result = await service.updateStreak('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ streak: 4 }),
        }),
      );
      expect(result).toEqual(updated);
    });

    it('resets streak to 1 after 2+ missed days (no freeze)', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const user = makeUser({ streak: 10, maxStreak: 10, streakFreezes: 0, lastActiveAt: threeDaysAgo });
      const updated = makeUser({ streak: 1, maxStreak: 10 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);
      mockNotifications.sendStreakMilestoneNotification.mockResolvedValue(undefined);
      mockAchievements.checkAndUnlock.mockResolvedValue(undefined);

      await service.updateStreak('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ streak: 1 }),
        }),
      );
    });

    it('uses streak freeze when 1 day is missed and freeze available', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const user = makeUser({
        streak: 5,
        maxStreak: 5,
        streakFreezes: 1,
        lastActiveAt: twoDaysAgo,
        streakFreezeUsedAt: null,
      });
      const updated = makeUser({ streak: 6, streakFreezes: 0 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);
      mockNotifications.sendStreakMilestoneNotification.mockResolvedValue(undefined);
      mockAchievements.checkAndUnlock.mockResolvedValue(undefined);

      await service.updateStreak('user-1');

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.streak).toBe(6);
      expect(updateCall.data.streakFreezes).toEqual({ decrement: 1 });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // isStreakAtRisk()
  // ────────────────────────────────────────────────────────────────────────────

  describe('isStreakAtRisk()', () => {
    it('returns false when lastActiveAt is null', () => {
      expect(service.isStreakAtRisk(null)).toBe(false);
    });

    it('returns false when last active today', () => {
      expect(service.isStreakAtRisk(new Date())).toBe(false);
    });

    it('returns true when last active yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(service.isStreakAtRisk(yesterday)).toBe(true);
    });

    it('returns true when last active 5 days ago', () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      expect(service.isStreakAtRisk(past)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // updateSettings()
  // ────────────────────────────────────────────────────────────────────────────

  describe('updateSettings()', () => {
    it('updates soundEnabled', async () => {
      const user = makeUser();
      const updated = makeUser({ soundEnabled: false });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateSettings('user-1', { soundEnabled: false });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { soundEnabled: false },
      });
      expect(result.soundEnabled).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // buyStreakFreeze()
  // ────────────────────────────────────────────────────────────────────────────

  describe('buyStreakFreeze()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deducts 50 XP and increments streakFreezes on success', async () => {
      const user = makeUser({ xp: 200, streakFreezes: 1 });
      const updated = makeUser({ xp: 150, streakFreezes: 2 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);

      const result = await service.buyStreakFreeze('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          xp: { decrement: 50 },
          streakFreezes: { increment: 1 },
        },
      });
      expect(result.xp).toBe(150);
      expect(result.streakFreezes).toBe(2);
      expect(result.xpSpent).toBe(50);
    });

    it('tracks STREAK_FREEZE_PURCHASED analytics event', async () => {
      const user = makeUser({ xp: 100, streakFreezes: 0 });
      const updated = makeUser({ xp: 50, streakFreezes: 1 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);

      await service.buyStreakFreeze('user-1');

      expect(mockAnalytics.track).toHaveBeenCalledWith(
        'user-1',
        'STREAK_FREEZE_PURCHASED',
        { xpSpent: 50, freezesAfter: 1 },
      );
    });

    it('throws BadRequestException when user already has 3 freezes (max)', async () => {
      const user = makeUser({ xp: 500, streakFreezes: 3 });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.buyStreakFreeze('user-1')).rejects.toThrow(
        'Maximum 3 streak freezes allowed',
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAnalytics.track).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when XP is insufficient (< 50)', async () => {
      const user = makeUser({ xp: 30, streakFreezes: 0 });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.buyStreakFreeze('user-1')).rejects.toThrow(
        'Not enough XP',
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when XP is exactly 49', async () => {
      const user = makeUser({ xp: 49, streakFreezes: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(user);

      await expect(service.buyStreakFreeze('user-1')).rejects.toThrow(
        'Not enough XP',
      );
    });

    it('succeeds when XP is exactly 50 (boundary)', async () => {
      const user = makeUser({ xp: 50, streakFreezes: 0 });
      const updated = makeUser({ xp: 0, streakFreezes: 1 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);

      const result = await service.buyStreakFreeze('user-1');
      expect(result.xp).toBe(0);
      expect(result.streakFreezes).toBe(1);
    });

    it('succeeds when user has exactly 2 freezes (one below max)', async () => {
      const user = makeUser({ xp: 300, streakFreezes: 2 });
      const updated = makeUser({ xp: 250, streakFreezes: 3 });

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updated);
      mockAnalytics.track.mockResolvedValue(undefined);

      const result = await service.buyStreakFreeze('user-1');
      expect(result.streakFreezes).toBe(3);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // getRecentActivity()
  // ────────────────────────────────────────────────────────────────────────────

  describe('getRecentActivity()', () => {
    const baseTs = new Date('2026-03-14T15:00:00Z');

    function makeEvent(
      eventType: string,
      eventData: Record<string, unknown> | null = null,
      ts = baseTs,
    ) {
      return {
        id: `evt-${Math.random().toString(36).slice(2)}`,
        eventType,
        eventData,
        timestamp: ts,
      };
    }

    it('returns empty array when user has no activity', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      const result = await service.getRecentActivity('user-1');
      expect(result).toEqual([]);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getRecentActivity('unknown')).rejects.toThrow(NotFoundException);
    });

    it('returns LESSON_COMPLETED event with formatted label including title and XP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('LESSON_COMPLETED', { lessonTitle: 'Bitcoin Basics', xpEarned: 75 }),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.type).toBe('LESSON_COMPLETED');
      expect(item.label).toContain('Bitcoin Basics');
      expect(item.label).toContain('+75 XP');
      expect(item.icon).toBe('📖');
      expect(item.timestamp).toBe(baseTs.toISOString());
    });

    it('returns LESSON_COMPLETED event with generic label when no title', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('LESSON_COMPLETED', null),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toBe('Leçon terminée');
    });

    it('returns STREAK_UPDATED event with streak count in label', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('STREAK_UPDATED', { streak: 14 }),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toContain('14 jours');
      expect(item.icon).toBe('🔥');
    });

    it('returns STREAK_FREEZE_PURCHASED with correct label and icon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('STREAK_FREEZE_PURCHASED'),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toContain('Streak Freeze');
      expect(item.icon).toBe('❄️');
    });

    it('returns ACHIEVEMENT_UNLOCKED with achievement name in label', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('ACHIEVEMENT_UNLOCKED', { achievementName: 'Crypto Legend' }),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toContain('Crypto Legend');
      expect(item.icon).toBe('🏆');
    });

    it('returns CHALLENGE_SENT with opponent username in label', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('CHALLENGE_SENT', { challengedUsername: 'bob' }),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toContain('bob');
      expect(item.icon).toBe('⚔️');
    });

    it('returns CHALLENGE_ACCEPTED with challenger username in label', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('CHALLENGE_ACCEPTED', { challengerUsername: 'alice' }),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toContain('alice');
      expect(item.icon).toBe('⚔️');
    });

    it('returns CHALLENGE_COMPLETED with correct icon', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('CHALLENGE_COMPLETED'),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.label).toBe('Défi terminé ⚔️');
      expect(item.icon).toBe('⚔️');
    });

    it('returns XP_EARNED event with formatted label', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('XP_EARNED', { xpEarned: 200, source: 'challenge' }),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.type).toBe('XP_EARNED');
      expect(item.icon).toBe('⚡');
    });

    it('respects the limit parameter and passes it to Prisma', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      await service.getRecentActivity('user-1', 5);

      const call = mockPrisma.analyticsEvent.findMany.mock.calls[0][0];
      expect(call.take).toBe(5);
    });

    it('returns multiple events in the correct order', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      const events = [
        makeEvent('LESSON_COMPLETED', { lessonTitle: 'DeFi 101', xpEarned: 50 }, new Date('2026-03-14T16:00:00Z')),
        makeEvent('STREAK_UPDATED', { streak: 7 }, new Date('2026-03-14T15:00:00Z')),
        makeEvent('ACHIEVEMENT_UNLOCKED', { achievementName: 'First Steps' }, new Date('2026-03-14T14:00:00Z')),
      ];
      mockPrisma.analyticsEvent.findMany.mockResolvedValue(events);

      const result = await service.getRecentActivity('user-1', 10);
      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('LESSON_COMPLETED');
      expect(result[1].type).toBe('STREAK_UPDATED');
      expect(result[2].type).toBe('ACHIEVEMENT_UNLOCKED');
    });

    it('includes meta (raw eventData) in each returned item', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      const eventData = { lessonTitle: 'NFTs', xpEarned: 100 };
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('LESSON_COMPLETED', eventData),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.meta).toMatchObject(eventData);
    });

    it('handles null eventData gracefully (no crash)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([
        makeEvent('STREAK_FREEZE_PURCHASED', null),
      ]);

      const [item] = await service.getRecentActivity('user-1');
      expect(item.meta).toBeNull();
      expect(typeof item.label).toBe('string');
    });

    it('uses default limit of 10 when none provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(makeUser());
      mockPrisma.analyticsEvent.findMany.mockResolvedValue([]);

      await service.getRecentActivity('user-1');

      const call = mockPrisma.analyticsEvent.findMany.mock.calls[0][0];
      expect(call.take).toBe(10);
    });
  });
});
