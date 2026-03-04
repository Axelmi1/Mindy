import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class PushTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or update a push token for a user
   */
  async registerToken(
    userId: string,
    token: string,
    platform: Platform,
    deviceId?: string,
  ) {
    return this.prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        deviceId,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
        deviceId,
      },
    });
  }

  /**
   * Deactivate a push token
   */
  async unregisterToken(token: string) {
    return this.prisma.pushToken.update({
      where: { token },
      data: { isActive: false },
    });
  }

  /**
   * Get all active tokens for a user
   */
  async getActiveTokensForUser(userId: string) {
    return this.prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  /**
   * Deactivate invalid tokens (called when Expo reports a bad token)
   */
  async deactivateInvalidToken(token: string) {
    try {
      await this.prisma.pushToken.update({
        where: { token },
        data: { isActive: false },
      });
    } catch {
      // Token might not exist, ignore
    }
  }

  /**
   * Get all users with active push tokens
   */
  async getUsersWithActiveTokens() {
    const tokens = await this.prisma.pushToken.findMany({
      where: { isActive: true },
      select: { userId: true },
      distinct: ['userId'],
    });
    return tokens.map((t) => t.userId);
  }
}
