import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { EventType } from '@prisma/client';

interface TrackEventDto {
  userId: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
  sessionId?: string;
}

interface TrackBatchDto {
  events: Array<TrackEventDto & { timestamp?: string }>;
}

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Track a single event
   */
  @Post('track')
  @HttpCode(HttpStatus.OK)
  async track(@Body() dto: TrackEventDto) {
    await this.analyticsService.track(
      dto.userId,
      dto.eventType,
      dto.eventData,
      dto.sessionId,
    );
    return { success: true };
  }

  /**
   * Track multiple events at once
   */
  @Post('track-batch')
  @HttpCode(HttpStatus.OK)
  async trackBatch(@Body() dto: TrackBatchDto) {
    const events = dto.events.map((e) => ({
      userId: e.userId,
      eventType: e.eventType,
      eventData: e.eventData,
      sessionId: e.sessionId,
      timestamp: e.timestamp ? new Date(e.timestamp) : undefined,
    }));

    await this.analyticsService.trackBatch(events);
    return { success: true, count: events.length };
  }

  /**
   * Get analytics summary (admin endpoint)
   */
  @Get('summary')
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Default to last 7 days
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const summary = await this.analyticsService.getSummary(start, end);

    return {
      success: true,
      data: {
        ...summary,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    };
  }
}
