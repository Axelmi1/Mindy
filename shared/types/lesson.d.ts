export type StepType = 'info' | 'quiz' | 'swipe';
export interface InfoStep {
    type: 'info';
    title: string;
    content: string;
    mindyMessage?: string;
}
export interface QuizStep {
    type: 'quiz';
    question: string;
    options: string[];
    correctIndex: number;
    mindyHint?: string;
}
export interface SwipeStep {
    type: 'swipe';
    statement: string;
    isCorrect: boolean;
    explanation: string;
}
export type LessonStep = InfoStep | QuizStep | SwipeStep;
export interface LessonContent {
    steps: LessonStep[];
}
export type Domain = 'CRYPTO' | 'FINANCE';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export interface Lesson {
    id: string;
    title: string;
    domain: Domain;
    difficulty: Difficulty;
    content: LessonContent;
    xpReward: number;
    orderIndex: number;
    createdAt: string;
}
