import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ChallengesService, CreateChallengeDto, RespondChallengeDto, CompleteChallengeDto } from './challenges.service';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  /**
   * Create a new lesson challenge
   * POST /api/challenges
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a lesson challenge to a friend' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['challengerId', 'challengedId', 'lessonId'],
      properties: {
        challengerId: { type: 'string' },
        challengedId: { type: 'string' },
        lessonId:     { type: 'string' },
        message:      { type: 'string', description: 'Optional trash-talk message' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  async create(@Body() dto: CreateChallengeDto) {
    const challenge = await this.challengesService.createChallenge(dto);
    return { success: true, data: challenge };
  }

  /**
   * Get all challenges for a user (sent + received)
   * GET /api/challenges/user/:userId
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all challenges for a user (sent + received)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getForUser(@Param('userId') userId: string) {
    const challenges = await this.challengesService.getChallengesForUser(userId);
    return { success: true, data: challenges };
  }

  /**
   * Get pending challenges count for a user (for notification badge)
   * GET /api/challenges/user/:userId/pending-count
   */
  @Get('user/:userId/pending-count')
  @ApiOperation({ summary: 'Get count of pending received challenges (notification badge)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Pending challenges count', schema: { properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { pendingCount: { type: 'number' } } } } } })
  async getPendingCount(@Param('userId') userId: string) {
    const data = await this.challengesService.getPendingCount(userId);
    return { success: true, data };
  }

  /**
   * Get a single challenge by ID
   * GET /api/challenges/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a challenge by ID' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  async getById(@Param('id') id: string) {
    const challenge = await this.challengesService.getById(id);
    return { success: true, data: challenge };
  }

  /**
   * Accept or decline a challenge
   * PATCH /api/challenges/:id/respond
   */
  @Patch(':id/respond')
  @ApiOperation({ summary: 'Accept or decline a lesson challenge' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'status'],
      properties: {
        userId: { type: 'string', description: 'The challenged user ID' },
        status: { type: 'string', enum: ['ACCEPTED', 'DECLINED'] },
      },
    },
  })
  async respond(
    @Param('id') id: string,
    @Body() body: { userId: string } & RespondChallengeDto,
  ) {
    const challenge = await this.challengesService.respondToChallenge(id, body.userId, {
      status: body.status,
    });
    return { success: true, data: challenge };
  }

  /**
   * Request a rematch on a completed challenge
   * POST /api/challenges/:id/rematch
   */
  @Post(':id/rematch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a rematch — creates a new challenge with swapped roles' })
  @ApiParam({ name: 'id', description: 'Original challenge ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['requesterId'],
      properties: {
        requesterId: { type: 'string', description: 'ID of the user requesting the rematch' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Rematch challenge created' })
  async rematch(
    @Param('id') id: string,
    @Body() body: { requesterId: string },
  ) {
    const rematch = await this.challengesService.createRematch(id, body.requesterId);
    return { success: true, data: rematch };
  }

  /**
   * Record a user's lesson completion for a challenge
   * PATCH /api/challenges/:id/complete
   */
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Record lesson completion for a challenge participant' })
  @ApiParam({ name: 'id', description: 'Challenge ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'xpEarned'],
      properties: {
        userId:   { type: 'string' },
        xpEarned: { type: 'number', description: 'XP earned in the lesson' },
      },
    },
  })
  async recordCompletion(
    @Param('id') id: string,
    @Body() dto: CompleteChallengeDto,
  ) {
    const challenge = await this.challengesService.recordCompletion(id, dto);
    return { success: true, data: challenge };
  }
}
