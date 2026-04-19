# Onboarding Redesign — Design Spec

**Date:** 2026-04-19
**Status:** Approved (brainstorming) — pending implementation plan
**Author:** Axel Misson + Claude

## 1. Context & Goals

The current onboarding lives in a single ~1600-line file (`mobile/app/onboarding/index.tsx`) with an 11-step state-machine driven by a giant `if (step === '...')` switch. It works, but it has three problems:

1. **Ungovernable** — one file, one giant state, impossible to iterate on or test step-by-step.
2. **Honesty and UX issues** — fake "2M learners" stats, a `dailyTime` choice that's never used, demo questions that stay crypto-only even if the user chose Finance, and an "invite friends" screen positioned before the user has experienced any real value.
3. **Visual identity** — the current "coder vibe" terminal aesthetic doesn't match the positioning ("Duolingo for crypto & finance"). The mascot "Mindy" exists as a text-only terminal entity with no visual presence.

**Goal:** rebuild the onboarding with (a) a modular component architecture, (b) a Duolingo-style playful visual direction, (c) a real animated mascot, (d) the 8 flow fixes we aligned on, and (e) a magic-link email as an optional lightweight auth layer — while keeping the overall 11-step flow arc intact.

**Non-goals (explicitly out of scope):**

- Full email+password authentication system (separate future project)
- Rewriting the lessons / main-app screens
- Migrating existing users in the DB
- Localization beyond the current mix of FR/EN copy
- Changing the backend modules other than adding what the onboarding needs

## 2. Flow — 12 steps

The new flow keeps the same arc (hook → personalize → demo → convert → setup) but adds one new "personality" step, replaces the username-only signup with a username + optional email signup, adds a notifications-permission step, and moves invite-friends out of the onboarding altogether.

| # | Step id | Action | Status |
|---|---------|--------|--------|
| 01 | `welcome` | Logo, Mindy visible (hype), 3 honest value-props, CTA | **FIX** |
| 02 | `domain` | Crypto / Finance / Both | unchanged |
| 03 | `goal` | Start investing / Basics / Career / Curious | unchanged |
| 04 | `time` | 5 / 10 / 15 min/day → persisted as `dailyMinutes` | **FIX** |
| 05 | `mindy_intro` | Mindy introduces herself via typing animation | **NEW** |
| 06 | `demo_intro` | "Let's try 3 questions" | unchanged |
| 07 | `demo_q1` | Domain-aware question 1 | **FIX** |
| 08 | `demo_q2` | Domain-aware question 2 | **FIX** |
| 09 | `demo_q3` | Domain-aware question 3 | **FIX** |
| 10 | `results` | Score + XP earned + Mindy (hype/neutral) | unchanged |
| 11 | `signup` | Username required + email optional (magic link in background) | **FIX** |
| 12 | `notifications` | Permission + reminder hour picker, skip possible | **NEW** |

**Post-onboarding** (out of this file's scope, but in this spec's scope): an `InviteFriendsModal` component is added. It is triggered once, from the lesson-completion screen of the user's first completed lesson (server-persisted flag so it only shows once).

### 2.1 Step-by-step detail

**01 · welcome** (FIX)
- Remove fake stats (`2M+ learners · 50 lessons · 4.9 rating`).
- Replace with three honest value-props as small pill-badges under the tagline: "Crypto × Finance", "5 min / day", "Interactive".
- Mindy mascot visible (neutral mood, floating idle animation).
- Primary CTA: "Get started". Secondary text button: "I already have an account".

**02 · domain** (unchanged) — Crypto / Finance / Both.

**03 · goal** (unchanged) — 4 goal options.

**04 · time** (FIX)
- Same 3 options (5 / 10 / 15 min/day).
- Choice is persisted to `User.dailyMinutes` (new column).
- Default reminder hour derived from this (e.g. 20:00) and confirmable in step 12.

**05 · mindy_intro** (NEW)
- Full-screen scene: Mindy mascot large (hype mood), typing-animation dialog bubble below her.
- Script: "Salut @{username}... Wait, t'as pas encore de pseudo. Bon, peu importe — je vais te tester vite fait. 3 questions, rien de méchant. Prêt ?" (copy TBD; final copy will land in implementation).
- CTA: "Let's go" → advances to `demo_intro`.
- Haptic on advance.

**06 · demo_intro** (unchanged) — Short "3 quick questions" intro screen.

