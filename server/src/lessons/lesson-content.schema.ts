import { z } from 'zod';

// ============================================================================
// Step Type Schemas
// ============================================================================

/**
 * Info step - displays educational content with optional Mindy message
 */
const InfoStepSchema = z.object({
  type: z.literal('info'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  mindyMessage: z.string().optional(),
});

/**
 * Quiz step - multiple choice question
 */
const QuizStepSchema = z.object({
  type: z.literal('quiz'),
  question: z.string().min(1, 'Question is required'),
  options: z
    .array(z.string().min(1))
    .min(2, 'At least 2 options required')
    .max(4, 'Maximum 4 options allowed'),
  correctIndex: z.number().int().min(0, 'correctIndex must be non-negative'),
  mindyHint: z.string().optional(),
  showCalculator: z.boolean().optional(), // Show calculator for calculation questions
}).refine(
  (data) => data.correctIndex < data.options.length,
  { message: 'correctIndex must be within options range' }
);

/**
 * Swipe step - true/false statement validation
 */
const SwipeStepSchema = z.object({
  type: z.literal('swipe'),
  statement: z.string().min(1, 'Statement is required'),
  isCorrect: z.boolean(),
  explanation: z.string().min(1, 'Explanation is required'),
});

/**
 * Swipe Card for SwipeSequence
 */
const SwipeCardSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1, 'Card content is required'),
  correctDirection: z.enum(['left', 'right']),
  explanation: z.string().optional(),
});

/**
 * Swipe Sequence step - rapid fire swipe cards (Trading Swipe)
 */
const SwipeSequenceStepSchema = z.object({
  type: z.literal('swipe_sequence'),
  title: z.string().min(1, 'Title is required'),
  instruction: z.string().min(1, 'Instruction is required'),
  leftLabel: z.string().min(1, 'Left label is required'),
  rightLabel: z.string().min(1, 'Right label is required'),
  cards: z.array(SwipeCardSchema).min(2, 'At least 2 cards required'),
  timeLimit: z.number().int().min(5).optional(),
  mindyMessage: z.string().optional(),
});

/**
 * Reorder step - drag and drop words to form correct sequence
 */
const ReorderStepSchema = z.object({
  type: z.literal('reorder'),
  title: z.string().min(1, 'Title is required'),
  instruction: z.string().min(1, 'Instruction is required'),
  words: z.array(z.string().min(1)).min(2, 'At least 2 words required'),
  correctOrder: z.array(z.number().int().min(0)),
  hint: z.string().optional(),
  mindyMessage: z.string().optional(),
}).refine(
  (data) => data.correctOrder.length === data.words.length,
  { message: 'correctOrder must have same length as words' }
).refine(
  (data) => data.correctOrder.every(i => i >= 0 && i < data.words.length),
  { message: 'correctOrder indices must be within words range' }
);

/**
 * Hotspot for VisualPick
 */
const HotspotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  radius: z.number().min(1).max(50).optional(),
});

/**
 * Visual Pick step - tap on correct area of an image (Chart Analyzer)
 */
