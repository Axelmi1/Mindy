/**
 * @mindy/shared - Shared TypeScript types
 *
 * This package contains all shared types between the server and mobile app.
 * Import from '@mindy/shared' in both projects.
 */
export type { StepType, InfoStep, QuizStep, SwipeStep, SwipeSequenceStep, SwipeCard, ReorderStep, VisualPickStep, Hotspot, LessonStep, LessonContent, Domain, Difficulty, Lesson, } from './lesson';
export type { User, UserStats, UserProgress, UserProgressWithLesson, } from './user';
export type { ApiResponse, ApiError, GetLessonsQuery, CreateLessonDto, UpdateLessonDto, CreateUserDto, UpdateUserDto, CreateProgressDto, UpdateProgressDto, CompleteStepDto, } from './api';
//# sourceMappingURL=index.d.ts.map