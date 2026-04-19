import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushTokenService } from './push-token.service';
import { NotificationScheduler } from './notification.scheduler';
import { EmailService } from './email.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushTokenService,
    NotificationScheduler,
    EmailService,
  ],
  exports: [NotificationsService, PushTokenService, EmailService],
})
export class NotificationsModule {}
