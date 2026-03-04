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
  domain: z.enum(['CRYPTO', 'FINANCE']),
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
  domain: z.enum(['CRYPTO', 'FINANCE']).optional(),
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
