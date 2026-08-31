import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuestsService } from './quests.service';

@ApiTags('quests')
@Controller('quests')
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  /**
   * GET /api/quests/:userId
   * Today's daily quests with progress and claim state.
   */
  @Get(':userId')
  @ApiOperation({ summary: "Get today's daily quests for a user" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getTodayQuests(@Param('userId') userId: string) {
    return { data: await this.questsService.getTodayQuests(userId) };
  }

  /**
   * POST /api/quests/:userId/claim
   * Claim the XP reward of a completed quest.
   */
  @Post(':userId/claim')
  @ApiOperation({ summary: 'Claim the reward of a completed daily quest' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ schema: { properties: { questKey: { type: 'string' } } } })
  async claim(
    @Param('userId') userId: string,
    @Body() body: { questKey: string },
  ) {
    return { data: await this.questsService.claim(userId, body.questKey) };
  }
}