const VisualPickStepSchema = z.object({
  type: z.literal('visual_pick'),
  title: z.string().min(1, 'Title is required'),
  instruction: z.string().min(1, 'Instruction is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  hotspots: z.array(HotspotSchema).min(2, 'At least 2 hotspots required'),
  correctHotspotId: z.string().min(1, 'Correct hotspot ID is required'),
  explanation: z.string().min(1, 'Explanation is required'),
  mindyMessage: z.string().optional(),
}).refine(
  (data) => data.hotspots.some(h => h.id === data.correctHotspotId),
  { message: 'correctHotspotId must match a hotspot id' }
);

/**
 * Match Pairs step - connect terms to definitions
 */
const MatchPairItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

const MatchPairsStepSchema = z.object({
  type: z.literal('match_pairs'),
  pairs: z.array(MatchPairItemSchema).min(2, 'At least 2 pairs required').max(6),
  mindyMessage: z.string().optional(),
});

/**
 * Fill Blank step - complete a sentence from choices
 */
const FillBlankStepSchema = z.object({
  type: z.literal('fill_blank'),
  sentence: z.string().min(1, 'Sentence is required'),
  answer: z.string().min(1, 'Answer is required'),
  choices: z.array(z.string().min(1)).min(2).max(4),
  mindyMessage: z.string().optional(),
}).refine(
  (data) => data.choices.includes(data.answer),
  { message: 'answer must be included in choices' }
);

/**
 * Calculator step - numeric calculation with guided variables
 */
const CalculatorStepSchema = z.object({
  type: z.literal('calculator'),
  question: z.string().min(1, 'Question is required'),
  variables: z.array(z.string().min(1)),
  answer: z.number(),
  tolerance: z.number().min(0).optional(),
  unit: z.string().optional(),
  mindyMessage: z.string().optional(),
});

/**
 * Scenario step - real-life situation with choices and explanations
 */
const ScenarioChoiceSchema = z.object({
  text: z.string().min(1),
  isGood: z.boolean(),
  explanation: z.string().min(1),
});

const ScenarioStepSchema = z.object({
  type: z.literal('scenario'),
  situation: z.string().min(1, 'Situation is required'),
  choices: z.array(ScenarioChoiceSchema).min(2).max(4),
  mindyMessage: z.string().optional(),
});

/**
 * Price Prediction step - sparkline chart, user predicts up or down
 */
const CandleSchema = z.object({
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
});

const PricePredictionStepSchema = z.object({
  type: z.literal('price_prediction'),
  question: z.string().min(1, 'Question is required'),
  candles: z.array(CandleSchema).min(3, 'At least 3 candles required'),
  correctAnswer: z.enum(['up', 'down']),
  explanation: z.string().min(1, 'Explanation is required'),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
});

/**
 * Speed Round step - rapid-fire true/false with combo
 */
const SpeedRoundPairSchema = z.object({
  statement: z.string().min(1),
  isTrue: z.boolean(),
});

const SpeedRoundStepSchema = z.object({
  type: z.literal('speed_round'),
  title: z.string().min(1, 'Title is required'),
  pairs: z.array(SpeedRoundPairSchema).min(4, 'At least 4 pairs required'),
  timeLimitSeconds: z.number().int().min(10).max(120),
});

/**
 * Budget Allocator step - slider-based budget distribution
 */
const BudgetCategorySchema = z.object({
  label: z.string().min(1),
  icon: z.string().min(1),
  targetPercent: z.number().min(0).max(100),
  minPercent: z.number().min(0).max(100),
  maxPercent: z.number().min(0).max(100),
});

const BudgetAllocatorStepSchema = z.object({
  type: z.literal('budget_allocator'),
  totalBudget: z.number().min(1),
  categories: z.array(BudgetCategorySchema).min(2, 'At least 2 categories required'),
  explanation: z.string().min(1, 'Explanation is required'),
});

/**
 * News Impact step - headline analysis
 */
const NewsImpactStepSchema = z.object({
  type: z.literal('news_impact'),
  headline: z.string().min(1, 'Headline is required'),
  source: z.string().min(1, 'Source is required'),
  date: z.string().min(1, 'Date is required'),
  correctImpact: z.enum(['bullish', 'bearish', 'neutral']),
  explanation: z.string().min(1, 'Explanation is required'),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
});

/**
 * Flashcard step - 3D flip card
 */
const FlashcardStepSchema = z.object({
  type: z.literal('flashcard'),
  front: z.string().min(1, 'Front text is required'),
  back: z.string().min(1, 'Back text is required'),
  category: z.string().min(1, 'Category is required'),
});

/**
 * Word Scramble step - unscramble letters to form a term
 */
const WordScrambleStepSchema = z.object({
  type: z.literal('word_scramble'),
  word: z.string().min(1, 'Word is required'),
  hint: z.string().min(1, 'Hint is required'),
  scrambled: z.array(z.string().min(1)).min(2, 'At least 2 letters required'),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
});

/**
 * Drag Sort step - sort cards in correct order
 */
const DragSortItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().min(1),
  value: z.string().optional(),
});

