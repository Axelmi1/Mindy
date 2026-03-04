import { Controller, Get, Post, Param } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementCheckerService } from './achievement-checker.service';

@Controller('achievements')
export class AchievementsController {
  constructor(
    private readonly achievementsService: AchievementsService,
    private readonly achievementCheckerService: AchievementCheckerService,
  ) {}

  /**
   * Get all achievement definitions
   */
  @Get()
  async getAllAchievements() {
    const achievements = await this.achievementsService.getAllAchievements();
    return { success: true, data: achievements };
  }

  /**
   * Get user's achievements (unlocked + locked with progress)
   */
  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string) {
    const achievements = await this.achievementsService.getUserAchievements(userId);
    return { success: true, data: achievements };
  }

  /**
   * Force check achievements for a user (for testing)
   */
  @Post('check/:userId')
  async checkAchievements(@Param('userId') userId: string) {
    const triggers = [
      'lesson_completed',
      'xp_gained',
      'streak_updated',
      'daily_challenge',
      'referral',
    ] as const;

    const unlockedKeys: string[] = [];

    for (const trigger of triggers) {
      const unlocked = await this.achievementCheckerService.checkAndUnlock(userId, trigger);
      unlockedKeys.push(...unlocked);
    }

    return {
      success: true,
      data: {
        unlockedKeys,
        count: unlockedKeys.length,
      },
    };
  }
}
