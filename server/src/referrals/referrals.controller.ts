import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

class ApplyReferralDto {
  userId!: string;
  referralCode!: string;
}

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * Validate a referral code
   * Note: This route must come before :userId to avoid conflicts
   */
  @Get('validate/:code')
  async validateCode(@Param('code') code: string) {
    const result = await this.referralsService.validateReferralCode(code);
    return { success: true, data: result };
  }

  /**
   * Apply a referral code
   */
  @Post('apply')
  async applyReferralCode(@Body() dto: ApplyReferralDto) {
    const result = await this.referralsService.applyReferralCode(dto.userId, dto.referralCode);
    return { success: true, data: result };
  }

  /**
   * Get referral stats for a user
   */
  @Get('stats/:userId')
  async getReferralStats(@Param('userId') userId: string) {
    const stats = await this.referralsService.getReferralStats(userId);
    return { success: true, data: stats };
  }
}
