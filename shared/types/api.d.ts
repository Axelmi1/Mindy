import type { Domain, Difficulty, LessonContent } from './lesson';
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface ApiError {
    success: false;
    error: string;
    statusCode: number;
    details?: Record<string, string[]>;
}
export interface GetLessonsQuery {
    domain?: Domain;
    difficulty?: Difficulty;
    limit?: number;
    offset?: number;
}
export interface CreateLessonDto {
    title: string;
    domain: Domain;
    difficulty: Difficulty;
    content: LessonContent;
    xpReward?: number;
    orderIndex?: number;
}
export interface UpdateLessonDto {
    title?: string;
    domain?: Domain;
    difficulty?: Difficulty;
    content?: LessonContent;
    xpReward?: number;
    orderIndex?: number;
}
export interface CreateUserDto {
    email: string;
    username: string;
}
export interface UpdateUserDto {
    username?: string;
    xp?: number;
    level?: number;
    streak?: number;
}
export interface CreateProgressDto {
    userId: string;
    lessonId: string;
}
export interface UpdateProgressDto {
    completedSteps?: number[];
    isCompleted?: boolean;
}
export interface CompleteStepDto {
    stepIndex: number;
}
