import { Module, Global } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementCheckerService } from './achievement-checker.service';
import { AchievementsController } from './achievements.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementCheckerService],
  exports: [AchievementsService, AchievementCheckerService],
})
export class AchievementsModule {}
