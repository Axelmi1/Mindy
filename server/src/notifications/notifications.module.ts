import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushTokenService } from './push-token.service';
import { NotificationScheduler } from './notification.scheduler';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushTokenService,
    NotificationScheduler,
  ],
  exports: [NotificationsService, PushTokenService],
})
export class NotificationsModule {}
