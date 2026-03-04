/**
 * MINDY Lesson Content Types
 * Shared between server and mobile for type safety
 */
export type StepType = 'info' | 'quiz' | 'swipe' | 'swipe_sequence' | 'reorder' | 'visual_pick';
/**
 * Informational step - displays content with optional Mindy message
 */
export interface InfoStep {
    type: 'info';
    title: string;
    content: string;
    mindyMessage?: string;
}
/**
 * Quiz step - multiple choice question
 */
export interface QuizStep {
    type: 'quiz';
    question: string;
    options: string[];
    correctIndex: number;
    mindyHint?: string;
    showCalculator?: boolean;
}
/**
 * Swipe step - true/false statement validation
 */
export interface SwipeStep {
    type: 'swipe';
    statement: string;
    isCorrect: boolean;
    explanation: string;
}
/**
 * Swipe Sequence step - rapid fire swipe cards (Trading Swipe)
 * User swipes cards left or right to categorize them quickly
 */
export interface SwipeSequenceStep {
    type: 'swipe_sequence';
    title: string;
    instruction: string;
    leftLabel: string;
    rightLabel: string;
    cards: SwipeCard[];
    timeLimit?: number;
    mindyMessage?: string;
}
export interface SwipeCard {
    id: string;
    content: string;
    correctDirection: 'left' | 'right';
    explanation?: string;
}
/**
 * Reorder step - drag and drop words to form correct sequence
 * User rearranges words/tokens to build a phrase or code line
 */
export interface ReorderStep {
    type: 'reorder';
    title: string;
    instruction: string;
    words: string[];
    correctOrder: number[];
    hint?: string;
    mindyMessage?: string;
}
/**
 * Visual Pick step - tap on correct area of an image (Chart Analyzer)
 * User must identify a specific point on a visual
 */
export interface VisualPickStep {
    type: 'visual_pick';
    title: string;
    instruction: string;
    imageUrl: string;
    hotspots: Hotspot[];
    correctHotspotId: string;
    explanation: string;
    mindyMessage?: string;
}
export interface Hotspot {
    id: string;
    label: string;
    x: number;
    y: number;
    radius?: number;
}
/**
 * Union type for all lesson step variants
 */
export type LessonStep = InfoStep | QuizStep | SwipeStep | SwipeSequenceStep | ReorderStep | VisualPickStep;
/**
 * Complete lesson content structure
 */
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
//# sourceMappingURL=lesson.d.ts.map