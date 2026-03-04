import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LessonsModule } from './lessons/lessons.module';
import { ProgressModule } from './progress/progress.module';
import { DailyChallengeModule } from './daily-challenge/daily-challenge.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ReferralsModule } from './referrals/referrals.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    LessonsModule,
    ProgressModule,
    DailyChallengeModule,
    LeaderboardModule,
    NotificationsModule,
    AnalyticsModule,
    AchievementsModule,
    ReferralsModule,
  ],
})
export class AppModule {}

