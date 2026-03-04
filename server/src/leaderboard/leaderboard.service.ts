import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  xpEarned: number;
  isCurrentUser: boolean;
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

    // Get top entries for this week
    const topEntries = await this.prisma.weeklyXp.findMany({
      where: { weekStart },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { xpEarned: 'desc' },
      take: limit,
    });

    // Build leaderboard with ranks
    const leaderboard: LeaderboardEntry[] = topEntries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      username: entry.user.username,
      xpEarned: entry.xpEarned,
      isCurrentUser: entry.userId === userId,
    }));

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
            select: { username: true },
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

        userPosition = {
          rank: usersAbove + 1,
          userId,
          username: userEntry.user.username,
          xpEarned: userEntry.xpEarned,
          isCurrentUser: true,
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
   * Get the Monday of the current week (week start)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }

  /**
   * Get milliseconds until next Monday
   */
  private getTimeUntilWeekEnd(weekStart: Date): number {
    const nextWeekStart = new Date(weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return nextWeekStart.getTime() - Date.now();
  }
}
