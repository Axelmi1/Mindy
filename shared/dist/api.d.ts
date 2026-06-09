/**
 * MINDY API Types
 * Shared request/response types for REST API
 */
import type { Domain, Difficulty, LessonContent } from './lesson';
import type { User } from './user';
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
    username: string;
    email?: string;
    /** Pre-hashed (bcrypt) password set by the auth/register flow — never plaintext. */
    password?: string;
    preferredDomain?: 'CRYPTO' | 'FINANCE' | 'BOTH';
    userGoal?: string;
    dailyMinutes?: 5 | 10 | 15;
    reminderHour?: number;
}
export interface RegisterDto {
    email: string;
    /** Plaintext password from the client; hashed (bcrypt) before storage. */
    password: string;
    username: string;
    preferredDomain?: 'CRYPTO' | 'FINANCE' | 'BOTH';
    userGoal?: string;
    dailyMinutes?: 5 | 10 | 15;
    reminderHour?: number;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResponse {
    accessToken: string;
    user: User;
}
export interface UpdateUserDto {
    username?: string;
    xp?: number;
    level?: number;
    streak?: number;
    preferredDomain?: string;
    userGoal?: string;
    dailyMinutes?: 5 | 10 | 15;
    reminderHour?: number;
    hasSeenInvitePrompt?: boolean;
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
//# sourceMappingURL=api.d.ts.map