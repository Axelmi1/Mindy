import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * GET /api/leaderboard/weekly?userId=xxx
   * Get weekly leaderboard with user's position
   */
  @Get('weekly')
  getWeeklyLeaderboard(@Query('userId') userId: string) {
    return this.leaderboardService.getWeeklyLeaderboard(userId);
  }

  /**
   * GET /api/leaderboard/me?userId=xxx
   * Get user's weekly stats
   */
  @Get('me')
  getUserWeeklyStats(@Query('userId') userId: string) {
    return this.leaderboardService.getUserWeeklyStats(userId);
  }
}
