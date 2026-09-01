import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  xpEarned: number;
  xpDelta: number;      // XP delta vs last week (positive = improved, negative = worse)
  lastWeekXp: number;   // XP earned last week
  totalXp: number;      // All-time XP (used for league badge)
  isCurrentUser: boolean;
  /** Rank position change vs last week (positive = moved UP, negative = moved DOWN, null = new entry) */
  rankDelta: number | null;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get weekly leaderboard with current user's position
   */
  async getWeeklyLeaderboard(userId: string, limit = 10): Promise<{
    leaderboard: LeaderboardEntry[];
    userPosition: LeaderboardEntry | null;
    weekStart: Date;
    weekEnd: Date;
  }> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get top entries for this week (include user totalXp for league badge)
    const topEntries = await this.prisma.weeklyXp.findMany({
      where: { weekStart },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            xp: true,
          },
        },
      },
      orderBy: { xpEarned: 'desc' },
      take: limit,
    });

    // Repli : si personne n'a gagné d'XP cette semaine, on affiche le classement
    // général (XP total) pour ne jamais présenter un classement vide.
    if (topEntries.length === 0) {
      return this.getAllTimeLeaderboard(userId, limit, weekStart, weekEnd);
    }

    // Get last week's XP for all top users to compute delta
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const topUserIds = topEntries.map((e) => e.userId);
    const lastWeekEntries = await this.prisma.weeklyXp.findMany({
      where: {
        weekStart: lastWeekStart,
        userId: { in: topUserIds },
      },
      select: { userId: true, xpEarned: true },
    });
    const lastWeekMap = new Map(lastWeekEntries.map((e) => [e.userId, e.xpEarned]));

    // Build last week's rank map: sort last-week entries by xpEarned desc and assign ranks
    // We query all last-week entries (not just top N) so rank positions are accurate
    const allLastWeekEntries = await this.prisma.weeklyXp.findMany({
      where: { weekStart: lastWeekStart },
      select: { userId: true, xpEarned: true },
      orderBy: { xpEarned: 'desc' },
    });
    const lastWeekRankMap = new Map<string, number>(
      allLastWeekEntries.map((e, idx) => [e.userId, idx + 1]),
    );

    // Build leaderboard with ranks, deltas, rankDelta, and total XP for league badge
    const leaderboard: LeaderboardEntry[] = topEntries.map((entry, index) => {
      const currentRank = index + 1;
      const lastWeekXp = lastWeekMap.get(entry.userId) ?? 0;
      const lastWeekRank = lastWeekRankMap.get(entry.userId) ?? null;
      // rankDelta > 0 means moved UP (better rank = lower number), < 0 moved DOWN
      const rankDelta = lastWeekRank !== null ? lastWeekRank - currentRank : null;
      return {
        rank: currentRank,
        userId: entry.userId,
        username: entry.user.username,
        xpEarned: entry.xpEarned,
        xpDelta: entry.xpEarned - lastWeekXp,
        lastWeekXp,
        totalXp: entry.user.xp,
        isCurrentUser: entry.userId === userId,
        rankDelta,
      };
    });

    // Find current user's position if not in top entries
    let userPosition: LeaderboardEntry | null = null;
    const userInTop = leaderboard.find((e) => e.userId === userId);

    if (!userInTop) {
      // Get user's entry
      const userEntry = await this.prisma.weeklyXp.findUnique({
        where: {
          userId_weekStart: {
            userId,
            weekStart,
          },
        },
        include: {
          user: {
            select: { username: true, xp: true },
          },
        },
      });

      if (userEntry) {
        // Count how many users have more XP
        const usersAbove = await this.prisma.weeklyXp.count({
          where: {
            weekStart,
            xpEarned: { gt: userEntry.xpEarned },
          },
        });

        // Get user's last week XP for delta
        const userLastWeek = await this.prisma.weeklyXp.findUnique({
          where: { userId_weekStart: { userId, weekStart: lastWeekStart } },
          select: { xpEarned: true },
        });
        const userLastWeekXp = userLastWeek?.xpEarned ?? 0;

        const userCurrentRank = usersAbove + 1;
        const userLastWeekRank = lastWeekRankMap.get(userId) ?? null;
        userPosition = {
          rank: userCurrentRank,
          userId,
          username: userEntry.user.username,
          xpEarned: userEntry.xpEarned,
          xpDelta: userEntry.xpEarned - userLastWeekXp,
          lastWeekXp: userLastWeekXp,
          totalXp: userEntry.user.xp,
          isCurrentUser: true,
          rankDelta: userLastWeekRank !== null ? userLastWeekRank - userCurrentRank : null,
        };
      }
    } else {
      userPosition = userInTop;
    }

    return {
      leaderboard,
      userPosition,
      weekStart,
      weekEnd,
    };
  }

  /**
   * Classement hebdo restreint aux amis (demandes ACCEPTED, les deux sens)
   * + soi-même. Les amis à 0 XP cette semaine sont inclus pour ne jamais
   * afficher une liste vide.
   */
  async getFriendsLeaderboard(userId: string): Promise<{
    leaderboard: LeaderboardEntry[];
    userPosition: LeaderboardEntry | null;
    weekStart: Date;
    weekEnd: Date;
  }> {
    const weekStart = this.getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const links = await this.prisma.friendRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });
    const memberIds = Array.from(
      new Set([
        userId,
        ...links.map((l) => (l.senderId === userId ? l.receiverId : l.senderId)),
      ]),
    );

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [users, weekEntries, lastWeekEntries] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: memberIds }, deletedAt: null },
        select: { id: true, username: true, xp: true },
      }),
      this.prisma.weeklyXp.findMany({
        where: { weekStart, userId: { in: memberIds } },
        select: { userId: true, xpEarned: true },
      }),
      this.prisma.weeklyXp.findMany({
        where: { weekStart: lastWeekStart, userId: { in: memberIds } },
        select: { userId: true, xpEarned: true },
      }),
    ]);

    const weekMap = new Map(weekEntries.map((e) => [e.userId, e.xpEarned]));
    const lastWeekMap = new Map(lastWeekEntries.map((e) => [e.userId, e.xpEarned]));

    const ranked = users
      .map((user) => ({ user, xpEarned: weekMap.get(user.id) ?? 0 }))
      .sort((a, b) => b.xpEarned - a.xpEarned || b.user.xp - a.user.xp);

    const leaderboard: LeaderboardEntry[] = ranked.map((entry, index) => {
      const lastWeekXp = lastWeekMap.get(entry.user.id) ?? 0;
      return {
        rank: index + 1,
        userId: entry.user.id,
        username: entry.user.username,
        xpEarned: entry.xpEarned,
        xpDelta: entry.xpEarned - lastWeekXp,
        lastWeekXp,
        totalXp: entry.user.xp,
        isCurrentUser: entry.user.id === userId,
        rankDelta: null,
      };
    });

    return {
      leaderboard,
      userPosition: leaderboard.find((e) => e.isCurrentUser) ?? null,
      weekStart,
      weekEnd,
    };
  }

  /**
   * Classement général (XP total) — repli quand la semaine courante n'a aucune
   * activité, pour ne jamais afficher un classement vide.
   */
  private async getAllTimeLeaderboard(
    userId: string,
    limit: number,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    userPosition: LeaderboardEntry | null;
    weekStart: Date;
    weekEnd: Date;
  }> {
    const topUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { xp: 'desc' },
      take: limit,
      select: { id: true, username: true, xp: true },
    });

    const toEntry = (
      u: { id: string; username: string; xp: number },
      rank: number,
    ): LeaderboardEntry => ({
      rank,
      userId: u.id,
      username: u.username,
      xpEarned: u.xp,
      xpDelta: 0,
      lastWeekXp: 0,
      totalXp: u.xp,
      isCurrentUser: u.id === userId,
      rankDelta: null,
    });

    const leaderboard = topUsers.map((u, i) => toEntry(u, i + 1));

    let userPosition = leaderboard.find((e) => e.isCurrentUser) ?? null;
    if (!userPosition) {
      const me = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, xp: true },
      });
      if (me) {
        const above = await this.prisma.user.count({
          where: { deletedAt: null, xp: { gt: me.xp } },
        });
        userPosition = toEntry(me, above + 1);
      }
    }

    return { leaderboard, userPosition, weekStart, weekEnd };
  }

  /**
   * Record XP earned (call this when user earns XP)
   */
  async recordXp(userId: string, xpAmount: number) {
    const weekStart = this.getWeekStart(new Date());

    return this.prisma.weeklyXp.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      update: {
        xpEarned: { increment: xpAmount },
      },
      create: {
        userId,
        weekStart,
        xpEarned: xpAmount,
      },
    });
  }

  /**
   * Get user's XP history for the last N weeks (default 8).
   * Returns weeks in ascending order (oldest first).
   * Missing weeks are filled with xpEarned = 0.
   */
  async getWeeklyXpHistory(
    userId: string,
    weeks = 8,
  ): Promise<Array<{ weekStart: Date; xpEarned: number; label: string }>> {
    const weekStart = this.getWeekStart(new Date());

    // Fetch up to `weeks` past entries (oldest first)
    const records = await this.prisma.weeklyXp.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: weeks,
      select: { weekStart: true, xpEarned: true },
    });

    // Build a map for fast lookups
    const recordMap = new Map(
      records.map((r) => [r.weekStart.toISOString().slice(0, 10), r.xpEarned]),
    );

    // Build full array of N weeks (ascending)
    const result: Array<{ weekStart: Date; xpEarned: number; label: string }> = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const ws = new Date(weekStart);
      ws.setUTCDate(ws.getUTCDate() - i * 7);
      const key = ws.toISOString().slice(0, 10);
      const label = ws.toLocaleDateString('fr-FR', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      result.push({ weekStart: ws, xpEarned: recordMap.get(key) ?? 0, label });
    }

    return result;
  }

  /**
   * Get user's stats for current week
   */
  async getUserWeeklyStats(userId: string) {
    const weekStart = this.getWeekStart(new Date());

    const entry = await this.prisma.weeklyXp.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    const totalUsers = await this.prisma.weeklyXp.count({
      where: { weekStart },
    });

    let rank = null;
    if (entry) {
      const usersAbove = await this.prisma.weeklyXp.count({
        where: {
          weekStart,
          xpEarned: { gt: entry.xpEarned },
        },
      });
      rank = usersAbove + 1;
    }

    return {
      xpThisWeek: entry?.xpEarned ?? 0,
      rank,
      totalParticipants: totalUsers,
      weekStart,
      timeUntilReset: this.getTimeUntilWeekEnd(weekStart),
    };
  }

  /**
   * Get the Sunday of the current week (week start) — fully UTC to avoid
   * timezone drift on servers running in non-UTC locales (e.g. Bangkok UTC+7).
   * Uses Sunday-start to stay consistent with stored data.
   */
  private getWeekStart(date: Date): Date {
    const day = date.getUTCDay(); // 0 = Sunday
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day),
    );
  }

  /**
   * Get milliseconds until next Sunday midnight UTC
   */
  private getTimeUntilWeekEnd(weekStart: Date): number {
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setUTCDate(nextWeekStart.getUTCDate() + 7);
    return nextWeekStart.getTime() - Date.now();
  }
}
