import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { UsersModule } from '../users/users.module';
import { LessonsModule } from '../lessons/lessons.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [UsersModule, LessonsModule, LeaderboardModule, AchievementsModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}

