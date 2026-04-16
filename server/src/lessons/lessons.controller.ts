import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
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
import { LessonsService } from './lessons.service';
import { Domain, Difficulty } from '@prisma/client';
import type { ApiResponse, Lesson, LessonContent } from '@mindy/shared';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  /**
   * POST /api/lessons
   * Create a new lesson (validated with Zod)
   */
  @ApiOperation({ summary: 'Create a new lesson', description: 'Validated with Zod. The `content` field must contain a `steps` array (INFO, QUIZ, MATCH_PAIRS, FILL_BLANK, CALCULATOR, SCENARIO).' })
  @SwaggerApiResponse({ status: 201, description: 'Lesson created' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLessonDto: unknown): Promise<ApiResponse<Lesson>> {
    const lesson = await this.lessonsService.create(createLessonDto);
    return {
      success: true,
      data: this.mapLessonToResponse(lesson),
      message: 'Lesson created successfully',
    };
  }

  /**
   * GET /api/lessons
   * Get all lessons with optional filters
   */
  @ApiOperation({ summary: 'List lessons with optional domain/difficulty filters' })
  @ApiQuery({ name: 'domain', required: false, enum: ['CRYPTO', 'FINANCE', 'TRADING'], description: 'Filter by domain' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], description: 'Filter by difficulty' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @SwaggerApiResponse({ status: 200, description: 'Array of Lesson objects (70 total in production)' })
  @Get()
  async findAll(
    @Query('domain') domain?: Domain,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ApiResponse<Lesson[]>> {
    const lessons = await this.lessonsService.findAll({
      domain,
      difficulty,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: lessons.map(this.mapLessonToResponse),
    };
  }

  /**
   * GET /api/lessons/:id
   * Get a lesson by ID
   */
  @ApiOperation({ summary: 'Get lesson by ID (includes full step content)' })
  @ApiParam({ name: 'id', description: 'Lesson ID (CUID)' })
  @SwaggerApiResponse({ status: 200, description: 'Lesson with full content' })
  @SwaggerApiResponse({ status: 404, description: 'Lesson not found' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Lesson>> {
    const lesson = await this.lessonsService.findById(id);
    return {
      success: true,
      data: this.mapLessonToResponse(lesson),
    };
  }

  /**
   * GET /api/lessons/domain/:domain
   * Get lessons by domain with optional user progress
   */
  @ApiOperation({ summary: 'Get lessons by domain', description: 'Pass ?userId= to embed the user\'s completion status on each lesson.' })
  @ApiParam({ name: 'domain', enum: ['CRYPTO', 'FINANCE', 'TRADING'] })
  @ApiQuery({ name: 'userId', required: false })
  @Get('domain/:domain')
  async findByDomain(
    @Param('domain') domain: Domain,
    @Query('userId') userId?: string,
  ): Promise<ApiResponse<Lesson[]>> {
    const lessons = await this.lessonsService.findByDomainWithProgress(domain, userId);
    return {
      success: true,
      data: lessons.map(this.mapLessonToResponse),
    };
  }

  /**
   * PATCH /api/lessons/:id
   * Update a lesson (validated with Zod)
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLessonDto: unknown,
  ): Promise<ApiResponse<Lesson>> {
    const lesson = await this.lessonsService.update(id, updateLessonDto);
    return {
      success: true,
      data: this.mapLessonToResponse(lesson),
      message: 'Lesson updated successfully',
    };
  }

  /**
   * DELETE /api/lessons/:id
   * Delete a lesson
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<ApiResponse<{ id: string }>> {
    await this.lessonsService.delete(id);
    return {
      success: true,
      data: { id },
      message: 'Lesson deleted successfully',
    };
  }

  /**
   * Map Prisma Lesson to API response format
   */
  private mapLessonToResponse(lesson: {
    id: string;
    title: string;
    domain: Domain;
    difficulty: Difficulty;
    content: unknown;
    xpReward: number;
    orderIndex: number;
    createdAt: Date;
  }): Lesson {
    return {
      id: lesson.id,
      title: lesson.title,
      domain: lesson.domain,
      difficulty: lesson.difficulty,
      content: lesson.content as LessonContent,
      xpReward: lesson.xpReward,
      orderIndex: lesson.orderIndex,
      createdAt: lesson.createdAt.toISOString(),
    };
  }
}

