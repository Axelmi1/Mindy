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
import { ProgressService } from './progress.service';
import type {
  ApiResponse,
  UserProgress,
  UserProgressWithLesson,
  CreateProgressDto,
  UpdateProgressDto,
  CompleteStepDto,
} from '@mindy/shared';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * POST /api/progress
   * Start tracking progress for a lesson
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProgressDto: CreateProgressDto,
  ): Promise<ApiResponse<UserProgress>> {
    const progress = await this.progressService.create(createProgressDto);
    return {
      success: true,
      data: this.mapProgressToResponse(progress),
      message: 'Progress tracking started',
    };
  }

  /**
   * GET /api/progress/user/:userId
   * Get all progress for a user
   */
  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<UserProgressWithLesson[]>> {
    const progressList = await this.progressService.findByUserId(userId);
    return {
      success: true,
      data: progressList.map((p) => ({
        ...this.mapProgressToResponse(p),
        lesson: {
          id: p.lesson.id,
          title: p.lesson.title,
          domain: p.lesson.domain,
          xpReward: p.lesson.xpReward,
        },
      })),
    };
  }

  /**
   * GET /api/progress/user/:userId/current
   * Get user's current/in-progress lesson
   */
  @Get('user/:userId/current')
  async getCurrentLesson(@Param('userId') userId: string): Promise<
    ApiResponse<{
      lesson: { id: string; title: string } | null;
      progress: UserProgress | null;
    }>
  > {
    const current = await this.progressService.getCurrentLesson(userId);
    return {
      success: true,
      data: current
        ? {
            lesson: {
              id: current.lesson.id,
              title: current.lesson.title,
            },
            progress: current.progress
              ? this.mapProgressToResponse(current.progress)
              : null,
          }
        : { lesson: null, progress: null },
    };
  }

  /**
   * GET /api/progress/:id
   * Get progress by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<UserProgress>> {
    const progress = await this.progressService.findById(id);
    return {
      success: true,
      data: this.mapProgressToResponse(progress),
    };
  }

  /**
   * GET /api/progress/user/:userId/lesson/:lessonId
   * Get progress for specific user and lesson
   */
  @Get('user/:userId/lesson/:lessonId')
  async findByUserAndLesson(
    @Param('userId') userId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<ApiResponse<UserProgress | null>> {
    const progress = await this.progressService.findByUserAndLesson(userId, lessonId);
    return {
      success: true,
      data: progress ? this.mapProgressToResponse(progress) : null,
    };
  }

  /**
   * PATCH /api/progress/:id
   * Update progress
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<ApiResponse<UserProgress>> {
    const progress = await this.progressService.update(id, updateProgressDto);
    return {
      success: true,
      data: this.mapProgressToResponse(progress),
      message: 'Progress updated',
    };
  }

  /**
   * POST /api/progress/:id/complete-step
   * Mark a single step as completed
   */
  @Post(':id/complete-step')
  async completeStep(
    @Param('id') id: string,
    @Body() body: CompleteStepDto,
  ): Promise<
    ApiResponse<UserProgress & { justCompleted: boolean; xpAwarded: number }>
  > {
    const result = await this.progressService.completeStep(id, body.stepIndex);
    return {
      success: true,
      data: {
        ...this.mapProgressToResponse(result),
        justCompleted: result.justCompleted,
        xpAwarded: result.xpAwarded,
      },
      message: result.justCompleted
        ? `Lesson completed! +${result.xpAwarded} XP`
        : 'Step completed',
    };
  }

  /**
   * POST /api/progress/:id/reset
   * Reset progress (for retrying a lesson)
   */
  @Post(':id/reset')
  async resetProgress(@Param('id') id: string): Promise<ApiResponse<UserProgress>> {
    const progress = await this.progressService.resetProgress(id);
    return {
      success: true,
      data: this.mapProgressToResponse(progress),
      message: 'Progress reset',
    };
  }

  /**
   * DELETE /api/progress/:id
   * Delete progress
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse<{ id: string }>> {
    await this.progressService.delete(id);
    return {
      success: true,
      data: { id },
      message: 'Progress deleted',
    };
  }

  /**
   * Map progress to API response format
   */
  private mapProgressToResponse(progress: {
    id: string;
    userId: string;
    lessonId: string;
    completedSteps: number[];
    isCompleted: boolean;
  }): UserProgress {
    return {
      id: progress.id,
      userId: progress.userId,
      lessonId: progress.lessonId,
      completedSteps: progress.completedSteps,
      isCompleted: progress.isCompleted,
    };
  }
}

