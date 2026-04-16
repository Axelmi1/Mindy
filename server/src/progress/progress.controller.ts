import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse as SwaggerApiResponse, ApiBody } from '@nestjs/swagger';
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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProgressService } from './progress.service';
import { ProgressExportService } from './progress-export.service';
import { WeeklyRecapService } from './weekly-recap.service';
import type {
  ApiResponse,
  UserProgress,
  UserProgressWithLesson,
  CreateProgressDto,
  UpdateProgressDto,
  CompleteStepDto,
} from '@mindy/shared';

@ApiTags('progress')
@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly exportService: ProgressExportService,
    private readonly weeklyRecapService: WeeklyRecapService,
  ) {}

  /**
   * POST /api/progress
   * Start tracking progress for a lesson
   */
  @ApiOperation({
    summary: 'Start a lesson (create progress record)',
    description: 'Creates a UserProgress row for the given user+lesson pair. Throws 409 if already started.',
  })
  @SwaggerApiResponse({ status: 201, description: 'Progress record created' })
  @SwaggerApiResponse({ status: 409, description: 'Progress already exists for this user+lesson pair' })
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
  @ApiOperation({ summary: 'Get all lesson progress for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @SwaggerApiResponse({ status: 200, description: 'Array of progress records with embedded lesson metadata' })
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
  @ApiOperation({ summary: 'Get user\'s current in-progress lesson', description: 'Returns the most recently started lesson that is not yet completed.' })
  @ApiParam({ name: 'userId', description: 'User ID' })
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
   * GET /api/progress/user/:userId/combo
   * Get the user's current combo count and multiplier (lessons in last 2h)
   */
  @ApiOperation({ summary: 'Get current combo status for a user (lessons completed in last 2h)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @SwaggerApiResponse({ status: 200, description: 'Combo count, multiplier, and active flag' })
  @Get('user/:userId/combo')
  async getCurrentCombo(@Param('userId') userId: string) {
    const combo = await this.progressService.getCurrentCombo(userId);
    return { success: true, data: combo };
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

  @ApiOperation({ summary: 'Get activity heatmap (last N days)', description: 'Returns one entry per calendar day with lesson count and XP earned. Use days=56 for 8-week GitHub-style heatmap.' })
  @Get('user/:userId/activity')
  async getActivityHeatmap(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ): Promise<ApiResponse<{ date: string; count: number; xpEarned: number }[]>> {
    const daysNum = days ? Math.min(parseInt(days, 10), 365) : 56;
    const data = await this.progressService.getActivityHeatmap(userId, daysNum);
    return { success: true, data };
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
  @ApiOperation({
    summary: 'Complete a step within a lesson',
    description: [
      'Marks step `stepIndex` as done. When **all** steps are completed:',
      '- `isCompleted` becomes `true`',
      '- XP is awarded to the user (and leaderboard updated)',
      '- User streak is updated',
      '- `justCompleted` is `true` in the response',
      'Re-submitting an already-completed step is idempotent (no double XP).',
    ].join('\n'),
  })
  @ApiParam({ name: 'id', description: 'Progress record ID' })
  @SwaggerApiResponse({ status: 200, description: 'Step recorded. Check `justCompleted` and `xpAwarded` in response.' })
  @SwaggerApiResponse({ status: 404, description: 'Progress not found or step index out of range' })
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
  @ApiOperation({ summary: 'Reset lesson progress (practice mode)', description: 'Clears all completed steps and sets isCompleted to false. XP is NOT revoked.' })
  @ApiParam({ name: 'id', description: 'Progress record ID' })
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
   * GET /api/progress/:userId/weekly-recap
   * Get the current week's learning recap with stats and motivation.
   */
  @Get(':userId/weekly-recap')
  @ApiOperation({ summary: 'Get weekly learning recap for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getWeeklyRecap(@Param('userId') userId: string) {
    return { data: await this.weeklyRecapService.getWeeklyRecap(userId) };
  }

  /**
   * GET /api/progress/:userId/export/pdf
   * Export user progress as a PDF report (Pro feature).
   */
  @Get(':userId/export/pdf')
  @ApiOperation({ summary: 'Export progress report as PDF (Pro only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @SwaggerApiResponse({ status: 200, description: 'PDF file download' })
  @SwaggerApiResponse({ status: 403, description: 'Requires Pro subscription' })
  async exportPdf(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.exportService.generateProgressPdf(userId);
    const filename = `mindy-progress-${userId}-${Date.now()}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
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

