import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlan } from '@prisma/client';

class SubscribeDto {
  plan!: SubscriptionPlan;
}

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  getPlans() {
    return { data: this.svc.getPlans() };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get subscription for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getSubscription(@Param('userId') userId: string) {
    return { data: await this.svc.getSubscription(userId) };
  }

  @Post(':userId/subscribe')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ schema: { example: { plan: 'PRO_MONTHLY' } } })
  async subscribe(@Param('userId') userId: string, @Body() body: SubscribeDto) {
    return { data: await this.svc.subscribe(userId, body.plan) };
  }

  @Delete(':userId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async cancel(@Param('userId') userId: string) {
    return { data: await this.svc.cancelSubscription(userId) };
  }
}
