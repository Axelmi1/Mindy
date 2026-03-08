/**
 * @mindy/shared - Shared TypeScript types
 * 
 * This package contains all shared types between the server and mobile app.
 * Import from '@mindy/shared' in both projects.
 */

// Lesson types
export type {
  StepType,
  InfoStep,
  QuizStep,
  SwipeStep,
  SwipeSequenceStep,
  SwipeCard,
  ReorderStep,
  VisualPickStep,
  Hotspot,
  MatchPairsStep,
  MatchPairItem,
  FillBlankStep,
  CalculatorStep,
  ScenarioStep,
  ScenarioChoice,
  PricePredictionStep,
  SpeedRoundStep,
  SpeedRoundPair,
  BudgetAllocatorStep,
  BudgetCategory,
  NewsImpactStep,
  FlashcardStep,
  LessonStep,
  LessonContent,
  Domain,
  Difficulty,
  Lesson,
} from './lesson';

// User types
export type {
  User,
  UserStats,
  UserProgress,
  UserProgressWithLesson,
} from './user';

// API types
export type {
  ApiResponse,
  ApiError,
  GetLessonsQuery,
  CreateLessonDto,
  UpdateLessonDto,
  CreateUserDto,
  UpdateUserDto,
  CreateProgressDto,
  UpdateProgressDto,
  CompleteStepDto,
} from './api';

