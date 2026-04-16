import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

// ─── Swagger DTO shapes ──────────────────────────────────────────────────────

class LeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank!: number;

  @ApiProperty({ example: 'user_abc123' })
  userId!: string;

  @ApiProperty({ example: 'axel' })
  username!: string;

  @ApiProperty({ example: 320, description: 'XP earned this week' })
  xpEarned!: number;

  @ApiProperty({ example: 80, description: 'Delta vs previous week (can be negative)' })
  xpDelta!: number;

  @ApiProperty({ example: 240 })
  lastWeekXp!: number;

  @ApiProperty({ example: 1500, description: 'All-time XP for league badge computation' })
  totalXp!: number;

  @ApiProperty({ example: false })
  isCurrentUser!: boolean;
}

class WeeklyLeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardEntryDto] })
  leaderboard!: LeaderboardEntryDto[];

  @ApiProperty({ type: LeaderboardEntryDto, nullable: true })
  userPosition!: LeaderboardEntryDto | null;

  @ApiProperty({ example: '2026-03-02T00:00:00.000Z' })
  weekStart!: Date;

  @ApiProperty({ example: '2026-03-09T00:00:00.000Z' })
  weekEnd!: Date;
}

class UserWeeklyStatsDto {
  @ApiProperty({ example: 320, description: 'XP earned this week' })
  xpThisWeek!: number;

  @ApiProperty({ example: 2, nullable: true, description: 'User rank this week (null if no XP recorded)' })
  rank!: number | null;

  @ApiProperty({ example: 47, description: 'Total users who earned XP this week' })
  totalParticipants!: number;

  @ApiProperty({ example: '2026-03-02T00:00:00.000Z' })
  weekStart!: Date;

  @ApiProperty({ example: 259200000, description: 'Milliseconds until next weekly reset (next Monday 00:00 UTC)' })
  timeUntilReset!: number;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * GET /api/leaderboard/weekly?userId=xxx
   * Weekly XP leaderboard with current user's position
   */
  @Get('weekly')
  @ApiOperation({
    summary: 'Get weekly XP leaderboard',
    description: [
      'Returns the top-10 players ranked by XP earned during the current week.',
      'Each entry includes the player\'s all-time XP (`totalXp`) so the client can',
      'compute and display the correct league badge (Iron → Platinum).',
      'The current user\'s position is always returned even if they are outside the top 10.',
    ].join(' '),
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The authenticated user\'s ID (used to highlight their position)',
    example: 'clxyz123abc',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of top players to return (default 10, max 50)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly leaderboard with user position and week boundaries',
    type: WeeklyLeaderboardResponseDto,
  })
  getWeeklyLeaderboard(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getWeeklyLeaderboard(
      userId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * GET /api/leaderboard/me?userId=xxx
   * User's personal weekly stats
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get current user\'s weekly stats',
    description: [
      'Returns the authenticated user\'s weekly XP, their rank among all',
      'participants, the total number of participants, and the number of',
      'milliseconds until the leaderboard resets (next Monday 00:00 UTC).',
    ].join(' '),
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'The authenticated user\'s ID',
    example: 'clxyz123abc',
  })
  @ApiResponse({
    status: 200,
    description: 'User weekly stats',
    type: UserWeeklyStatsDto,
  })
  getUserWeeklyStats(@Query('userId') userId: string) {
    return this.leaderboardService.getUserWeeklyStats(userId);
  }

  /**
   * GET /api/leaderboard/history?userId=xxx&weeks=8
   * Weekly XP history for the last N weeks
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get user weekly XP history',
    description:
      'Returns XP earned per week for the last N weeks (default 8). ' +
      'Weeks with no XP have xpEarned = 0. Array is in ascending order (oldest → newest).',
  })
  @ApiQuery({ name: 'userId', required: true, example: 'clxyz123abc' })
  @ApiQuery({
    name: 'weeks',
    required: false,
    description: 'Number of weeks to return (default 8, max 52)',
    example: 8,
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly XP history array',
  })
  getWeeklyXpHistory(
    @Query('userId') userId: string,
    @Query('weeks') weeks?: string,
  ) {
    const weeksN = weeks ? Math.min(parseInt(weeks, 10), 52) : 8;
    return this.leaderboardService.getWeeklyXpHistory(userId, weeksN);
  }
}
