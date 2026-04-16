import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { CreateUserDto, UpdateUserDto, ApiResponse, User, UserStats } from '@mindy/shared';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user', description: 'Creates a user with a generated referral code.' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      data: this.mapUserToResponse(user),
      message: 'User created successfully',
    };
  }

  @ApiOperation({ summary: 'List all users (paginated)' })
  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ApiResponse<User[]>> {
    const users = await this.usersService.findAll(
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
    return {
      success: true,
      data: users.map(this.mapUserToResponse),
    };
  }

  @ApiOperation({ summary: 'Find user by username (case-insensitive, used for login)' })
  @Get('by-username/:username')
  async findByUsername(@Param('username') username: string): Promise<ApiResponse<User>> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return { success: false, message: 'User not found' } as any;
    }
    return {
      success: true,
      data: this.mapUserToResponse(user),
    };
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    const user = await this.usersService.findById(id);
    return {
      success: true,
      data: this.mapUserToResponse(user),
    };
  }

  @ApiOperation({ summary: 'Get user stats (XP, level, streak, lessons completed, achievements)' })
  @Get(':id/stats')
  async getStats(@Param('id') id: string): Promise<ApiResponse<UserStats>> {
    const stats = await this.usersService.getStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /api/users/:id/recent-activity
   * Returns the last N analytics events for the user's activity timeline
   */
  @ApiOperation({ summary: 'Get recent activity timeline for a user (last 10 events)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max events (default 10)' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Activity feed with human-readable labels and icons',
  })
  @Get(':id/recent-activity')
  async getRecentActivity(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 50) : 10;
    const activities = await this.usersService.getRecentActivity(id, parsedLimit);
    return {
      success: true,
      data: activities,
    };
  }

  /**
   * PATCH /api/users/:id
   * Update a user
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      data: this.mapUserToResponse(user),
      message: 'User updated successfully',
    };
  }

  /**
   * POST /api/users/:id/xp
   * Add XP to user
   */
  @Post(':id/xp')
  async addXp(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.addXp(id, amount);
    return {
      success: true,
      data: this.mapUserToResponse(user),
      message: `Added ${amount} XP`,
    };
  }

  /**
   * POST /api/users/:id/streak
   * Update user streak
   */
  @Post(':id/streak')
  async updateStreak(@Param('id') id: string): Promise<ApiResponse<User>> {
    const user = await this.usersService.updateStreak(id);
    return {
      success: true,
      data: this.mapUserToResponse(user),
    };
  }

  /**
   * PATCH /api/users/:id/username
   * Update username (unique check)
   */
  @Patch(':id/username')
  async updateUsername(
    @Param('id') id: string,
    @Body('username') username: string,
  ): Promise<ApiResponse<User>> {
    if (!username || username.length < 3 || username.length > 20) {
      return { success: false, message: 'Username must be 3-20 characters' } as any;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, message: 'Only letters, numbers and underscore allowed' } as any;
    }
    // Check uniqueness
    const existing = await this.usersService.findByUsername(username);
    if (existing && existing.id !== id) {
      return { success: false, message: 'Username already taken' } as any;
    }
    const user = await this.usersService.update(id, { username });
    return {
      success: true,
      data: this.mapUserToResponse(user),
      message: 'Username updated',
    };
  }

  /**
   * POST /api/users/:id/streak-freeze
   * Buy a streak freeze using 50 XP
   */
  @ApiOperation({
    summary: 'Buy a streak freeze with XP',
    description: 'Costs 50 XP. Maximum 3 freezes per user. A streak freeze automatically activates when the user misses exactly 1 day and has not used a freeze this week.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @SwaggerApiResponse({ status: 201, description: 'Freeze purchased successfully' })
  @SwaggerApiResponse({ status: 400, description: 'Not enough XP or already at max freezes' })
  @Post(':id/streak-freeze')
  @HttpCode(HttpStatus.CREATED)
  async buyStreakFreeze(@Param('id') id: string): Promise<
    { success: boolean; data: { xp: number; streakFreezes: number; xpSpent: number } }
  > {
    const result = await this.usersService.buyStreakFreeze(id);
    return { success: true, data: result };
  }

  /**
   * PATCH /api/users/:id/settings
   * Update user settings (sound, etc.)
   */
  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() settings: { soundEnabled?: boolean },
  ): Promise<ApiResponse<User>> {
    const user = await this.usersService.updateSettings(id, settings);
    return {
      success: true,
      data: this.mapUserToResponse(user),
      message: 'Settings updated',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Social Stats
  // ─────────────────────────────────────────────────────────────────────────

  @Get(':id/social-stats')
  @ApiOperation({ summary: 'Get social/challenge stats for a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getSocialStats(
    @Param('id') id: string,
  ): Promise<ApiResponse<{
    challengesSent: number;
    challengesReceived: number;
    challengesWon: number;
    challengesLost: number;
    challengesDraw: number;
    winRate: number;
    avgRank4Weeks: number | null;
  }>> {
    const data = await this.usersService.getSocialStats(id);
    return { success: true, data };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Deletion (soft delete)
  // ─────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a user account (anonymise + mark deleted)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async softDelete(
    @Param('id') id: string,
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    const data = await this.usersService.softDelete(id);
    return { success: true, data };
  }

  /**
   * Map Prisma User to API response format
   */
  private mapUserToResponse(user: {
    id: string;
    email: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    maxStreak: number;
    streakFreezes: number;
    soundEnabled: boolean;
    lastActiveAt: Date | null;
    preferredDomain?: string | null;
    userGoal?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      maxStreak: user.maxStreak,
      streakFreezes: user.streakFreezes,
      soundEnabled: user.soundEnabled,
      lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
      preferredDomain: user.preferredDomain ?? null,
      userGoal: user.userGoal ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

