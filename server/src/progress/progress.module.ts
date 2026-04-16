import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { ProgressExportService } from './progress-export.service';
import { WeeklyRecapService } from './weekly-recap.service';
import { UsersModule } from '../users/users.module';
import { LessonsModule } from '../lessons/lessons.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [UsersModule, LessonsModule, LeaderboardModule, AchievementsModule, SubscriptionsModule],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressExportService, WeeklyRecapService],
  exports: [ProgressService, ProgressExportService, WeeklyRecapService],
})
export class ProgressModule {}

