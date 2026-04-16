import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendStatus } from '@prisma/client';
import { getLeague } from './league.helper';

export interface FriendWithStats {
  userId: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  league: string;
  status: FriendStatus;
  weeklyXp: number;
}

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search users by username prefix (for adding friends)
   */
  async searchUsers(query: string, currentUserId: string) {
    if (query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const users = await this.prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' },
        id: { not: currentUserId },
      },
      select: { id: true, username: true, xp: true, level: true, streak: true },
      take: 10,
    });

    // For each result, check friendship status
    const results = await Promise.all(
      users.map(async (u) => {
        const req = await this.prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: u.id },
              { senderId: u.id, receiverId: currentUserId },
            ],
          },
        });
        return {
          ...u,
          league: getLeague(u.xp),
          friendStatus: req?.status ?? null,
          requestId: req?.id ?? null,
        };
      }),
    );

    return results;
  }

  /**
   * Send a friend request
   */
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new NotFoundException('User not found');

    const existing = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendStatus.ACCEPTED) {
        throw new ConflictException('Already friends');
      }
      if (existing.status === FriendStatus.PENDING) {
        throw new ConflictException('Friend request already pending');
      }
    }

    return this.prisma.friendRequest.create({
      data: { senderId, receiverId, status: FriendStatus.PENDING },
    });
  }

  /**
   * Accept a friend request
   */
  async acceptRequest(requestId: string, userId: string) {
    const req = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException('Friend request not found');
    if (req.receiverId !== userId) {
      throw new BadRequestException('Not your request to accept');
    }
    if (req.status !== FriendStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendStatus.ACCEPTED },
    });
  }

  /**
   * Decline / remove a friend
   */
  async removeOrDecline(requestId: string, userId: string) {
    const req = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException('Friend request not found');
    if (req.senderId !== userId && req.receiverId !== userId) {
      throw new BadRequestException('Not your request');
    }

    return this.prisma.friendRequest.delete({ where: { id: requestId } });
  }

  /**
   * Get friends list with their weekly XP for a mini-leaderboard
   */
  async getFriends(userId: string): Promise<FriendWithStats[]> {
    const accepted = await this.prisma.friendRequest.findMany({
      where: {
        status: FriendStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    const friendIds = accepted.map((r) =>
      r.senderId === userId ? r.receiverId : r.senderId,
    );

    if (friendIds.length === 0) return [];

    const weekStart = this.getWeekStart();

    const friends = await this.prisma.user.findMany({
      where: { id: { in: friendIds } },
      include: {
        weeklyXp: { where: { weekStart }, orderBy: { xpEarned: 'desc' }, take: 1 },
      },
    });

    return friends
      .map((f) => ({
        userId: f.id,
        username: f.username,
        xp: f.xp,
        level: f.level,
        streak: f.streak,
        league: getLeague(f.xp),
        status: FriendStatus.ACCEPTED,
        weeklyXp: f.weeklyXp[0]?.xpEarned ?? 0,
      }))
      .sort((a, b) => b.weeklyXp - a.weeklyXp);
  }

  /**
   * Get pending incoming requests
   */
  async getPendingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendStatus.PENDING },
      include: {
        sender: { select: { id: true, username: true, xp: true, level: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sun
    const diff = now.getUTCDate() - day;
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0),
    );
    return start;
  }
}