const DragSortStepSchema = z.object({
  type: z.literal('drag_sort'),
  question: z.string().min(1, 'Question is required'),
  items: z.array(DragSortItemSchema).min(3, 'At least 3 items required').max(7),
  correctOrder: z.array(z.number().int().min(0)),
  explanation: z.string().min(1, 'Explanation is required'),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
}).refine(
  (data) => data.correctOrder.length === data.items.length,
  { message: 'correctOrder must have same length as items' }
);

/**
 * Spot the Scam step - identify the fraudulent card
 */
const ScamCardSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['tweet', 'email', 'site']),
  content: z.string().min(1),
  sender: z.string().min(1),
  isScam: z.boolean(),
  redFlags: z.array(z.string()).optional(),
});

const SpotTheScamStepSchema = z.object({
  type: z.literal('spot_the_scam'),
  question: z.string().min(1, 'Question is required'),
  cards: z.array(ScamCardSchema).min(2, 'At least 2 cards required').max(4),
  explanation: z.string().min(1, 'Explanation is required'),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
}).refine(
  (data) => data.cards.filter(c => c.isScam).length === 1,
  { message: 'Exactly one card must be a scam' }
);

/**
 * Connect Dots step - match terms to definitions
 */
const ConnectDotsPairSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

const ConnectDotsStepSchema = z.object({
  type: z.literal('connect_dots'),
  pairs: z.array(ConnectDotsPairSchema).min(2, 'At least 2 pairs required').max(5),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
});

/**
 * Timeline Builder step - place events in chronological order
 */
const TimelineEventSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  year: z.string().min(1),
  emoji: z.string().min(1),
});

const TimelineBuilderStepSchema = z.object({
  type: z.literal('timeline_builder'),
  title: z.string().min(1, 'Title is required'),
  events: z.array(TimelineEventSchema).min(3, 'At least 3 events required').max(8),
  explanation: z.string().min(1, 'Explanation is required'),
  mindyMessage: z.string().min(1, 'Mindy message is required'),
});

/**
 * Union of all step types
 * Note: Using z.union instead of z.discriminatedUnion because some schemas
 * use .refine() which returns ZodEffects, incompatible with discriminatedUnion
 */
export const LessonStepSchema = z.union([
  InfoStepSchema,
  QuizStepSchema,
  SwipeStepSchema,
  SwipeSequenceStepSchema,
  ReorderStepSchema,
  VisualPickStepSchema,
  MatchPairsStepSchema,
  FillBlankStepSchema,
  CalculatorStepSchema,
  ScenarioStepSchema,
  PricePredictionStepSchema,
  SpeedRoundStepSchema,
  BudgetAllocatorStepSchema,
  NewsImpactStepSchema,
  FlashcardStepSchema,
  WordScrambleStepSchema,
  DragSortStepSchema,
  SpotTheScamStepSchema,
  ConnectDotsStepSchema,
  TimelineBuilderStepSchema,
]);

// ============================================================================
// Full Lesson Content Schema
// ============================================================================

/**
 * Complete lesson content structure
 */
export const LessonContentSchema = z.object({
  steps: z
    .array(LessonStepSchema)
    .min(1, 'Lesson must have at least one step'),
});

// ============================================================================
// DTO Schemas
// ============================================================================

/**
 * Schema for creating a new lesson
 */
export const CreateLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  domain: z.enum(['CRYPTO', 'FINANCE', 'TRADING']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  content: LessonContentSchema,
  xpReward: z.number().int().min(0).default(50),
  orderIndex: z.number().int().min(0).default(0),
});

/**
 * Schema for updating an existing lesson
 */
export const UpdateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  domain: z.enum(['CRYPTO', 'FINANCE', 'TRADING']).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  content: LessonContentSchema.optional(),
  xpReward: z.number().int().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LessonContent = z.infer<typeof LessonContentSchema>;
export type LessonStep = z.infer<typeof LessonStepSchema>;
export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validates lesson content and returns a typed result
 * @throws {ZodError} if validation fails
 */
export function validateLessonContent(content: unknown): LessonContent {
  return LessonContentSchema.parse(content);
}

/**
 * Safe validation that returns success/error result
 */
export function safeParseLessonContent(content: unknown) {
  return LessonContentSchema.safeParse(content);
}
