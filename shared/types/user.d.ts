export interface User {
    id: string;
    email: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    lastActiveAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface UserStats {
    xp: number;
    level: number;
    streak: number;
    lessonsCompleted: number;
    totalLessons: number;
}
export interface UserProgress {
    id: string;
    userId: string;
    lessonId: string;
    completedSteps: number[];
    isCompleted: boolean;
}
export interface UserProgressWithLesson extends UserProgress {
    lesson: {
        id: string;
        title: string;
        domain: string;
        xpReward: number;
    };
}
