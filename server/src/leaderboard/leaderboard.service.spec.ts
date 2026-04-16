/**
 * leaderboard.service.spec.ts
 *
 * Unit tests for LeaderboardService.
 * Covers:
 *   - getWeeklyLeaderboard (multiple scenarios, rankDelta computation, user position)
 *   - getUserWeeklyStats
 *   - recordXp (upsert behaviour)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a Sunday-start UTC date N weeks ago */
function weekStartNWeeksAgo(n: number): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const thisSunday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day),
  );
  const result = new Date(thisSunday);
  result.setUTCDate(result.getUTCDate() - n * 7);
  return result;
}

function makeWeeklyEntry(userId: string, username: string, xp: number, totalXp: number) {
  return {
    userId,
    xpEarned: xp,
    user: { id: userId, username, xp: totalXp },
  };
}

// ── Mock factory ─────────────────────────────────────────────────────────────

const mockPrisma = {
  weeklyXp: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  },
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  // ── getWeeklyLeaderboard ─────────────────────────────────────────────────

  describe('getWeeklyLeaderboard', () => {
    it('returns empty leaderboard when no entries exist', async () => {
      mockPrisma.weeklyXp.findMany.mockResolvedValue([]);
      mockPrisma.weeklyXp.findUnique.mockResolvedValue(null);

      const result = await service.getWeeklyLeaderboard('user_1');

      expect(result.leaderboard).toHaveLength(0);
      expect(result.userPosition).toBeNull();
      expect(result.weekStart).toBeInstanceOf(Date);
      expect(result.weekEnd).toBeInstanceOf(Date);
    });

    it('returns leaderboard with correct rank ordering', async () => {
      const entries = [
        makeWeeklyEntry('u1', 'alice', 300, 1500),
        makeWeeklyEntry('u2', 'bob',   200, 800),
        makeWeeklyEntry('u3', 'carl',  100, 400),
      ];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)     // top entries
        .mockResolvedValueOnce([])          // last week entries for delta
        .mockResolvedValueOnce([]);         // all last week for rank map

      const result = await service.getWeeklyLeaderboard('u1');

      expect(result.leaderboard).toHaveLength(3);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard[0].username).toBe('alice');
      expect(result.leaderboard[1].rank).toBe(2);
      expect(result.leaderboard[2].rank).toBe(3);
    });

    it('marks current user isCurrentUser = true', async () => {
      const entries = [
        makeWeeklyEntry('u1', 'alice', 300, 1500),
        makeWeeklyEntry('u2', 'bob',   200, 800),
      ];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getWeeklyLeaderboard('u1');
      const me = result.leaderboard.find((e) => e.userId === 'u1');
      expect(me?.isCurrentUser).toBe(true);
      const other = result.leaderboard.find((e) => e.userId === 'u2');
      expect(other?.isCurrentUser).toBe(false);
    });

    it('computes rankDelta = null for new entrants (not in last week)', async () => {
      const entries = [makeWeeklyEntry('u1', 'alice', 200, 1000)];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([])   // last week entries for top users
        .mockResolvedValueOnce([]);  // all last week entries (empty → new)

      const result = await service.getWeeklyLeaderboard('u1');
      expect(result.leaderboard[0].rankDelta).toBeNull();
    });

    it('computes rankDelta positive when user moved up', async () => {
      // This week: u1 rank 1, u2 rank 2
      const thisWeekEntries = [
        makeWeeklyEntry('u1', 'alice', 300, 1500),
        makeWeeklyEntry('u2', 'bob',   200, 800),
      ];

      // Last week: u2 was rank 1, u1 was rank 2
      const lastWeekAllEntries = [
        { userId: 'u2', xpEarned: 250 }, // rank 1 last week
        { userId: 'u1', xpEarned: 150 }, // rank 2 last week
      ];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(thisWeekEntries)
        .mockResolvedValueOnce([{ userId: 'u1', xpEarned: 150 }, { userId: 'u2', xpEarned: 250 }])
        .mockResolvedValueOnce(lastWeekAllEntries);

      const result = await service.getWeeklyLeaderboard('u1');
      const alice = result.leaderboard.find((e) => e.userId === 'u1');
      // alice was rank 2 last week, now rank 1 → rankDelta = 2 - 1 = +1
      expect(alice?.rankDelta).toBe(1);
    });

    it('computes rankDelta negative when user moved down', async () => {
      const thisWeekEntries = [
        makeWeeklyEntry('u2', 'bob',   300, 1500),
        makeWeeklyEntry('u1', 'alice', 200, 800),
      ];

      const lastWeekAllEntries = [
        { userId: 'u1', xpEarned: 350 }, // rank 1 last week
        { userId: 'u2', xpEarned: 100 }, // rank 2 last week
      ];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(thisWeekEntries)
        .mockResolvedValueOnce([{ userId: 'u1', xpEarned: 350 }, { userId: 'u2', xpEarned: 100 }])
        .mockResolvedValueOnce(lastWeekAllEntries);

      const result = await service.getWeeklyLeaderboard('u1');
      const alice = result.leaderboard.find((e) => e.userId === 'u1');
      // alice was rank 1 last week, now rank 2 → rankDelta = 1 - 2 = -1
      expect(alice?.rankDelta).toBe(-1);
    });

    it('computes xpDelta correctly vs last week', async () => {
      const entries = [makeWeeklyEntry('u1', 'alice', 300, 1500)];
      const lastWeekEntries = [{ userId: 'u1', xpEarned: 200 }];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce(lastWeekEntries)
        .mockResolvedValueOnce(lastWeekEntries);

      const result = await service.getWeeklyLeaderboard('u1');
      expect(result.leaderboard[0].xpDelta).toBe(100); // 300 - 200
      expect(result.leaderboard[0].lastWeekXp).toBe(200);
    });

    it('returns userPosition when user is outside top entries', async () => {
      // Top entries don't include u99
      const topEntries = [
        makeWeeklyEntry('u1', 'alice', 500, 3000),
        makeWeeklyEntry('u2', 'bob',   400, 2000),
      ];

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(topEntries)
        .mockResolvedValueOnce([])  // last week for top users
        .mockResolvedValueOnce([]); // all last week

      // User u99 entry
      mockPrisma.weeklyXp.findUnique.mockResolvedValueOnce({
        userId: 'u99',
        xpEarned: 50,
        user: { username: 'newbie', xp: 150 },
      });
      // Count users above
      mockPrisma.weeklyXp.count.mockResolvedValueOnce(2);
      // Last week XP for u99
      mockPrisma.weeklyXp.findUnique.mockResolvedValueOnce(null);

      const result = await service.getWeeklyLeaderboard('u99');

      expect(result.leaderboard.find((e) => e.userId === 'u99')).toBeUndefined();
      expect(result.userPosition).not.toBeNull();
      expect(result.userPosition?.rank).toBe(3);
      expect(result.userPosition?.isCurrentUser).toBe(true);
    });

    it('respects the limit parameter', async () => {
      const entries = Array.from({ length: 3 }, (_, i) =>
        makeWeeklyEntry(`u${i}`, `user${i}`, 300 - i * 50, 1000 - i * 100),
      );

      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getWeeklyLeaderboard('u0', 3);
      expect(result.leaderboard).toHaveLength(3);
    });

    it('returns correct weekStart and weekEnd (weekEnd = weekStart + 7 days)', async () => {
      mockPrisma.weeklyXp.findMany.mockResolvedValue([]);
      mockPrisma.weeklyXp.findUnique.mockResolvedValue(null);

      const result = await service.getWeeklyLeaderboard('u1');
      const diff =
        (result.weekEnd.getTime() - result.weekStart.getTime()) / (1000 * 60 * 60 * 24);
      expect(diff).toBe(7);
    });

    it('handles single-entry leaderboard correctly', async () => {
      const entries = [makeWeeklyEntry('u1', 'solo', 100, 500)];
      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getWeeklyLeaderboard('u1');
      expect(result.leaderboard).toHaveLength(1);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.userPosition).toEqual(result.leaderboard[0]);
    });

    it('includes totalXp for league badge computation', async () => {
      const entries = [makeWeeklyEntry('u1', 'alice', 200, 2500)]; // Gold league
      mockPrisma.weeklyXp.findMany
        .mockResolvedValueOnce(entries)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getWeeklyLeaderboard('u1');
      expect(result.leaderboard[0].totalXp).toBe(2500);
    });
  });

  // ── getUserWeeklyStats ───────────────────────────────────────────────────

  describe('getUserWeeklyStats', () => {
    it('returns null rank when user has no XP this week', async () => {
      mockPrisma.weeklyXp.findUnique.mockResolvedValue(null);
      mockPrisma.weeklyXp.count.mockResolvedValue(5);

      const result = await service.getUserWeeklyStats('u_no_xp');

      expect(result.xpThisWeek).toBe(0);
      expect(result.rank).toBeNull();
      expect(result.totalParticipants).toBe(5);
    });

    it('returns correct rank when user has XP', async () => {
      mockPrisma.weeklyXp.findUnique.mockResolvedValue({ xpEarned: 200 });
      mockPrisma.weeklyXp.count
        .mockResolvedValueOnce(10) // totalUsers
        .mockResolvedValueOnce(2); // usersAbove

      const result = await service.getUserWeeklyStats('u1');

      expect(result.xpThisWeek).toBe(200);
      expect(result.rank).toBe(3); // 2 users above → rank 3
      expect(result.totalParticipants).toBe(10);
    });

    it('returns rank 1 when no one is above', async () => {
      mockPrisma.weeklyXp.findUnique.mockResolvedValue({ xpEarned: 500 });
      mockPrisma.weeklyXp.count
        .mockResolvedValueOnce(7)  // totalUsers
        .mockResolvedValueOnce(0); // usersAbove

      const result = await service.getUserWeeklyStats('u1');
      expect(result.rank).toBe(1);
    });

    it('returns 0 totalParticipants when leaderboard is empty', async () => {
      mockPrisma.weeklyXp.findUnique.mockResolvedValue(null);
      mockPrisma.weeklyXp.count.mockResolvedValue(0);

      const result = await service.getUserWeeklyStats('u1');
      expect(result.totalParticipants).toBe(0);
    });

    it('returns weekStart as a valid Date', async () => {
      mockPrisma.weeklyXp.findUnique.mockResolvedValue(null);
      mockPrisma.weeklyXp.count.mockResolvedValue(0);

      const result = await service.getUserWeeklyStats('u1');
      expect(result.weekStart).toBeInstanceOf(Date);
    });

    it('returns timeUntilReset as a positive number', async () => {
      mockPrisma.weeklyXp.findUnique.mockResolvedValue(null);
      mockPrisma.weeklyXp.count.mockResolvedValue(0);

      const result = await service.getUserWeeklyStats('u1');
      expect(result.timeUntilReset).toBeGreaterThan(0);
    });
  });

  // ── recordXp ────────────────────────────────────────────────────────────

  describe('recordXp', () => {
    it('upserts with correct userId and xpAmount increment', async () => {
      const upsertResult = { userId: 'u1', xpEarned: 50 };
      mockPrisma.weeklyXp.upsert.mockResolvedValue(upsertResult);

      const result = await service.recordXp('u1', 50);

      expect(mockPrisma.weeklyXp.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.weeklyXp.upsert.mock.calls[0][0];
      expect(call.where.userId_weekStart.userId).toBe('u1');
      expect(call.update).toEqual({ xpEarned: { increment: 50 } });
      expect(call.create.xpEarned).toBe(50);
      expect(result).toEqual(upsertResult);
    });

    it('creates entry with correct weekStart (Sunday UTC)', async () => {
      mockPrisma.weeklyXp.upsert.mockResolvedValue({});

      await service.recordXp('u1', 100);

      const call = mockPrisma.weeklyXp.upsert.mock.calls[0][0];
      const weekStart: Date = call.where.userId_weekStart.weekStart;

      // weekStart should be a Sunday (UTC day 0)
      expect(weekStart.getUTCDay()).toBe(0);
      // weekStart time should be midnight UTC
      expect(weekStart.getUTCHours()).toBe(0);
      expect(weekStart.getUTCMinutes()).toBe(0);
    });

    it('handles xpAmount = 0 (no-op increment)', async () => {
      mockPrisma.weeklyXp.upsert.mockResolvedValue({ userId: 'u1', xpEarned: 0 });

      await service.recordXp('u1', 0);

      const call = mockPrisma.weeklyXp.upsert.mock.calls[0][0];
      expect(call.update).toEqual({ xpEarned: { increment: 0 } });
    });

    it('handles large xpAmount', async () => {
      mockPrisma.weeklyXp.upsert.mockResolvedValue({ userId: 'u1', xpEarned: 999999 });

      await service.recordXp('u1', 999999);

      const call = mockPrisma.weeklyXp.upsert.mock.calls[0][0];
      expect(call.create.xpEarned).toBe(999999);
    });
  });
});