**07-09 · demo_q1/2/3** (FIX)
- Questions are drawn from a typed bank (`data/demoQuestions.ts`) keyed by domain:
  - `CRYPTO`: current three questions (Bitcoin symbol / HODL / buy the dip).
  - `FINANCE`: three new questions (see §6.2 for content list).
  - `BOTH`: one crypto + one finance + one cross-cutting (diversification).
- Same three UI types (image choice / true-false / multiple choice).
- Feedback area shows Mindy (hype if correct, roast if wrong) alongside the explanation.

**10 · results** (unchanged structure, new visuals)
- Trophy/thumbs-up/zap icon replaced by Mindy in hype mood.
- Score and +XP block retained.
- CTA: "Save my progress" → `signup`.

**11 · signup** (FIX)
- Username input (required, same validation as today: 3-20 chars, alphanumeric + underscore).
- **Optional** email input under it with hint: "To recover your account on another device".
- If email is provided:
  - `POST /api/users` with `{ username, email, emailVerified: false }`.
  - `POST /api/auth/magic-link` fires in background (fire-and-forget from client's POV).
  - A small confirmation toast appears ("Check your inbox to confirm").
- If email is blank: current behavior (fake auto-email `{username}_{ts}@mindy.app`). `User.email` stays a non-null unique field — the auto-generated address keeps the DB schema honest; the user can later claim a real email via a future settings screen.
- User advances immediately, without waiting for email delivery.

**12 · notifications** (NEW)
- Mindy in neutral mood.
- Copy: "Want me to remind you every day?" + subcopy about streak protection.
- Time picker: 4 preset chips (morning 09:00 / lunch 12:00 / evening 20:00 / night 22:00), default is the one closest to `dailyMinutes`-derived suggestion (defaults to 20:00 if ambiguous).
- Primary CTA: "Enable reminders" → calls `expo-notifications` permission flow, stores the resulting push token via `POST /api/notifications/register`, and persists `reminderHour` via `PATCH /api/users/:id`.
- Secondary CTA: "Not now" → skip, still persists `reminderHour: null`.
- On both, onboarding completes → `router.replace('/(tabs)')`.

### 2.2 Exit behavior

- **Completion** → clears AsyncStorage key `@mindy/onboarding_state`, routes to `/(tabs)`.
- **Skip to login** (welcome only) → routes to `/login` without touching onboarding state.
- **App killed mid-flow** → on reopen, `useOnboardingStore` rehydrates from AsyncStorage, the router lands the user on their last `currentStep`.

## 3. Visual Design

### 3.1 Direction

"Playful Mascot" — a Duolingo-ish tone within the existing dark theme. The `#0D1117` background and `#39FF14` neon primary stay. What changes:

- Bigger negative space, rounded corners (16-24px), gradient accents on primary CTAs.
- Pill-shaped CTA buttons on hero screens (`borderRadius: 999`).
- Radial glow gradients on the background of mascot-focused screens (green + blue subtle wash).
- Bold, slightly chunky typography with a gradient mask on hero titles (`#39FF14 → #58A6FF`).
- Mindy mascot visible on roughly half the screens.

### 3.2 Mindy mascot

A custom anthropomorphic brain SVG with 4 moods:

| Mood | Color | Expression | Animation | Usage |
|------|-------|------------|-----------|-------|
| `neutral` | `#39FF14` green | Relaxed eyes with highlight, subtle eyebrows, calm smile | Idle float (3.5s loop, ±6px) | welcome, domain, goal, time, mindy_intro idle, notifications |
| `hype` | `#39FF14` saturated | `^_^` closed eyes, big open mouth, sparkles | Bounce + tilt (0.8s loop) | correct demo answer, results screen |
| `roast` | `#FF6B35` orange | Slanted eyebrows, half-closed smirk eyes, smirk mouth, fire accent | Idle float + slight left-tilt | wrong demo answer |
| `thinking` | `#58A6FF` blue | One raised eyebrow, eyes looking up, tight mouth, thought bubbles | Sway (2s loop) | loading states, transitions |

All moods share the same base brain silhouette. The head has two hemispheres (central divide), subtle fold details, and a soft gloss highlight. Drop-shadow glow matches mood color.

### 3.3 `MindyMascot` component

```tsx
<MindyMascot
  mood="hype"
  size={120}                 // px
  animated                   // default true; false renders static for perf
  onAnimationComplete?       // optional callback when a one-shot mood (hype bounce) finishes
/>
```

Implementation: one React Native SVG component (`react-native-svg`). Mood is a discriminated prop that swaps the face overlay. Animation is driven by `react-native-reanimated` shared values. The four face overlays live in `src/components/mindy/moods/`.

### 3.4 `MindyMessage` refactor

The existing `MindyMessage` terminal-card stays and keeps its typing animation. It gains one new optional prop:

```tsx
<MindyMessage
  message="..."
  mood="hype"
  showMascot              // new: renders <MindyMascot /> next to the terminal card
/>
```

`showMascot` is used on `mindy_intro` (mascot + typing card composite) and on demo question feedback (small 60px mascot next to the feedback explanation).

## 4. Component Architecture

### 4.1 File structure

```
mobile/app/onboarding/
├── index.tsx                     Router: reads currentStep, renders the right step, handles transitions
├── _layout.tsx                   Expo-router layout: progress bar, back-gesture handling, StatusBar
├── steps/
│   ├── WelcomeStep.tsx
│   ├── DomainStep.tsx
│   ├── GoalStep.tsx
│   ├── TimeStep.tsx
│   ├── MindyIntroStep.tsx        NEW
│   ├── DemoIntroStep.tsx
│   ├── DemoQuestionStep.tsx      generic (consumes one question from the bank)
│   ├── ResultsStep.tsx
│   ├── SignupStep.tsx            username + optional email
│   └── NotificationsStep.tsx     NEW
├── hooks/
│   ├── useOnboardingStore.ts     Zustand + persist (AsyncStorage)
│   └── useDemoQuestions.ts       domain-aware question selection
└── data/
    └── demoQuestions.ts          typed question bank (CRYPTO / FINANCE / BOTH)

mobile/src/components/mindy/      NEW module
├── MindyMascot.tsx               SVG brain with 4 moods + animations
├── moods/
│   ├── NeutralFace.tsx
│   ├── HypeFace.tsx
│   ├── RoastFace.tsx
│   └── ThinkingFace.tsx
├── MindyMessage.tsx              moved here from src/components/; extended with showMascot prop
└── index.ts                      re-exports
```

### 4.2 Step component contract

Every step is a stateless component that consumes the store and the layout:

```tsx
export function WelcomeStep() {
  const { next } = useOnboardingStore();
  return (
    <OnboardingScreen>   {/* shared layout: padding, footer slot, safe-area */}
      {/* ...content... */}
      <PrimaryButton onPress={next}>Get started</PrimaryButton>
    </OnboardingScreen>
  );
}
```

Rules:

- A step never navigates by itself (no `router.push` / `router.replace`). It only calls `next()`, `back()`, or `goTo(stepId)` from the store.
- A step never persists to the backend directly for onboarding-only state — it writes to the store; the store persists via its middleware, and a `finalize()` function called by the last step flushes to the API.
- `DemoQuestionStep` takes the question as a prop (or reads the current question index from the store) so it's re-usable across Q1/Q2/Q3.

### 4.3 Router (`index.tsx`)

```tsx
export default function OnboardingScreen() {
  const { currentStep } = useOnboardingStore();
  return (
    <Animated.View key={currentStep} entering={SlideInRight} exiting={SlideOutLeft}>
      {renderStep(currentStep)}
    </Animated.View>
  );
}
```

Target size: ~80 lines. Its only jobs are picking the step and animating transitions.

### 4.4 Zustand store

```ts
type StepId =
  | 'welcome' | 'domain' | 'goal' | 'time'
  | 'mindy_intro' | 'demo_intro'
  | 'demo_q1' | 'demo_q2' | 'demo_q3'
  | 'results' | 'signup' | 'notifications';

const STEP_ORDER: StepId[] = [
  'welcome', 'domain', 'goal', 'time',
  'mindy_intro', 'demo_intro',
  'demo_q1', 'demo_q2', 'demo_q3',
  'results', 'signup', 'notifications',
];

interface OnboardingState {
  // Flow
  currentStep: StepId;            // STEP_ORDER is a module constant, not state

  // Choices
  domain: 'CRYPTO' | 'FINANCE' | 'BOTH' | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;

  // Demo
  demoScore: number;
  demoAnswers: { questionId: string; correct: boolean }[];

  // Auth
  username: string;
  email: string | null;

  // Notifications
  notificationsEnabled: boolean;
  reminderHour: number | null;    // 0-23

  // Actions
  goTo: (step: StepId) => void;
  next: () => void;
  back: () => void;
  setChoice: <K extends keyof Choices>(key: K, value: Choices[K]) => void;
  recordDemoAnswer: (questionId: string, correct: boolean) => void;
  finalize: () => Promise<void>;  // flush to API, clear store, navigate away
  reset: () => void;
}
```

Persisted with Zustand's `persist` middleware against AsyncStorage key `@mindy/onboarding_state`. On `finalize()` success, the store is reset and the key removed.

### 4.5 Demo-questions data shape

```ts
type DemoQuestion =
  | { id: string; type: 'image_choice'; question: string; options: { id: string; label: string; isCorrect: boolean }[]; explanation: string }
  | { id: string; type: 'true_false'; question: string; correctAnswer: boolean; explanation: string }
  | { id: string; type: 'choice'; question: string; options: { id: string; label: string; isCorrect: boolean }[]; explanation: string };

export const demoQuestions: Record<'CRYPTO' | 'FINANCE' | 'BOTH', DemoQuestion[]> = { ... };
```

`useDemoQuestions(domain)` returns exactly 3 questions for the active domain. For `BOTH`, it returns one crypto, one finance, one cross-cutting question (hardcoded order).

## 5. Data Flow

### 5.1 During onboarding

- Choices live in the Zustand store only. No backend calls between steps except the background magic-link fire-and-forget on step 11.
- AsyncStorage is written by the `persist` middleware automatically on every state change.

### 5.2 At finalize

Called from `NotificationsStep` on both "Enable" and "Not now":

1. `POST /api/users` with `{ username, email? }` (existing endpoint, now accepts optional email).
2. `PATCH /api/users/:id` with `{ preferredDomain, userGoal, dailyMinutes, reminderHour? }`.
3. If notifications enabled: `POST /api/notifications/register` with the Expo push token.
4. If email provided: `POST /api/auth/magic-link` with `{ userId, email }` (fire-and-forget, errors swallowed and logged).
5. Store AsyncStorage `@mindy/user_id` + `@mindy/username` (keeps parity with existing `useUser` hook).
6. Clear `@mindy/onboarding_state`.
7. `router.replace('/(tabs)')`.

Any failure on steps 1-2 halts the flow and surfaces an error toast. Steps 3-4 are best-effort and non-blocking.

### 5.3 Magic-link redemption

- User clicks the link in their email → opens the app via deep link `mindy://auth/verify/{token}`.
- A new route `mobile/app/auth/verify/[token].tsx` is created (outside onboarding dir).
- It calls `GET /api/auth/verify/:token`. On success, backend sets `User.emailVerified = true` and returns the user. Screen shows a success confirmation and routes to `/(tabs)`.
- On failure (expired / invalid token), shows a "link expired" screen with "resend" CTA.

## 6. Backend Changes

### 6.1 Prisma schema deltas

```prisma
model User {
  // ...existing fields...
  dailyMinutes  Int?      // 5 | 10 | 15
  reminderHour  Int?      // 0-23
  emailVerified Boolean   @default(false)

  magicLinks MagicLinkToken[]
}

model MagicLinkToken {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  email     String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("magic_link_tokens")
}
```

Applied at Render deploy via the existing `prisma db push --accept-data-loss` build step — acceptable because `dailyMinutes`, `reminderHour`, and `emailVerified` have safe defaults for existing rows.

### 6.2 New REST endpoints

**POST /api/auth/magic-link** — body `{ userId: string; email: string }`.
- Validates email format (Zod).
- Generates a 32-byte hex token with 15-minute expiry.
- Invalidates any active token for this `(userId, email)` pair before creating the new one.
- Sends email via Resend with the link `mindy://auth/verify/{token}` (fallback HTTPS URL for web clients: `https://mindy.app/auth/verify/{token}`).
- Returns `{ success: true }` or `{ success: false, reason }` (never leaks whether the user exists).
- Rate limit: `strict` throttler (20/min).

**GET /api/auth/verify/:token** — path param `token`.
- Looks up `MagicLinkToken` by token.
- Rejects if `expiresAt < now` or `usedAt` is set.
- Marks token used (`usedAt = now()`), sets `User.email = token.email`, `User.emailVerified = true`.
- Returns the updated user.
- Rate limit: `default` throttler.

### 6.3 Endpoint extensions

- **POST /api/users** — accepts optional `email`. If present, stored as-is (not the auto-generated fake one).
- **PATCH /api/users/:id** — accepts `dailyMinutes` (enum 5/10/15, nullable) and `reminderHour` (0-23, nullable) on top of existing fields.

### 6.4 Email provider

Use **Resend** (`resend` npm package). Secret added to Render: `RESEND_API_KEY`. Dev-mode fallback: if `RESEND_API_KEY` is unset and `NODE_ENV !== 'production'`, log the would-be email body (including the link) to stdout instead of calling the API — this keeps local dev frictionless.

Email template is a single simple HTML string with the neon-green Mindy branding and a big "Verify" button linking to the deep-link URL.

## 7. Invite-friends Relocation

- Remove the `invite_friend` step from the onboarding file.
- Add a `InviteFriendsPrompt` component at `mobile/src/components/friends/InviteFriendsPrompt.tsx` with the existing referral-code copy.
- Backend: add a boolean `User.hasSeenInvitePrompt` (default false). Set via `PATCH /api/users/:id` when the component dismisses.
- Trigger: the lesson-completion screen checks `!user.hasSeenInvitePrompt && user.completedLessonsCount === 1`, and if true shows the prompt as a modal after confetti.
- Skip/dismiss both mark the flag; the prompt never re-appears.

The completed-lessons count already exists via `/api/users/:id/stats`.

## 8. Error Handling

- **Network failure during finalize** → toast "Couldn't save your setup, try again" + keep the store intact (no navigation). A "Retry" CTA on the notifications step re-runs `finalize()`.
- **Email send failure (Resend 5xx)** → backend logs to console, returns 202 Accepted. Client never sees the failure, proceeds normally. User can re-request a magic link from the future settings screen.
- **Expired magic link** → verify endpoint returns 410 Gone. Client shows "link expired" screen with "resend" button.
- **Notifications permission denied** → treat as skip: persist `notificationsEnabled=false, reminderHour=null` and advance. No error shown.
- **User closes app mid-flow** → state is persisted via AsyncStorage `persist` middleware. On reopen, `useOnboardingStore` rehydrates and renders the step that was active.
- **AsyncStorage corrupted** → Zustand `persist` middleware returns its `partialize` default and the user restarts from `welcome`. No crash.

## 9. Testing Strategy

### 9.1 Unit (Jest)

- `useOnboardingStore` — state transitions, persist/rehydrate, finalize calls.
- `useDemoQuestions(domain)` — returns the right set, count is always 3.
- `demoQuestions.ts` — each bank has exactly 3 questions with valid shapes (Zod validation).

### 9.2 Component (React Native Testing Library)

- Each step renders without crashing with a mocked store.
- `WelcomeStep` calls `next()` on CTA press.
- `DomainStep` updates `domain` in the store via `setChoice`.
- `DemoQuestionStep` records a correct answer and advances after feedback.
- `SignupStep` validates the username (length, charset) and does not require email.
- `NotificationsStep` calls the expo-notifications permission API once and persists the result.
- `MindyMascot` renders each of the 4 moods without error.

### 9.3 Backend (Jest)

- `POST /api/auth/magic-link` — happy path, duplicate invalidation, rate limiting.
- `GET /api/auth/verify/:token` — happy path, expired, already used.
- Existing `users` and `notifications` tests extended for the new fields.

### 9.4 Manual

- Full flow walk-through on iOS + Android via Expo Go: Crypto path, Finance path, Both path.
- Kill-and-reopen during each step → state resumes.
- Magic link email delivery (Resend + real inbox) → click link → verify.
- Notifications permission denied → flow still completes.
- Cold-start after completion → lands on `/(tabs)`, not on onboarding.

## 10. Rollout

This replaces the current onboarding entirely. Feature-flagging is unnecessary at this scale (school project, zero production users for the new flow). Shipping is one git push to `main` which triggers Render backend deploy + EAS Update mobile OTA.

## 11. Deferred to Implementation

Not open questions — just content details that don't require design alignment:

- Final copy for `MindyIntroStep` typing dialog (bilingual FR/EN mix consistent with the rest of the app).
- Finance-domain demo question bank (3 questions: concept, true/false, multiple choice).
- Exact email HTML template for the magic-link message.
- Precise hex values for the gradient mask on hero titles.
