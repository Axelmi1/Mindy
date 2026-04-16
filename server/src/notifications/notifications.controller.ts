import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushTokenService } from './push-token.service';
import { Platform } from '@prisma/client';

interface RegisterPushTokenDto {
  userId: string;
  token: string;
  platform: Platform;
  deviceId?: string;
}

interface UpdateNotificationPreferencesDto {
  streakReminder?: boolean;
  dailyChallenge?: boolean;
  inactivityReminder?: boolean;
  levelUpCelebration?: boolean;
  streakMilestone?: boolean;
  reminderHour?: number;
  timezone?: string;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly pushTokenService: PushTokenService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Register a push token for a user
   */
  @Post('register-token')
  @HttpCode(HttpStatus.CREATED)
  async registerToken(@Body() dto: RegisterPushTokenDto) {
    const token = await this.pushTokenService.registerToken(
      dto.userId,
      dto.token,
      dto.platform,
      dto.deviceId,
    );

    return {
      success: true,
      data: {
        id: token.id,
        token: token.token,
        platform: token.platform,
        isActive: token.isActive,
      },
    };
  }

  /**
   * Unregister a push token
   */
  @Delete('unregister-token')
  @HttpCode(HttpStatus.OK)
  async unregisterToken(@Body('token') token: string) {
    await this.pushTokenService.unregisterToken(token);
    return { success: true };
  }

  /**
   * Get notification preferences for a user
   */
  @Get('preferences/:userId')
  async getPreferences(@Param('userId') userId: string) {
    let prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // Create default preferences if none exist
    if (!prefs) {
      prefs = await this.prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return {
      success: true,
      data: {
        streakReminder: prefs.streakReminder,
        dailyChallenge: prefs.dailyChallenge,
        inactivityReminder: prefs.inactivityReminder,
        levelUpCelebration: prefs.levelUpCelebration,
        streakMilestone: prefs.streakMilestone,
        reminderHour: prefs.reminderHour,
        timezone: prefs.timezone,
      },
    };
  }

  /**
   * Update notification preferences for a user
   */
  @Patch('preferences/:userId')
  async updatePreferences(
    @Param('userId') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const prefs = await this.prisma.notificationPreferences.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });

    return {
      success: true,
      data: {
        streakReminder: prefs.streakReminder,
        dailyChallenge: prefs.dailyChallenge,
        inactivityReminder: prefs.inactivityReminder,
        levelUpCelebration: prefs.levelUpCelebration,
        streakMilestone: prefs.streakMilestone,
        reminderHour: prefs.reminderHour,
        timezone: prefs.timezone,
      },
    };
  }
}
