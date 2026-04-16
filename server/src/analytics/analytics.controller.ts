import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Get, Body, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
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

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Track a single event
   */
  @Post('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track a single analytics event' })
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
  @ApiOperation({ summary: 'Track multiple analytics events (batch)' })
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
   * Get analytics summary (date range)
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary for a date range (last 7 days by default)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'ISO date string' })
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
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

  /**
   * Admin dashboard — full KPI snapshot
   */
  @Get('admin/dashboard')
  @ApiOperation({
    summary: '[ADMIN] Full dashboard stats — users, lessons, XP, streaks, events',
    description:
      'Returns all KPIs for the admin dashboard. Requires admin bypass in production.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats object with user, lesson, XP and event breakdowns.',
  })
  async getAdminDashboard() {
    const stats = await this.analyticsService.getAdminDashboard();
    return {
      success: true,
      generatedAt: new Date().toISOString(),
      data: stats,
    };
  }

  /**
   * Investor-grade retention metrics
   */
  @Get('admin/retention')
  @ApiOperation({
    summary: '[ADMIN] Retention metrics — DAU/MAU, D1/D7/D30 retention, churn rate',
    description:
      'Returns investor-grade retention KPIs: stickiness ratio, cohort retention, churn, 30-day DAU trend.',
  })
  @ApiResponse({
    status: 200,
    description: 'RetentionMetrics object with all engagement KPIs.',
  })
  async getRetentionMetrics() {
    const metrics = await this.analyticsService.getRetentionMetrics();
    return {
      success: true,
      generatedAt: new Date().toISOString(),
      data: metrics,
    };
  }

  /**
   * Conversion funnel — signup → onboarding → first lesson → D7 → D30 → Pro
   */
  @Get('admin/funnel')
  @ApiOperation({
    summary: '[ADMIN] Conversion funnel — signup → onboarding → first lesson → D7/D30 → Pro',
    description:
      'Returns 6-step acquisition funnel with conversion rates and drop-off analysis. Ideal for investor pitch decks.',
  })
  @ApiResponse({
    status: 200,
    description: 'FunnelAnalytics with steps, conversionRates, and dropOffs.',
  })
  async getFunnelAnalytics() {
    const funnel = await this.analyticsService.getFunnelAnalytics();
    return {
      success: true,
      data: funnel,
    };
  }

  /**
   * Export all key metrics as CSV — ready for Excel / Google Sheets / investor decks
   * GET /api/analytics/admin/export-csv
   */
  @Get('admin/export-csv')
  @ApiOperation({
    summary: '[ADMIN] Export all metrics as CSV',
    description:
      'Generates a CSV file with users, retention, funnel, DAU trend and top lessons. Download directly in the browser.',
  })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCsv(@Res() res: Response) {
    const [dashboard, retention, funnel] = await Promise.all([
      this.analyticsService.getAdminDashboard(),
      this.analyticsService.getRetentionMetrics(),
      this.analyticsService.getFunnelAnalytics(),
    ]);

    const now = new Date().toISOString();
    const rows: string[] = [];

    // ── Section 1: Overview KPIs ──────────────────────────────────────────
    rows.push('=== OVERVIEW ===');
    rows.push('Metric,Value');
    rows.push(`Export Date,${now}`);
    rows.push(`Total Users,${dashboard.users.total}`);
    rows.push(`Active Today,${dashboard.users.activeToday}`);
    rows.push(`Active This Week,${dashboard.users.activeThisWeek}`);
    rows.push(`New Users This Week,${dashboard.users.newThisWeek}`);
    rows.push(`Avg Streak,${dashboard.users.avgStreak}`);
    rows.push(`Avg XP,${dashboard.users.avgXp}`);
    rows.push(`Total Lesson Completions,${dashboard.lessons.totalCompletions}`);
    rows.push(`Completions Today,${dashboard.lessons.completionsToday}`);
    rows.push(`Completions This Week,${dashboard.lessons.completionsThisWeek}`);
    rows.push(`Total XP Distributed,${dashboard.xp.totalDistributed}`);
    rows.push(`XP Distributed This Week,${dashboard.xp.distributedThisWeek}`);
    rows.push('');

    // ── Section 2: Retention KPIs ─────────────────────────────────────────
    rows.push('=== RETENTION ===');
    rows.push('Metric,Value');
    rows.push(`DAU,${retention.dau}`);
    rows.push(`MAU,${retention.mau}`);
    rows.push(`DAU/MAU Stickiness,${retention.dauMauRatio}`);
    rows.push(`D1 Retention (%),${retention.d1Retention}`);
    rows.push(`D7 Retention (%),${retention.d7Retention}`);
    rows.push(`D30 Retention (%),${retention.d30Retention}`);
    rows.push(`Churn Rate (%),${retention.churnRate}`);
    rows.push(`New Users Last 7d,${retention.newUsersLast7d}`);
    rows.push(`New Users Last 30d,${retention.newUsersLast30d}`);
    rows.push(`Avg Sessions / User,${retention.avgSessionsPerUser}`);
    rows.push(`Avg Lessons / DAU,${retention.avgLessonsPerDau}`);
    rows.push('');

    // ── Section 3: Conversion Funnel ──────────────────────────────────────
    rows.push('=== CONVERSION FUNNEL ===');
    rows.push('Step,Label,Count,Conversion From Previous (%),Conversion From Top (%)');
    for (const step of funnel.steps) {
      rows.push(
        `${step.step},${step.label},${step.count},${step.conversionFromPrevious ?? 'N/A'},${step.conversionFromTop}`,
      );
    }
    rows.push(`Overall Signup → Pro,${funnel.overallConversion}%,,,`);
    rows.push('');

    // ── Section 4: 30-Day DAU Trend ───────────────────────────────────────
    rows.push('=== 30-DAY DAU TREND ===');
    rows.push('Date,DAU');
    for (const point of retention.dauTrend) {
      rows.push(`${point.date},${point.dau}`);
    }
    rows.push('');

    // ── Section 5: Top Lessons ────────────────────────────────────────────
    rows.push('=== TOP LESSONS ===');
    rows.push('Lesson ID,Title,Domain,Completions');
    for (const lesson of dashboard.lessons.topLessons) {
      rows.push(`${lesson.id},"${lesson.title}",${lesson.domain},${lesson.completions}`);
    }

    const csv = rows.join('\n');
    const filename = `mindly-metrics-${now.slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  }
}
