import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType, Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track a single analytics event
   */
  async track(
    userId: string,
    eventType: EventType,
    eventData?: Record<string, unknown>,
    sessionId?: string,
  ) {
    return this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventData: eventData as Prisma.JsonValue ?? Prisma.JsonNull,
        sessionId,
      },
    });
  }

  /**
   * Track multiple events at once (batch insert)
   */
  async trackBatch(
    events: Array<{
      userId: string;
      eventType: EventType;
      eventData?: Record<string, unknown>;
      sessionId?: string;
      timestamp?: Date;
    }>,
  ) {
    return this.prisma.analyticsEvent.createMany({
      data: events.map((e) => ({
        userId: e.userId,
        eventType: e.eventType,
        eventData: e.eventData as Prisma.JsonValue ?? Prisma.JsonNull,
        sessionId: e.sessionId,
        timestamp: e.timestamp ?? new Date(),
      })),
    });
  }

  /**
   * Get event counts by type for a date range
   */
  async getEventCounts(startDate: Date, endDate: Date) {
    return this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });
  }

  /**
   * Get daily active users count
   */
  async getDailyActiveUsers(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return result.length;
  }

  /**
   * Get summary stats for dashboard
   */
  async getSummary(startDate: Date, endDate: Date) {
    const [eventCounts, totalEvents, uniqueUsers] = await Promise.all([
      this.getEventCounts(startDate, endDate),
      this.prisma.analyticsEvent.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return {
      totalEvents,
      uniqueUsers: uniqueUsers.length,
      eventsByType: eventCounts.reduce(
        (acc, item) => {
          acc[item.eventType] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
