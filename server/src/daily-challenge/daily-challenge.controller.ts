import { Controller, Get, Post, Param } from '@nestjs/common';
import { DailyChallengeService } from './daily-challenge.service';

@Controller('daily-challenge')
export class DailyChallengeController {
  constructor(private readonly dailyChallengeService: DailyChallengeService) {}

  /**
   * GET /api/daily-challenge/:userId
   * Get today's daily challenge for a user
   */
  @Get(':userId')
  getTodayChallenge(@Param('userId') userId: string) {
    return this.dailyChallengeService.getTodayChallenge(userId);
  }

  /**
   * POST /api/daily-challenge/:userId/complete
   * Complete today's daily challenge
   */
  @Post(':userId/complete')
  completeChallenge(@Param('userId') userId: string) {
    return this.dailyChallengeService.completeChallenge(userId);
  }

  /**
   * GET /api/daily-challenge/:userId/history
   * Get challenge history
   */
  @Get(':userId/history')
  getChallengeHistory(@Param('userId') userId: string) {
    return this.dailyChallengeService.getChallengeHistory(userId);
  }
}
