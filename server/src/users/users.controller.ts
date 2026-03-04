import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto, UpdateUserDto, ApiResponse, User, UserStats } from '@mindy/shared';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /api/users
   * Create a new user
   */
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

  /**
   * GET /api/users
   * Get all users (paginated)
   */
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

  /**
   * GET /api/users/:id
   * Get a user by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    const user = await this.usersService.findById(id);
    return {
      success: true,
      data: this.mapUserToResponse(user),
    };
  }

  /**
   * GET /api/users/:id/stats
   * Get user stats for dashboard
   */
  @Get(':id/stats')
  async getStats(@Param('id') id: string): Promise<ApiResponse<UserStats>> {
    const stats = await this.usersService.getStats(id);
    return {
      success: true,
      data: stats,
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
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

