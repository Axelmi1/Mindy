import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Domain, Difficulty } from '@prisma/client';
import {
  CreateLessonSchema,
  UpdateLessonSchema,
  validateLessonContent,
  type CreateLessonInput,
  type UpdateLessonInput,
} from './lesson-content.schema';
import { ZodError } from 'zod';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new lesson with Zod validation
   */
  async create(data: unknown) {
    // Validate input with Zod
    const validatedData = this.validateCreateInput(data);

    return this.prisma.lesson.create({
      data: {
        title: validatedData.title,
        domain: validatedData.domain as Domain,
        difficulty: validatedData.difficulty as Difficulty,
        content: validatedData.content,
        xpReward: validatedData.xpReward,
        orderIndex: validatedData.orderIndex,
      },
    });
  }

  /**
   * Find all lessons with optional filters
   */
  async findAll(options?: {
    domain?: Domain;
    difficulty?: Difficulty;
    limit?: number;
    offset?: number;
  }) {
    const { domain, difficulty, limit = 20, offset = 0 } = options || {};

    return this.prisma.lesson.findMany({
      where: {
        ...(domain && { domain }),
        ...(difficulty && { difficulty }),
      },
      take: limit,
      skip: offset,
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Find a lesson by ID
   */
  async findById(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    // Validate content on read to ensure data integrity
    try {
      validateLessonContent(lesson.content);
    } catch (error) {
      console.error(`[LESSONS] Warning: Lesson ${id} has invalid content structure`);
    }

    return lesson;
  }

  /**
   * Update a lesson
   */
  async update(id: string, data: unknown) {
    await this.findById(id); // Ensure lesson exists

    const validatedData = this.validateUpdateInput(data);

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.domain && { domain: validatedData.domain as Domain }),
        ...(validatedData.difficulty && { difficulty: validatedData.difficulty as Difficulty }),
        ...(validatedData.content && { content: validatedData.content }),
        ...(validatedData.xpReward !== undefined && { xpReward: validatedData.xpReward }),
        ...(validatedData.orderIndex !== undefined && { orderIndex: validatedData.orderIndex }),
      },
    });
  }

  /**
   * Delete a lesson
   */
  async delete(id: string) {
    await this.findById(id); // Ensure lesson exists

    // Delete associated progress first
    await this.prisma.userProgress.deleteMany({
      where: { lessonId: id },
    });

    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  /**
   * Get lessons by domain with progress info
   */
  async findByDomainWithProgress(domain: Domain, userId?: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { domain },
      orderBy: { orderIndex: 'asc' },
      include: userId
        ? {
            progress: {
              where: { userId },
              select: {
                isCompleted: true,
                completedSteps: true,
              },
            },
          }
        : undefined,
    });

    return lessons.map((lesson) => ({
      ...lesson,
      userProgress: userId
        ? (lesson as typeof lesson & { progress: { isCompleted: boolean; completedSteps: number[] }[] }).progress[0] ?? null
        : null,
    }));
  }

  /**
   * Get total step count for a lesson
   */
  getStepCount(lessonContent: unknown): number {
    try {
      const content = validateLessonContent(lessonContent);
      return content.steps.length;
    } catch {
      return 0;
    }
  }

  /**
   * Validate create input with Zod
   */
  private validateCreateInput(data: unknown): CreateLessonInput {
    try {
      return CreateLessonSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      }
      throw error;
    }
  }

  /**
   * Validate update input with Zod
   */
  private validateUpdateInput(data: unknown): UpdateLessonInput {
    try {
      return UpdateLessonSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new BadRequestException({
          message: 'Validation failed',
          errors: messages,
        });
      }
      throw error;
    }
  }
}

