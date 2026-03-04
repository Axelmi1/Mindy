/**
 * MINDY Lesson Content Types
 * Shared between server and mobile for type safety
 */

// ============================================================================
// Step Types
// ============================================================================

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
  showCalculator?: boolean; // Show calculator for calculation questions
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
  leftLabel: string;   // e.g., "SCAM", "BEARISH", "SELL"
  rightLabel: string;  // e.g., "SAFE", "BULLISH", "BUY"
  cards: SwipeCard[];
  timeLimit?: number;  // Optional time limit in seconds
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
  words: string[];           // Words in shuffled order
  correctOrder: number[];    // Indices representing correct order
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
  hotspots: Hotspot[];       // Clickable areas
  correctHotspotId: string;  // ID of the correct hotspot
  explanation: string;
  mindyMessage?: string;
}

export interface Hotspot {
  id: string;
  label: string;
  x: number;      // Percentage from left (0-100)
  y: number;      // Percentage from top (0-100)
  radius?: number; // Tap radius in percentage (default 10)
}

/**
 * Union type for all lesson step variants
 */
export type LessonStep =
  | InfoStep
  | QuizStep
  | SwipeStep
  | SwipeSequenceStep
  | ReorderStep
  | VisualPickStep;

/**
 * Complete lesson content structure
 */
export interface LessonContent {
  steps: LessonStep[];
}

// ============================================================================
// Enums
// ============================================================================

export type Domain = 'CRYPTO' | 'FINANCE';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// ============================================================================
// Full Lesson Type (as returned from API)
// ============================================================================

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
