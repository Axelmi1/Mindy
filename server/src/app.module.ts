import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FriendsModule } from './friends/friends.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ChallengesModule } from './challenges/challenges.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    // ── Rate Limiting ─────────────────────────────────────────────────────
    // Default: 100 requests per 60 seconds per IP.
    // Admins endpoints have their own higher limits via @Throttle() override.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // 60 seconds window
        limit: 100,    // max 100 requests per window
      },
      {
        name: 'strict',
        ttl: 60_000,
        limit: 20,     // stricter limit for auth/write-heavy routes
      },
    ]),

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
    SubscriptionsModule,
    FriendsModule,
    RecommendationsModule,
    ChallengesModule,
  ],
  providers: [
    // Apply throttling globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

