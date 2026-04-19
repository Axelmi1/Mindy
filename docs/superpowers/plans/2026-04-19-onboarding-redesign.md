# Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `mobile/app/onboarding` as a modular 12-step flow with a new animated mascot, domain-aware demo, optional magic-link email auth, and a notifications-permission step, while moving invite-friends out of onboarding to post-first-lesson.

**Architecture:** One file per step, shared Zustand store with AsyncStorage persist, expo-router layout for transitions + progress bar. New reusable `MindyMascot` component module with 4 SVG moods. Backend adds two new columns on `User`, a new `MagicLinkToken` model, a magic-link controller (Resend email), and extended `POST /users` + `PATCH /users/:id` endpoints.

**Tech Stack:** Expo 54, React Native 0.81, expo-router v6, Zustand (new), react-native-svg (new explicit dep), react-native-reanimated v4, NestJS 10, Prisma 5, Resend (new, `resend` npm package), expo-notifications.

**Design spec:** `docs/superpowers/specs/2026-04-19-onboarding-redesign-design.md` — read this first; it contains the mood palette, flow detail, and error-handling contracts that individual tasks reference.

**Environment note:** Mobile currently has no Jest setup. Task 10 adds a minimal Jest config scoped to pure-TS store/data tests (not component rendering). Backend (`server/`) already has Jest — existing tests still pass.

**Git strategy:** Frequent commits — after every task. Work directly on `main` is acceptable for this single-developer school project; every push to `main` triggers Render redeploy of the API and GitHub Actions EAS Update of the mobile bundle.

**`MindyMessage` path:** Stays at `mobile/src/components/MindyMessage.tsx` (20+ consumers). Spec mentioned relocating it; we keep it in place to avoid rewriting imports and just extend it with a `showMascot` prop. New mascot module lives at `mobile/src/components/mindy/`.

---

## Phase 0 · Dependencies

### Task 1: Add dependencies

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json` (auto)
- Modify: `server/package.json`
- Modify: `server/package-lock.json` (auto)

- [ ] **Step 1: Install mobile deps**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npm install zustand react-native-svg --legacy-peer-deps
```

Expected: new lines in `package.json` dependencies for `zustand` and `react-native-svg`. `package-lock.json` regenerates.

- [ ] **Step 2: Install server deps**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npm install resend --legacy-peer-deps
```

Expected: new line in `package.json` dependencies for `resend`.

- [ ] **Step 3: Verify mobile typecheck passes**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0, no new errors.

- [ ] **Step 4: Verify server builds**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npm run build
```

Expected: exit 0, dist/ regenerates.

- [ ] **Step 5: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/package.json mobile/package-lock.json server/package.json server/package-lock.json
git commit -m "chore: add zustand, react-native-svg, resend deps"
```

---

## Phase 1 · Backend foundation

### Task 2: Prisma schema deltas

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add fields to User**

Open `server/prisma/schema.prisma`, find the `User` model, and add these fields (right after `preferredDomain` and `userGoal`):

```prisma
  dailyMinutes    Int?
  reminderHour    Int?
  emailVerified   Boolean                  @default(false)
  hasSeenInvitePrompt Boolean              @default(false)
  magicLinks      MagicLinkToken[]
```

- [ ] **Step 2: Add MagicLinkToken model**

At the end of the schema file (after the last existing model), add:

```prisma
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

- [ ] **Step 3: Regenerate Prisma client**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npx prisma generate
```

Expected: `✔ Generated Prisma Client` in output.

- [ ] **Step 4: Apply schema to local DB (if you have one) or skip**

If you have a local Postgres running (see `server/docker-compose.yml`): `npx prisma db push`. If not, skip — Render will run `prisma db push --accept-data-loss` at deploy.

- [ ] **Step 5: Verify server still builds**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npm run build
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add server/prisma/schema.prisma
git commit -m "feat(server): add dailyMinutes, reminderHour, MagicLinkToken schema"
```

### Task 3: Extend users endpoints

**Files:**
- Modify: `server/src/users/users.service.ts`
- Modify: `server/src/users/users.controller.ts`
- Modify: `server/src/users/dto/*.ts` (whatever create/update DTOs exist — inspect first)
- Test: `server/src/users/users.service.spec.ts` (create if missing)

- [ ] **Step 1: Inspect current users module**

Run:
```bash
ls /Users/axelmisson/mindy_final/server/src/users/
```

Read `users.service.ts`, `users.controller.ts`, and any `dto/` files. Note the existing shape of `CreateUserDto` and `UpdateUserDto`.

- [ ] **Step 2: Extend CreateUserDto to accept optional email and preferences**

Locate the create DTO (e.g. `server/src/users/dto/create-user.dto.ts` or inline in service). It currently requires `email` and `username`. Make `email` optional (still unique in DB — we auto-generate when missing). Add `preferredDomain`, `userGoal`, `dailyMinutes`, `reminderHour` as optional.

Example (adapt to your actual DTO style, Zod or class-validator):

```ts
// server/src/users/dto/create-user.dto.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().optional(),
  preferredDomain: z.enum(['CRYPTO', 'FINANCE', 'BOTH']).optional(),
  userGoal: z.string().optional(),
  dailyMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

- [ ] **Step 3: Extend UpdateUserDto similarly**

Add `dailyMinutes`, `reminderHour`, `hasSeenInvitePrompt` as optional to the update DTO.

- [ ] **Step 4: Update the service to use the new fields**

In `users.service.ts`, the existing `create()` method probably does:
```ts
prisma.user.create({ data: { email, username, ... } })
```

Make it fall back to the auto-generated email when the DTO's `email` is missing:
```ts
async create(dto: CreateUserDto) {
  const ts = Date.now();
  const finalEmail = dto.email ?? `${dto.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${ts}@mindy.app`;
  return this.prisma.user.create({
    data: {
      username: dto.username,
      email: finalEmail,
      preferredDomain: dto.preferredDomain ?? null,
      userGoal: dto.userGoal ?? null,
      dailyMinutes: dto.dailyMinutes ?? null,
      reminderHour: dto.reminderHour ?? null,
    },
  });
}
```

And in `update()`, accept the new optional fields and merge them into the Prisma update.

- [ ] **Step 5: Write the failing test**

Create/extend `server/src/users/users.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService.create', () => {
  let service: UsersService;
  let prisma: { user: { create: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { create: jest.fn((args) => Promise.resolve({ id: 'abc', ...args.data })) } };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('auto-generates email when missing', async () => {
    await service.create({ username: 'satoshi' });
    const arg = prisma.user.create.mock.calls[0][0];
    expect(arg.data.email).toMatch(/^satoshi_\d+@mindy\.app$/);
  });

  it('uses provided email when present', async () => {
    await service.create({ username: 'alice', email: 'alice@example.com' });
    const arg = prisma.user.create.mock.calls[0][0];
    expect(arg.data.email).toBe('alice@example.com');
  });

  it('persists dailyMinutes and reminderHour', async () => {
    await service.create({ username: 'bob', dailyMinutes: 10, reminderHour: 20 });
    const arg = prisma.user.create.mock.calls[0][0];
    expect(arg.data.dailyMinutes).toBe(10);
    expect(arg.data.reminderHour).toBe(20);
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npx jest users.service.spec -t "UsersService.create"
```

Expected: 3 passing.

- [ ] **Step 7: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add server/src/users/
git commit -m "feat(server): extend users endpoints for optional email + onboarding prefs"
```

### Task 4: Create Resend email provider service

**Files:**
- Create: `server/src/notifications/email.service.ts`
- Modify: `server/src/notifications/notifications.module.ts` (register the provider)

- [ ] **Step 1: Create the service**

Create `server/src/notifications/email.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend | null;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    this.client = key ? new Resend(key) : null;
  }

  async sendMagicLink(email: string, link: string): Promise<void> {
    const html = `
      <div style="font-family:sans-serif;background:#0D1117;color:#E6EDF3;padding:32px;border-radius:12px;max-width:480px;margin:auto">
        <h1 style="color:#39FF14">Verify your Mindy account</h1>
        <p>Click the button below to link this email to your account. The link expires in 15 minutes.</p>
        <a href="${link}" style="display:inline-block;background:#39FF14;color:#0D1117;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:700">Verify</a>
        <p style="color:#8B949E;font-size:12px;margin-top:24px">If you didn't ask for this, you can ignore this email.</p>
      </div>
    `;

    if (!this.client) {
      this.logger.warn(`[DEV] Would send magic link to ${email}: ${link}`);
      return;
    }

    const { error } = await this.client.emails.send({
      from: 'Mindy <noreply@mindy.app>',
      to: email,
      subject: 'Verify your Mindy account',
      html,
    });
    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw new Error('Failed to send email');
    }
  }
}
```

- [ ] **Step 2: Register in notifications module**

Open `server/src/notifications/notifications.module.ts`. Add `EmailService` to the providers array and export it:

```ts
providers: [NotificationsService, EmailService, /* ...existing... */],
exports: [NotificationsService, EmailService],
```

Add the import: `import { EmailService } from './email.service';`

- [ ] **Step 3: Verify server builds**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npm run build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add server/src/notifications/
git commit -m "feat(server): add EmailService using Resend with dev-log fallback"
```

### Task 5: Magic-link auth module

**Files:**
- Create: `server/src/auth/auth.module.ts`
- Create: `server/src/auth/auth.service.ts`
- Create: `server/src/auth/auth.controller.ts`
- Create: `server/src/auth/auth.service.spec.ts`
- Modify: `server/src/app.module.ts` (register AuthModule)

- [ ] **Step 1: Create the service**

Create `server/src/auth/auth.service.ts`:

```ts
import { Injectable, NotFoundException, GoneException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const LINK_BASE = process.env.MAGIC_LINK_BASE_URL ?? 'mindy://auth/verify';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async sendMagicLink(userId: string, email: string): Promise<void> {
    // Invalidate any active token for this (userId, email) pair
    await this.prisma.magicLinkToken.updateMany({
      where: { userId, email, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await this.prisma.magicLinkToken.create({ data: { userId, email, token, expiresAt } });

    const link = `${LINK_BASE}/${token}`;
    await this.email.sendMagicLink(email, link);
  }

  async verify(token: string) {
    const record = await this.prisma.magicLinkToken.findUnique({ where: { token } });
    if (!record) throw new NotFoundException('Invalid token');
    if (record.usedAt) throw new GoneException('Token already used');
    if (record.expiresAt < new Date()) throw new GoneException('Token expired');

    const [, user] = await this.prisma.$transaction([
      this.prisma.magicLinkToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { email: record.email, emailVerified: true },
      }),
    ]);
    return user;
  }
}
```

- [ ] **Step 2: Create the controller**

Create `server/src/auth/auth.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from './auth.service';

const MagicLinkSchema = z.object({
  userId: z.string().cuid(),
  email: z.string().email(),
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('magic-link')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async sendMagicLink(@Body() body: unknown) {
    const parsed = MagicLinkSchema.parse(body);
    try {
      await this.auth.sendMagicLink(parsed.userId, parsed.email);
      return { success: true };
    } catch {
      // Don't leak whether the user exists — always return a neutral response
      return { success: true };
    }
  }

  @Get('verify/:token')
  async verify(@Param('token') token: string) {
    const user = await this.auth.verify(token);
    return { success: true, data: user };
  }
}
```

- [ ] **Step 3: Create the module**

Create `server/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 4: Register in AppModule**

Open `server/src/app.module.ts`. Add `AuthModule` to the imports array (place near other feature modules, after `FriendsModule`):

```ts
import { AuthModule } from './auth/auth.module';
// ... in imports: [ ..., AuthModule ],
```

- [ ] **Step 5: Write the failing tests**

Create `server/src/auth/auth.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { GoneException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let email: { sendMagicLink: jest.Mock };

  beforeEach(async () => {
    prisma = {
      magicLinkToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 't1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      user: { update: jest.fn().mockResolvedValue({ id: 'u1', email: 'a@b.c' }) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    email = { sendMagicLink: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('sendMagicLink', () => {
    it('generates a token and sends email', async () => {
      await service.sendMagicLink('u1', 'a@b.c');
      expect(prisma.magicLinkToken.create).toHaveBeenCalled();
      expect(email.sendMagicLink).toHaveBeenCalledWith('a@b.c', expect.stringContaining('mindy://auth/verify/'));
    });

    it('invalidates prior active tokens for same (userId,email)', async () => {
      await service.sendMagicLink('u1', 'a@b.c');
      expect(prisma.magicLinkToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1', email: 'a@b.c', usedAt: null }),
        }),
      );
    });
  });

  describe('verify', () => {
    it('throws NotFound for unknown token', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue(null);
      await expect(service.verify('bad')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Gone when already used', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1', usedAt: new Date(), expiresAt: new Date(Date.now() + 60000), userId: 'u1', email: 'a@b.c',
      });
      await expect(service.verify('used')).rejects.toBeInstanceOf(GoneException);
    });

    it('throws Gone when expired', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1', usedAt: null, expiresAt: new Date(Date.now() - 1000), userId: 'u1', email: 'a@b.c',
      });
      await expect(service.verify('old')).rejects.toBeInstanceOf(GoneException);
    });

    it('marks token used and verifies email on success', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1', usedAt: null, expiresAt: new Date(Date.now() + 60000), userId: 'u1', email: 'a@b.c',
      });
      const result = await service.verify('ok');
      expect(prisma.magicLinkToken.update).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'u1' },
        data: { email: 'a@b.c', emailVerified: true },
      }));
      expect(result).toEqual({ id: 'u1', email: 'a@b.c' });
    });
  });
});
```

- [ ] **Step 6: Run tests**

Run:
```bash
cd /Users/axelmisson/mindy_final/server && npx jest auth.service.spec
```

Expected: 5 passing.

- [ ] **Step 7: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add server/src/auth/ server/src/app.module.ts
git commit -m "feat(server): add magic-link auth endpoints + AuthService with tests"
```

---

## Phase 2 · Mindy Mascot component

### Task 6: Scaffold mascot module with neutral mood

**Files:**
- Create: `mobile/src/components/mindy/MindyMascot.tsx`
- Create: `mobile/src/components/mindy/moods/NeutralFace.tsx`
- Create: `mobile/src/components/mindy/index.ts`

- [ ] **Step 1: Create neutral face**

Create `mobile/src/components/mindy/moods/NeutralFace.tsx`:

```tsx
import React from 'react';
import { Ellipse, Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export function NeutralFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="neutralGloss" cx="0.35" cy="0.3" r="0.45">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="70" rx="35" ry="22" fill="url(#neutralGloss)" />
      <Ellipse cx="78" cy="100" rx="9" ry="11" fill="#0D1117" />
      <Ellipse cx="122" cy="100" rx="9" ry="11" fill="#0D1117" />
      <Circle cx="81" cy="96" r="3" fill="#fff" />
      <Circle cx="125" cy="96" r="3" fill="#fff" />
      <Path d="M68,84 Q 78,80 88,85" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M112,85 Q 122,80 132,84" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M85,128 Q 100,138 115,128" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </>
  );
}
```

- [ ] **Step 2: Create main MindyMascot component**

Create `mobile/src/components/mindy/MindyMascot.tsx`:

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { NeutralFace } from './moods/NeutralFace';

export type MindyMood = 'neutral' | 'hype' | 'roast' | 'thinking';

interface Props {
  mood?: MindyMood;
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

const MOOD_COLORS: Record<MindyMood, { start: string; end: string; glow: string }> = {
  neutral:  { start: '#7cff5a', end: '#1fa80a', glow: 'rgba(57,255,20,0.4)' },
  hype:     { start: '#a8ff8f', end: '#2ade0a', glow: 'rgba(57,255,20,0.65)' },
  roast:    { start: '#ff9c6b', end: '#d14e0a', glow: 'rgba(255,107,53,0.55)' },
  thinking: { start: '#8ec6ff', end: '#2570d1', glow: 'rgba(88,166,255,0.55)' },
};

export function MindyMascot({ mood = 'neutral', size = 120, animated = true, style }: Props) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    const duration = mood === 'hype' ? 400 : mood === 'thinking' ? 1000 : 1750;
    const amplitude = mood === 'hype' ? -10 : -6;
    translateY.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [animated, mood]);

  const wrapperStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const colors = MOOD_COLORS[mood];

  return (
    <View style={[{ width: size, height: (size * 210) / 200 }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, wrapperStyle]}>
        <Svg
          viewBox="0 0 200 210"
          width="100%"
          height="100%"
          style={{ shadowColor: colors.glow.replace(/rgba?\([^,]+,[^,]+,[^,]+,[^)]+\)/, colors.glow) }}
        >
          <Defs>
            <LinearGradient id={`mindy-body-${mood}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.start} />
              <Stop offset="1" stopColor={colors.end} />
            </LinearGradient>
          </Defs>
          <Path
            d="M42,100 C 28,90 28,62 55,58 C 55,33 85,25 98,42 C 108,18 148,22 150,50 C 178,55 185,85 170,102 C 185,118 175,148 150,150 C 145,170 108,175 100,158 C 90,175 65,168 62,150 C 38,148 25,115 42,100 Z"
            fill={`url(#mindy-body-${mood})`}
            stroke="#0D1117"
            strokeWidth="2.8"
          />
          <Path d="M100,38 Q 96,105 100,155" stroke="#0D1117" strokeWidth="1.8" fill="none" opacity="0.5" />
          <Path d="M58,72 Q 72,82 58,92" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          <Path d="M142,72 Q 128,82 142,92" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          <Path d="M50,118 Q 68,132 50,142" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          <Path d="M150,118 Q 132,132 150,142" stroke="#0D1117" strokeWidth="1.5" fill="none" opacity="0.4" />
          {mood === 'neutral' && <NeutralFace />}
        </Svg>
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 3: Create module index**

Create `mobile/src/components/mindy/index.ts`:

```ts
export { MindyMascot } from './MindyMascot';
export type { MindyMood } from './MindyMascot';
```

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/src/components/mindy/
git commit -m "feat(mobile): scaffold MindyMascot with neutral mood"
```

### Task 7: Add Hype mood

**Files:**
- Create: `mobile/src/components/mindy/moods/HypeFace.tsx`
- Modify: `mobile/src/components/mindy/MindyMascot.tsx`

- [ ] **Step 1: Create hype face**

Create `mobile/src/components/mindy/moods/HypeFace.tsx`:

```tsx
import React from 'react';
import { Ellipse, Path, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

export function HypeFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="hypeGloss" cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="68" rx="35" ry="22" fill="url(#hypeGloss)" />
      <Path d="M66,98 Q 78,88 90,98" stroke="#0D1117" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M110,98 Q 122,88 134,98" stroke="#0D1117" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M76,125 Q 100,152 124,125 Q 100,145 76,125 Z" fill="#0D1117" />
      <Ellipse cx="100" cy="142" rx="8" ry="4" fill="#ff6b7a" opacity="0.8" />
      <SvgText x="170" y="55" fill="#FFD700" fontSize="18" fontWeight="700">✨</SvgText>
      <SvgText x="20" y="70" fill="#FFD700" fontSize="14" fontWeight="700">✨</SvgText>
    </>
  );
}
```

- [ ] **Step 2: Wire hype into MindyMascot**

In `mobile/src/components/mindy/MindyMascot.tsx`:

1. Add import: `import { HypeFace } from './moods/HypeFace';`
2. Below the existing `{mood === 'neutral' && <NeutralFace />}` line, add: `{mood === 'hype' && <HypeFace />}`

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/src/components/mindy/
git commit -m "feat(mobile): add MindyMascot hype mood"
```

### Task 8: Add Roast mood

**Files:**
- Create: `mobile/src/components/mindy/moods/RoastFace.tsx`
- Modify: `mobile/src/components/mindy/MindyMascot.tsx`

- [ ] **Step 1: Create roast face**

Create `mobile/src/components/mindy/moods/RoastFace.tsx`:

```tsx
import React from 'react';
import { Ellipse, Path, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

export function RoastFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="roastGloss" cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="70" rx="35" ry="22" fill="url(#roastGloss)" />
      <Path d="M65,82 L 90,88" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M110,88 L 135,82" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M72,100 Q 80,106 88,100" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M112,100 Q 120,106 128,100" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M84,130 Q 100,125 112,134" stroke="#0D1117" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <SvgText x="165" y="60" fontSize="18">🔥</SvgText>
    </>
  );
}
```

- [ ] **Step 2: Wire into MindyMascot**

In `mobile/src/components/mindy/MindyMascot.tsx`:

1. Add import (next to the existing `HypeFace` import):
   ```ts
   import { RoastFace } from './moods/RoastFace';
   ```
2. Add this line right below the `{mood === 'hype' && <HypeFace />}` line:
   ```tsx
   {mood === 'roast' && <RoastFace />}
   ```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/src/components/mindy/
git commit -m "feat(mobile): add MindyMascot roast mood"
```

### Task 9: Add Thinking mood

**Files:**
- Create: `mobile/src/components/mindy/moods/ThinkingFace.tsx`
- Modify: `mobile/src/components/mindy/MindyMascot.tsx`

- [ ] **Step 1: Create thinking face**

Create `mobile/src/components/mindy/moods/ThinkingFace.tsx`:

```tsx
import React from 'react';
import { Ellipse, Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export function ThinkingFace() {
  return (
    <>
      <Defs>
        <RadialGradient id="thinkingGloss" cx="0.35" cy="0.3" r="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="80" cy="70" rx="35" ry="22" fill="url(#thinkingGloss)" />
      <Path d="M62,82 Q 78,76 90,82" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.8} />
      <Path d="M112,78 Q 122,72 132,80" stroke="#0D1117" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.8} />
      <Ellipse cx="78" cy="98" rx="9" ry="11" fill="#0D1117" />
      <Ellipse cx="122" cy="98" rx="9" ry="11" fill="#0D1117" />
      <Circle cx="81" cy="92" r="3" fill="#fff" />
      <Circle cx="125" cy="92" r="3" fill="#fff" />
      <Path d="M88,130 L 112,130" stroke="#0D1117" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="168" cy="55" r="6" fill="#58A6FF" opacity={0.8} />
      <Circle cx="180" cy="40" r="3.5" fill="#58A6FF" opacity={0.6} />
    </>
  );
}
```

- [ ] **Step 2: Wire into MindyMascot**

In `mobile/src/components/mindy/MindyMascot.tsx`:

1. Add import:
   ```ts
   import { ThinkingFace } from './moods/ThinkingFace';
   ```
2. Add this line right below the `{mood === 'roast' && <RoastFace />}` line:
   ```tsx
   {mood === 'thinking' && <ThinkingFace />}
   ```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/src/components/mindy/
git commit -m "feat(mobile): add MindyMascot thinking mood + re-export"
```

### Task 10: Extend MindyMessage with `showMascot` prop

**Files:**
- Modify: `mobile/src/components/MindyMessage.tsx`

- [ ] **Step 1: Add mascot support**

Open `mobile/src/components/MindyMessage.tsx`. Add import:

```ts
import { MindyMascot } from './mindy';
```

Extend the props interface:

```ts
interface MindyMessageProps {
  // ...existing...
  /** Render the mascot next to the message card (default false) */
  showMascot?: boolean;
  /** Mascot size in px (default 64) */
  mascotSize?: number;
}
```

In the component, accept `showMascot` and `mascotSize = 64` in the destructure, and update the return JSX to wrap the existing terminal card in a horizontal row when `showMascot` is true:

```tsx
if (showMascot) {
  return (
    <View style={styles.rowContainer}>
      <MindyMascot mood={mood} size={mascotSize} />
      <View style={styles.rowCard}>{/* existing terminal frame moved here */}</View>
    </View>
  );
}
// fall through to the existing standalone layout
```

Add the two new styles:

```ts
rowContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
rowCard: { flex: 1 },
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/src/components/MindyMessage.tsx
git commit -m "feat(mobile): extend MindyMessage with showMascot prop"
```

---

## Phase 3 · Onboarding foundations

### Task 11: Add Jest to mobile (store-only scope)

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/jest.config.js`
- Create: `mobile/tsconfig.jest.json`

- [ ] **Step 1: Install test deps**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npm install --save-dev jest @types/jest ts-jest --legacy-peer-deps
```

- [ ] **Step 2: Create jest config**

Create `mobile/jest.config.js`:

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/app/**/*.spec.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
};
```

- [ ] **Step 3: Create tsconfig for tests**

Create `mobile/tsconfig.jest.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react",
    "module": "commonjs",
    "target": "es2020",
    "skipLibCheck": true
  }
}
```

- [ ] **Step 4: Add test script**

In `mobile/package.json`, add to scripts:

```json
"test": "jest"
```

- [ ] **Step 5: Smoke-test the setup**

Create a temporary `mobile/src/__smoke__.spec.ts`:

```ts
test('jest works', () => { expect(1 + 1).toBe(2); });
```

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npm test -- __smoke__
```

Expected: 1 passing. Delete the smoke file afterwards.

- [ ] **Step 6: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/package.json mobile/package-lock.json mobile/jest.config.js mobile/tsconfig.jest.json
git commit -m "chore(mobile): add minimal Jest config for pure-TS tests"
```

### Task 12: Demo questions data + `useDemoQuestions` hook

**Files:**
- Create: `mobile/app/onboarding/data/demoQuestions.ts`
- Create: `mobile/app/onboarding/hooks/useDemoQuestions.ts`
- Create: `mobile/app/onboarding/data/demoQuestions.spec.ts`

- [ ] **Step 1: Create the bank**

Create `mobile/app/onboarding/data/demoQuestions.ts`:

```ts
export type DemoQuestion =
  | {
      id: string;
      type: 'image_choice';
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
      explanation: string;
    }
  | {
      id: string;
      type: 'true_false';
      question: string;
      correctAnswer: boolean;
      explanation: string;
    }
  | {
      id: string;
      type: 'choice';
      question: string;
      options: { id: string; label: string; isCorrect: boolean }[];
      explanation: string;
    };

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

const CRYPTO: DemoQuestion[] = [
  {
    id: 'crypto-1',
    type: 'image_choice',
    question: 'Which one is Bitcoin?',
    options: [
      { id: 'btc', label: '₿', isCorrect: true },
      { id: 'eth', label: 'Ξ', isCorrect: false },
      { id: 'dollar', label: '$', isCorrect: false },
    ],
    explanation: '₿ is the symbol for Bitcoin.',
  },
  {
    id: 'crypto-2',
    type: 'true_false',
    question: '"HODL" means to hold your crypto long-term',
    correctAnswer: true,
    explanation: 'HODL originated from a typo of "HOLD" and became crypto slang.',
  },
  {
    id: 'crypto-3',
    type: 'choice',
    question: 'What happens when you "buy the dip"?',
    options: [
      { id: 'a', label: 'Buy when price drops', isCorrect: true },
      { id: 'b', label: 'Sell everything', isCorrect: false },
      { id: 'c', label: 'Buy a snack', isCorrect: false },
    ],
    explanation: '"Buy the dip" means purchasing when prices drop.',
  },
];

const FINANCE: DemoQuestion[] = [
  {
    id: 'finance-1',
    type: 'image_choice',
    question: 'Which symbol is the Euro?',
    options: [
      { id: 'eur', label: '€', isCorrect: true },
      { id: 'gbp', label: '£', isCorrect: false },
      { id: 'yen', label: '¥', isCorrect: false },
    ],
    explanation: '€ is the symbol of the Euro, used by 20+ countries.',
  },
  {
    id: 'finance-2',
    type: 'true_false',
    question: 'A "bull market" means prices are going down',
    correctAnswer: false,
    explanation: 'A bull market is when prices are rising — a bear market is falling.',
  },
  {
    id: 'finance-3',
    type: 'choice',
    question: 'What is compound interest?',
    options: [
      { id: 'a', label: 'Interest on your interest', isCorrect: true },
      { id: 'b', label: 'A bank tax', isCorrect: false },
      { id: 'c', label: 'A type of loan', isCorrect: false },
    ],
    explanation: 'Compound interest earns you interest on your previous interest — the 8th wonder of the world.',
  },
];

const BOTH: DemoQuestion[] = [
  CRYPTO[0],
  FINANCE[1],
  {
    id: 'both-3',
    type: 'choice',
    question: 'Why diversify your investments?',
    options: [
      { id: 'a', label: 'To reduce risk', isCorrect: true },
      { id: 'b', label: 'To look smart', isCorrect: false },
      { id: 'c', label: "There's no reason", isCorrect: false },
    ],
    explanation: 'Diversification spreads risk — if one asset tanks, others might hold up.',
  },
];

export const demoQuestions: Record<Domain, DemoQuestion[]> = { CRYPTO, FINANCE, BOTH };
```

- [ ] **Step 2: Create the hook**

Create `mobile/app/onboarding/hooks/useDemoQuestions.ts`:

```ts
import { useMemo } from 'react';
import { demoQuestions, Domain, DemoQuestion } from '../data/demoQuestions';

export function useDemoQuestions(domain: Domain | null): DemoQuestion[] {
  return useMemo(() => (domain ? demoQuestions[domain] : demoQuestions.CRYPTO), [domain]);
}
```

- [ ] **Step 3: Write the failing test**

Create `mobile/app/onboarding/data/demoQuestions.spec.ts`:

```ts
import { demoQuestions } from './demoQuestions';

describe('demoQuestions', () => {
  it.each(['CRYPTO', 'FINANCE', 'BOTH'] as const)('%s has exactly 3 questions', (domain) => {
    expect(demoQuestions[domain]).toHaveLength(3);
  });

  it('each question has a unique id', () => {
    const ids = [
      ...demoQuestions.CRYPTO.map(q => q.id),
      ...demoQuestions.FINANCE.map(q => q.id),
      ...demoQuestions.BOTH.map(q => q.id),
    ];
    // BOTH reuses IDs from CRYPTO/FINANCE intentionally (same questions); just check internal consistency per-domain
    expect(new Set(demoQuestions.CRYPTO.map(q => q.id)).size).toBe(3);
    expect(new Set(demoQuestions.FINANCE.map(q => q.id)).size).toBe(3);
  });

  it('image_choice and choice questions have exactly one correct option', () => {
    const allQuestions = [
      ...demoQuestions.CRYPTO,
      ...demoQuestions.FINANCE,
      ...demoQuestions.BOTH,
    ];
    for (const q of allQuestions) {
      if (q.type === 'image_choice' || q.type === 'choice') {
        const correct = q.options.filter(o => o.isCorrect).length;
        expect(correct).toBe(1);
      }
    }
  });
});
```

- [ ] **Step 4: Run tests**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npm test -- demoQuestions
```

Expected: 3 passing (itEach counts as 3 tests for CRYPTO/FINANCE/BOTH, plus 2 others = 5 passing).

- [ ] **Step 5: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/data/ mobile/app/onboarding/hooks/
git commit -m "feat(mobile): add demo question bank + useDemoQuestions hook"
```

### Task 13: Zustand onboarding store

**Files:**
- Create: `mobile/app/onboarding/hooks/useOnboardingStore.ts`
- Create: `mobile/app/onboarding/hooks/useOnboardingStore.spec.ts`

- [ ] **Step 1: Create the store**

Create `mobile/app/onboarding/hooks/useOnboardingStore.ts`:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StepId =
  | 'welcome' | 'domain' | 'goal' | 'time'
  | 'mindy_intro' | 'demo_intro'
  | 'demo_q1' | 'demo_q2' | 'demo_q3'
  | 'results' | 'signup' | 'notifications';

export const STEP_ORDER: StepId[] = [
  'welcome', 'domain', 'goal', 'time',
  'mindy_intro', 'demo_intro',
  'demo_q1', 'demo_q2', 'demo_q3',
  'results', 'signup', 'notifications',
];

export type Domain = 'CRYPTO' | 'FINANCE' | 'BOTH';

interface DemoAnswer { questionId: string; correct: boolean }

interface OnboardingState {
  currentStep: StepId;

  domain: Domain | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;

  demoScore: number;
  demoAnswers: DemoAnswer[];

  username: string;
  email: string | null;

  notificationsEnabled: boolean;
  reminderHour: number | null;

  goTo: (step: StepId) => void;
  next: () => void;
  back: () => void;
  setDomain: (d: Domain) => void;
  setGoal: (g: string) => void;
  setDailyMinutes: (m: 5 | 10 | 15) => void;
  recordDemoAnswer: (questionId: string, correct: boolean) => void;
  setUsername: (u: string) => void;
  setEmail: (e: string | null) => void;
  setNotifications: (enabled: boolean, hour: number | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'welcome' as StepId,
  domain: null,
  goal: null,
  dailyMinutes: null,
  demoScore: 0,
  demoAnswers: [],
  username: '',
  email: null,
  notificationsEnabled: false,
  reminderHour: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      goTo: (step) => set({ currentStep: step }),
      next: () => {
        const { currentStep } = get();
        const idx = STEP_ORDER.indexOf(currentStep);
        if (idx >= 0 && idx < STEP_ORDER.length - 1) set({ currentStep: STEP_ORDER[idx + 1] });
      },
      back: () => {
        const { currentStep } = get();
        const idx = STEP_ORDER.indexOf(currentStep);
        if (idx > 0) set({ currentStep: STEP_ORDER[idx - 1] });
      },
      setDomain: (domain) => set({ domain }),
      setGoal: (goal) => set({ goal }),
      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      recordDemoAnswer: (questionId, correct) =>
        set((s) => ({
          demoAnswers: [...s.demoAnswers, { questionId, correct }],
          demoScore: s.demoScore + (correct ? 1 : 0),
        })),
      setUsername: (username) => set({ username }),
      setEmail: (email) => set({ email }),
      setNotifications: (enabled, hour) => set({ notificationsEnabled: enabled, reminderHour: hour }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: '@mindy/onboarding_state',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function getStepProgress(step: StepId): number {
  const idx = STEP_ORDER.indexOf(step);
  return ((idx + 1) / STEP_ORDER.length) * 100;
}
```

- [ ] **Step 2: Write the failing tests**

Create `mobile/app/onboarding/hooks/useOnboardingStore.spec.ts`:

```ts
// Mock AsyncStorage for Node-side tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

import { useOnboardingStore, STEP_ORDER, getStepProgress } from './useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('starts at welcome', () => {
    expect(useOnboardingStore.getState().currentStep).toBe('welcome');
  });

  it('next() advances through the step order', () => {
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().currentStep).toBe('domain');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().currentStep).toBe('goal');
  });

  it('back() goes to previous step', () => {
    useOnboardingStore.getState().goTo('goal');
    useOnboardingStore.getState().back();
    expect(useOnboardingStore.getState().currentStep).toBe('domain');
  });

  it('next() does not advance past the last step', () => {
    useOnboardingStore.getState().goTo('notifications');
    useOnboardingStore.getState().next();
    expect(useOnboardingStore.getState().currentStep).toBe('notifications');
  });

  it('recordDemoAnswer bumps score for correct answers only', () => {
    useOnboardingStore.getState().recordDemoAnswer('q1', true);
    useOnboardingStore.getState().recordDemoAnswer('q2', false);
    useOnboardingStore.getState().recordDemoAnswer('q3', true);
    const s = useOnboardingStore.getState();
    expect(s.demoScore).toBe(2);
    expect(s.demoAnswers).toHaveLength(3);
  });

  it('getStepProgress returns percentage 0-100', () => {
    expect(getStepProgress('welcome')).toBeCloseTo((1 / STEP_ORDER.length) * 100);
    expect(getStepProgress('notifications')).toBe(100);
  });

  it('reset brings state back to initial', () => {
    useOnboardingStore.getState().setDomain('CRYPTO');
    useOnboardingStore.getState().goTo('results');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().currentStep).toBe('welcome');
    expect(useOnboardingStore.getState().domain).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npm test -- useOnboardingStore
```

Expected: 7 passing.

- [ ] **Step 4: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/hooks/
git commit -m "feat(mobile): add Zustand onboarding store with persist + tests"
```

### Task 14: Shared `OnboardingScreen` layout + progress bar

**Files:**
- Create: `mobile/app/onboarding/components/OnboardingScreen.tsx`
- Create: `mobile/app/onboarding/components/ProgressBar.tsx`
- Create: `mobile/app/onboarding/components/PrimaryButton.tsx`

- [ ] **Step 1: ProgressBar**

Create `mobile/app/onboarding/components/ProgressBar.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useOnboardingStore, getStepProgress } from '../hooks/useOnboardingStore';

export function ProgressBar() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  if (currentStep === 'welcome') return null;
  const pct = getStepProgress(currentStep);

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 16 },
  track: { height: 6, backgroundColor: '#30363D', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#39FF14', borderRadius: 3 },
});
```

- [ ] **Step 2: PrimaryButton**

Create `mobile/app/onboarding/components/PrimaryButton.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
}

export function PrimaryButton({ onPress, disabled, loading, children, variant = 'primary' }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#0D1117' : '#8B949E'} />
      ) : (
        <View style={styles.content}>
          {typeof children === 'string' ? (
            <Text style={[styles.text, isPrimary ? styles.primaryText : styles.ghostText]}>{children}</Text>
          ) : children}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
  primary: { backgroundColor: '#39FF14' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: '#30363D' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
  primaryText: { color: '#0D1117' },
  ghostText: { color: '#8B949E', fontWeight: '500' },
});
```

- [ ] **Step 3: OnboardingScreen shared layout**

Create `mobile/app/onboarding/components/OnboardingScreen.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
  keyboardAware?: boolean;
  animationKey?: string;
}

export function OnboardingScreen({ children, footer, keyboardAware, animationKey }: Props) {
  const Wrapper = keyboardAware ? KeyboardAvoidingView : View;

  return (
    <SafeAreaView style={styles.root}>
      <Wrapper
        style={{ flex: 1 }}
        {...(keyboardAware ? { behavior: Platform.OS === 'ios' ? 'padding' : 'height' } : {})}
      >
        <Animated.View
          key={animationKey}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.content}
        >
          {children}
        </Animated.View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
});
```

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/components/
git commit -m "feat(mobile): add OnboardingScreen, ProgressBar, PrimaryButton primitives"
```

### Task 15: Onboarding router + layout

**Files:**
- Modify: `mobile/app/onboarding/index.tsx` (replace contents)
- Create: `mobile/app/onboarding/_layout.tsx`

This task is a partial replacement — the old 1600-line file is kept in git history. The new `index.tsx` is the router shell; individual step files (created in later tasks) fill in the actual rendering.

- [ ] **Step 1: Layout file**

Create `mobile/app/onboarding/_layout.tsx`:

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { ProgressBar } from './components/ProgressBar';

export default function OnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117' }}>
      <StatusBar style="light" />
      <ProgressBar />
      <Slot />
    </View>
  );
}
```

- [ ] **Step 2: Replace index.tsx with the router**

**Overwrite** `mobile/app/onboarding/index.tsx` with:

```tsx
import React from 'react';
import { useOnboardingStore, StepId } from './hooks/useOnboardingStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { DomainStep } from './steps/DomainStep';
import { GoalStep } from './steps/GoalStep';
import { TimeStep } from './steps/TimeStep';
import { MindyIntroStep } from './steps/MindyIntroStep';
import { DemoIntroStep } from './steps/DemoIntroStep';
import { DemoQuestionStep } from './steps/DemoQuestionStep';
import { ResultsStep } from './steps/ResultsStep';
import { SignupStep } from './steps/SignupStep';
import { NotificationsStep } from './steps/NotificationsStep';

export default function OnboardingRouter() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  switch (currentStep) {
    case 'welcome':       return <WelcomeStep />;
    case 'domain':        return <DomainStep />;
    case 'goal':          return <GoalStep />;
    case 'time':          return <TimeStep />;
    case 'mindy_intro':   return <MindyIntroStep />;
    case 'demo_intro':    return <DemoIntroStep />;
    case 'demo_q1':       return <DemoQuestionStep questionIndex={0} stepKey="demo_q1" />;
    case 'demo_q2':       return <DemoQuestionStep questionIndex={1} stepKey="demo_q2" />;
    case 'demo_q3':       return <DemoQuestionStep questionIndex={2} stepKey="demo_q3" />;
    case 'results':       return <ResultsStep />;
    case 'signup':        return <SignupStep />;
    case 'notifications': return <NotificationsStep />;
    default:              return null;
  }
}
```

> Note: this file will fail to compile until the step files are created. The next tasks create each step one-by-one. You can commit this now since the individual step imports get added progressively — OR wait and commit at Task 25. Recommended: **wait to commit** until Task 25 (delete old monolith) so the repo remains buildable step-by-step. To keep the repo green while working, temporarily stash this change:
>
> ```bash
> git stash push mobile/app/onboarding/index.tsx mobile/app/onboarding/_layout.tsx -m "onboarding router WIP"
> ```
>
> Pop it back at Task 25 with `git stash pop`.

- [ ] **Step 3: Stash the WIP router**

Run:
```bash
cd /Users/axelmisson/mindy_final && git stash push mobile/app/onboarding/index.tsx mobile/app/onboarding/_layout.tsx -m "onboarding router WIP"
```

Expected: one stash entry created. `git status` shows clean.

---

## Phase 4 · Onboarding steps

All step tasks follow the same pattern: create `steps/<Name>Step.tsx`, typecheck, commit. Each uses `useOnboardingStore` + `OnboardingScreen` + `PrimaryButton`. Copy is English (matching the existing onboarding).

### Task 16: WelcomeStep

**Files:**
- Create: `mobile/app/onboarding/steps/WelcomeStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const VALUE_PROPS = [
  { icon: '🧠', label: 'Crypto × Finance' },
  { icon: '⚡', label: '5 min / day' },
  { icon: '🎮', label: 'Interactive' },
];

export function WelcomeStep() {
  const next = useOnboardingStore((s) => s.next);

  const handleStart = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    next();
  };

  const handleLogin = () => router.replace('/login');

  return (
    <OnboardingScreen
      animationKey="welcome"
      footer={
        <>
          <PrimaryButton onPress={handleStart}>Get started</PrimaryButton>
          <PrimaryButton onPress={handleLogin} variant="ghost">I already have an account</PrimaryButton>
        </>
      }
    >
      <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
        <MindyMascot mood="neutral" size={140} />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)} style={styles.texts}>
        <Text style={styles.title}>Learn to speak money</Text>
        <Text style={styles.subtitle}>Master crypto & finance in just 5 minutes a day</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.pills}>
        {VALUE_PROPS.map((p) => (
          <View key={p.label} style={styles.pill}>
            <Text style={styles.pillIcon}>{p.icon}</Text>
            <Text style={styles.pillLabel}>{p.label}</Text>
          </View>
        ))}
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 32 },
  texts: { alignItems: 'center', marginBottom: 32 },
  title: { fontFamily: 'Inter', fontSize: 30, fontWeight: '800', color: '#E6EDF3', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#161B22', borderRadius: 20, borderWidth: 1, borderColor: '#30363D' },
  pillIcon: { fontSize: 14 },
  pillLabel: { fontFamily: 'Inter', fontSize: 12, color: '#E6EDF3', fontWeight: '600' },
});
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: errors only for the *other missing step files* (DomainStep, GoalStep, etc.). Errors for `WelcomeStep` itself: 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/WelcomeStep.tsx
git commit -m "feat(mobile): add WelcomeStep with Mindy mascot and honest value-props"
```

### Task 17: DomainStep

**Files:**
- Create: `mobile/app/onboarding/steps/DomainStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore, Domain } from '../hooks/useOnboardingStore';

export function DomainStep() {
  const domain = useOnboardingStore((s) => s.domain);
  const setDomain = useOnboardingStore((s) => s.setDomain);
  const next = useOnboardingStore((s) => s.next);

  const pick = async (d: Domain) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDomain(d);
  };

  return (
    <OnboardingScreen
      animationKey="domain"
      footer={
        <PrimaryButton onPress={next} disabled={!domain}>Continue</PrimaryButton>
      }
    >
      <Text style={styles.title}>What do you want to learn?</Text>
      <Text style={styles.subtitle}>You can always explore both later</Text>

      <View style={styles.cards}>
        <Pressable
          style={[styles.card, domain === 'CRYPTO' && styles.selectedCrypto]}
          onPress={() => pick('CRYPTO')}
        >
          <Text style={styles.bigIcon}>₿</Text>
          <Text style={styles.cardTitle}>Crypto</Text>
          <Text style={styles.cardDesc}>Bitcoin, trading, DeFi</Text>
        </Pressable>
        <Pressable
          style={[styles.card, domain === 'FINANCE' && styles.selectedFinance]}
          onPress={() => pick('FINANCE')}
        >
          <Text style={styles.bigIcon}>$</Text>
          <Text style={styles.cardTitle}>Finance</Text>
          <Text style={styles.cardDesc}>Investing, budgeting, stocks</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.both, domain === 'BOTH' && styles.selectedBoth]}
        onPress={() => pick('BOTH')}
      >
        {domain === 'BOTH' && <Icon name="check" size={18} color="#FFD700" />}
        <Text style={styles.bothText}>Both!</Text>
      </Pressable>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  cards: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#161B22', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#30363D' },
  selectedCrypto: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  selectedFinance: { borderColor: '#58A6FF', backgroundColor: 'rgba(88,166,255,0.1)' },
  bigIcon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontFamily: 'Inter', fontSize: 18, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  cardDesc: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', textAlign: 'center' },
  both: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#161B22', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#30363D' },
  selectedBoth: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' },
  bothText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', color: '#E6EDF3' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/DomainStep.tsx
git commit -m "feat(mobile): add DomainStep"
```

### Task 18: GoalStep

**Files:**
- Create: `mobile/app/onboarding/steps/GoalStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, IconName } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: 'invest',     label: 'Start investing',        icon: 'trending-up' },
  { id: 'understand', label: 'Understand the basics',  icon: 'brain' },
  { id: 'career',     label: 'Career growth',          icon: 'rocket' },
  { id: 'curiosity',  label: 'Just curious',           icon: 'search' },
];

export function GoalStep() {
  const goal = useOnboardingStore((s) => s.goal);
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const next = useOnboardingStore((s) => s.next);

  const pick = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoal(id);
  };

  return (
    <OnboardingScreen
      animationKey="goal"
      footer={<PrimaryButton onPress={next} disabled={!goal}>Continue</PrimaryButton>}
    >
      <Text style={styles.title}>Why do you want to learn?</Text>
      <Text style={styles.subtitle}>This helps us personalize your experience</Text>

      <View style={styles.list}>
        {GOALS.map((g) => {
          const isSelected = goal === g.id;
          return (
            <Pressable
              key={g.id}
              style={[styles.item, isSelected && styles.selected]}
              onPress={() => pick(g.id)}
            >
              <View style={styles.iconBox}>
                <Icon name={g.icon} size={24} color="#E6EDF3" />
              </View>
              <Text style={styles.label}>{g.label}</Text>
              {isSelected && <Icon name="check" size={18} color="#39FF14" />}
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  list: { gap: 12 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#30363D' },
  selected: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  iconBox: { marginRight: 16 },
  label: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/GoalStep.tsx
git commit -m "feat(mobile): add GoalStep"
```

### Task 19: TimeStep

**Files:**
- Create: `mobile/app/onboarding/steps/TimeStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const TIMES = [
  { minutes: 5 as const,  label: '5',  sublabel: 'Casual' },
  { minutes: 10 as const, label: '10', sublabel: 'Regular' },
  { minutes: 15 as const, label: '15', sublabel: 'Serious' },
];

export function TimeStep() {
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setDailyMinutes = useOnboardingStore((s) => s.setDailyMinutes);
  const next = useOnboardingStore((s) => s.next);

  const pick = async (m: 5 | 10 | 15) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDailyMinutes(m);
  };

  return (
    <OnboardingScreen
      animationKey="time"
      footer={<PrimaryButton onPress={next} disabled={!dailyMinutes}>Continue</PrimaryButton>}
    >
      <Text style={styles.title}>Set a daily goal</Text>
      <Text style={styles.subtitle}>Consistency beats intensity.</Text>

      <View style={styles.cards}>
        {TIMES.map((t) => (
          <Pressable
            key={t.minutes}
            style={[styles.card, dailyMinutes === t.minutes && styles.selected]}
            onPress={() => pick(t.minutes)}
          >
            <Text style={styles.big}>{t.label}</Text>
            <Text style={styles.unit}>min/day</Text>
            <Text style={styles.sub}>{t.sublabel}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.note}>
        <Icon name="lightbulb" size={18} color="#FFD700" />
        <Text style={styles.noteText}>Most successful learners start with 5 minutes</Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: { flex: 1, backgroundColor: '#161B22', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: '#30363D' },
  selected: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  big: { fontFamily: 'JetBrainsMono', fontSize: 32, fontWeight: '700', color: '#39FF14' },
  unit: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E' },
  sub: { fontFamily: 'Inter', fontSize: 11, color: '#484F58', marginTop: 8 },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  noteText: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/TimeStep.tsx
git commit -m "feat(mobile): add TimeStep (persists dailyMinutes)"
```

### Task 20: MindyIntroStep

**Files:**
- Create: `mobile/app/onboarding/steps/MindyIntroStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MindyMascot } from '@/components/mindy';
import { MindyMessage } from '@/components/MindyMessage';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const INTRO_TEXT = "Hey! I'm Mindy, your coach. Before we start, let me test you — 3 quick questions, nothing serious. Ready?";

export function MindyIntroStep() {
  const next = useOnboardingStore((s) => s.next);
  const [typingDone, setTypingDone] = useState(false);

  return (
    <OnboardingScreen
      animationKey="mindy_intro"
      footer={
        <PrimaryButton onPress={next} disabled={!typingDone}>Let's go</PrimaryButton>
      }
    >
      <View style={styles.mascotBox}>
        <MindyMascot mood="hype" size={160} />
      </View>

      <Animated.View entering={FadeIn.delay(500)} style={styles.messageBox}>
        <MindyMessage
          message={INTRO_TEXT}
          mood="hype"
          typingSpeed={25}
          onComplete={() => setTypingDone(true)}
        />
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  mascotBox: { alignItems: 'center', marginBottom: 24 },
  messageBox: { marginHorizontal: 8 },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/MindyIntroStep.tsx
git commit -m "feat(mobile): add MindyIntroStep with typing animation"
```

### Task 21: DemoIntroStep

**Files:**
- Create: `mobile/app/onboarding/steps/DemoIntroStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

const CHECKLIST = [
  'Takes 30 seconds',
  'Learn real concepts',
  'Earn your first XP',
];

export function DemoIntroStep() {
  const next = useOnboardingStore((s) => s.next);

  return (
    <OnboardingScreen
      animationKey="demo_intro"
      footer={<PrimaryButton onPress={next}>Let's go</PrimaryButton>}
    >
      <View style={styles.icon}><Icon name="play" size={64} color="#39FF14" /></View>
      <Text style={styles.title}>Let's try a quick lesson!</Text>
      <Text style={styles.subtitle}>3 easy questions to see how MINDY works.{'\n'}No pressure, just have fun!</Text>

      <View style={styles.checklist}>
        {CHECKLIST.map((c) => (
          <View key={c} style={styles.row}>
            <Icon name="check" size={16} color="#39FF14" />
            <Text style={styles.rowText}>{c}</Text>
          </View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  checklist: { backgroundColor: '#161B22', borderRadius: 16, padding: 20, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontFamily: 'Inter', fontSize: 15, color: '#E6EDF3' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/DemoIntroStep.tsx
git commit -m "feat(mobile): add DemoIntroStep"
```

### Task 22: DemoQuestionStep (generic)

**Files:**
- Create: `mobile/app/onboarding/steps/DemoQuestionStep.tsx`

This is the single generic question component rendered three times by the router with different `questionIndex` and `stepKey`.

- [ ] **Step 1: Create the step**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { useOnboardingStore, StepId } from '../hooks/useOnboardingStore';
import { useDemoQuestions } from '../hooks/useDemoQuestions';

interface Props {
  questionIndex: 0 | 1 | 2;
  stepKey: Extract<StepId, 'demo_q1' | 'demo_q2' | 'demo_q3'>;
}

export function DemoQuestionStep({ questionIndex, stepKey }: Props) {
  const domain = useOnboardingStore((s) => s.domain);
  const next = useOnboardingStore((s) => s.next);
  const record = useOnboardingStore((s) => s.recordDemoAnswer);
  const questions = useDemoQuestions(domain);
  const question = questions[questionIndex];

  const [selected, setSelected] = useState<string | boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset when the step key changes (different question)
  useEffect(() => {
    setSelected(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [stepKey]);

  const answer = useCallback(async (value: string | boolean, correct: boolean) => {
    setSelected(value);
    setIsCorrect(correct);
    setShowFeedback(true);
    record(question.id, correct);
    await Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    setTimeout(() => next(), 1500);
  }, [question.id, next, record]);

  return (
    <OnboardingScreen animationKey={stepKey}>
      <View style={styles.header}>
        <Text style={styles.num}>{questionIndex + 1}/3</Text>
      </View>

      <Text style={styles.question}>{question.question}</Text>

      {question.type === 'image_choice' && (
        <View style={styles.imageOpts}>
          {question.options.map((o) => (
            <Pressable
              key={o.id}
              disabled={showFeedback}
              style={[
                styles.imageOpt,
                selected === o.id && (o.isCorrect ? styles.correct : styles.wrong),
                showFeedback && o.isCorrect && styles.correct,
              ]}
              onPress={() => answer(o.id, o.isCorrect)}
            >
              <Text style={styles.imageOptText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {question.type === 'true_false' && (
        <View style={styles.tfOpts}>
          <Pressable
            disabled={showFeedback}
            style={[
              styles.tf, styles.tfTrue,
              selected === true && (question.correctAnswer ? styles.correct : styles.wrong),
              showFeedback && question.correctAnswer && styles.correct,
            ]}
            onPress={() => answer(true, question.correctAnswer === true)}
          >
            <Text style={styles.tfText}>TRUE</Text>
          </Pressable>
          <Pressable
            disabled={showFeedback}
            style={[
              styles.tf, styles.tfFalse,
              selected === false && (!question.correctAnswer ? styles.correct : styles.wrong),
              showFeedback && !question.correctAnswer && styles.correct,
            ]}
            onPress={() => answer(false, question.correctAnswer === false)}
          >
            <Text style={styles.tfText}>FALSE</Text>
          </Pressable>
        </View>
      )}

      {question.type === 'choice' && (
        <View style={styles.choiceOpts}>
          {question.options.map((o) => (
            <Pressable
              key={o.id}
              disabled={showFeedback}
              style={[
                styles.choice,
                selected === o.id && (o.isCorrect ? styles.correct : styles.wrong),
                showFeedback && o.isCorrect && styles.correct,
              ]}
              onPress={() => answer(o.id, o.isCorrect)}
            >
              <Text style={styles.choiceText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {showFeedback && (
        <Animated.View entering={FadeIn} style={styles.feedback}>
          <MindyMascot mood={isCorrect ? 'hype' : 'roast'} size={60} animated={false} />
          <View style={{ flex: 1 }}>
            <View style={styles.feedbackHeader}>
              <Icon name={isCorrect ? 'check' : 'x'} size={20} color={isCorrect ? '#39FF14' : '#F85149'} />
              <Text style={[styles.feedbackTitle, { color: isCorrect ? '#39FF14' : '#F85149' }]}>
                {isCorrect ? 'Correct!' : 'Not quite!'}
              </Text>
            </View>
            <Text style={styles.feedbackText}>{question.explanation}</Text>
          </View>
        </Animated.View>
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 32 },
  num: { fontFamily: 'JetBrainsMono', fontSize: 14, color: '#8B949E', textAlign: 'center' },
  question: { fontFamily: 'Inter', fontSize: 22, fontWeight: '600', color: '#E6EDF3', textAlign: 'center', marginBottom: 32 },
  imageOpts: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  imageOpt: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#161B22', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#30363D' },
  imageOptText: { fontSize: 36 },
  tfOpts: { flexDirection: 'row', gap: 16 },
  tf: { flex: 1, paddingVertical: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  tfTrue: { backgroundColor: 'rgba(57,255,20,0.1)', borderColor: '#39FF14' },
  tfFalse: { backgroundColor: 'rgba(248,81,73,0.1)', borderColor: '#F85149' },
  tfText: { fontFamily: 'JetBrainsMono', fontSize: 16, fontWeight: '700', color: '#E6EDF3' },
  choiceOpts: { gap: 12 },
  choice: { backgroundColor: '#161B22', borderRadius: 12, padding: 18, borderWidth: 2, borderColor: '#30363D' },
  choiceText: { fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3', textAlign: 'center' },
  correct: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.2)' },
  wrong: { borderColor: '#F85149', backgroundColor: 'rgba(248,81,73,0.2)' },
  feedback: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 24, backgroundColor: '#161B22', padding: 14, borderRadius: 12 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  feedbackTitle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
  feedbackText: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/DemoQuestionStep.tsx
git commit -m "feat(mobile): add DemoQuestionStep with domain-aware questions"
```

### Task 23: ResultsStep

**Files:**
- Create: `mobile/app/onboarding/steps/ResultsStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

export function ResultsStep() {
  const demoScore = useOnboardingStore((s) => s.demoScore);
  const next = useOnboardingStore((s) => s.next);

  const percentage = Math.round((demoScore / 3) * 100);
  const title = percentage >= 66 ? 'Amazing!' : percentage >= 33 ? 'Good job!' : 'Nice try!';
  const mood = percentage >= 33 ? 'hype' : 'neutral';

  return (
    <OnboardingScreen
      animationKey="results"
      footer={<PrimaryButton onPress={next}>Save my progress</PrimaryButton>}
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.card}>
        <MindyMascot mood={mood} size={120} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.score}>{demoScore}/3 correct</Text>

        <View style={styles.xpBox}>
          <Text style={styles.xpAmount}>+{demoScore * 10} XP</Text>
          <Text style={styles.xpLabel}>earned</Text>
        </View>
      </Animated.View>

      <View style={styles.insight}>
        <Text style={styles.insightText}>
          You're already learning! Imagine what you'll know after a week of daily practice.
        </Text>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#161B22', borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 2, borderColor: '#39FF14', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 28, fontWeight: '700', color: '#E6EDF3', marginTop: 12, marginBottom: 8 },
  score: { fontFamily: 'JetBrainsMono', fontSize: 16, color: '#8B949E', marginBottom: 24 },
  xpBox: { backgroundColor: '#0D1117', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center' },
  xpAmount: { fontFamily: 'JetBrainsMono', fontSize: 24, fontWeight: '700', color: '#FFD700' },
  xpLabel: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E' },
  insight: { backgroundColor: '#161B22', borderRadius: 12, padding: 16 },
  insightText: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center', lineHeight: 20 },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/ResultsStep.tsx
git commit -m "feat(mobile): add ResultsStep with Mindy mascot"
```

### Task 24: SignupStep

**Files:**
- Create: `mobile/app/onboarding/steps/SignupStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';

function isValidUsername(u: string) {
  const t = u.trim();
  return t.length >= 3 && t.length <= 20 && /^[a-zA-Z0-9_]+$/.test(t);
}

function isValidEmail(e: string) {
  if (!e.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function SignupStep() {
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const next = useOnboardingStore((s) => s.next);

  const [u, setU] = useState('');
  const [e, setE] = useState('');
  const [uErr, setUErr] = useState('');
  const [eErr, setEErr] = useState('');

  const submit = () => {
    const tU = u.trim();
    const tE = e.trim();
    if (!isValidUsername(tU)) {
      setUErr('3-20 chars, letters/numbers/underscore only');
      return;
    }
    if (!isValidEmail(tE)) {
      setEErr('Invalid email');
      return;
    }
    setUErr(''); setEErr('');
    setUsername(tU);
    setEmail(tE || null);
    next();
  };

  return (
    <OnboardingScreen
      animationKey="signup"
      keyboardAware
      footer={
        <PrimaryButton onPress={submit} disabled={!isValidUsername(u)}>
          Continue
        </PrimaryButton>
      }
    >
      <Animated.View entering={FadeIn.duration(400)}>
        <View style={styles.header}>
          <Icon name="user" size={48} color="#39FF14" />
          <Text style={styles.title}>Choose a username</Text>
          <Text style={styles.subtitle}>This is how you'll appear on the leaderboard.</Text>
        </View>

        <View style={styles.inputWrap}>
          <View style={[styles.input, uErr ? styles.inputError : u.length >= 3 && styles.inputValid]}>
            <Text style={styles.prefix}>@</Text>
            <TextInput
              value={u}
              onChangeText={(v) => { setU(v); setUErr(''); }}
              placeholder="satoshi"
              placeholderTextColor="#484F58"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              style={styles.textInput}
            />
            {isValidUsername(u) && <Icon name="check" size={18} color="#39FF14" />}
          </View>
          <Text style={uErr ? styles.errorText : styles.hint}>
            {uErr || 'Letters, numbers, underscore — 3 to 20 chars'}
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Email (optional)</Text>
          <View style={[styles.input, eErr && styles.inputError]}>
            <TextInput
              value={e}
              onChangeText={(v) => { setE(v); setEErr(''); }}
              placeholder="your@email.com"
              placeholderTextColor="#484F58"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.textInput}
            />
          </View>
          <Text style={eErr ? styles.errorText : styles.hint}>
            {eErr || 'To recover your account on another device'}
          </Text>
        </View>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', marginTop: 12, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center', marginTop: 6 },
  inputWrap: { marginBottom: 18 },
  label: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', marginBottom: 6 },
  input: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161B22', borderRadius: 14, borderWidth: 2, borderColor: '#30363D', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  inputValid: { borderColor: '#39FF14' },
  inputError: { borderColor: '#F85149' },
  prefix: { fontFamily: 'JetBrainsMono', fontSize: 18, color: '#39FF14', fontWeight: '700' },
  textInput: { flex: 1, fontFamily: 'JetBrainsMono', fontSize: 16, color: '#E6EDF3', padding: 0 },
  hint: { fontFamily: 'Inter', fontSize: 11, color: '#484F58', marginTop: 4, paddingHorizontal: 4 },
  errorText: { fontFamily: 'Inter', fontSize: 12, color: '#F85149', marginTop: 4, paddingHorizontal: 4 },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/SignupStep.tsx
git commit -m "feat(mobile): add SignupStep with optional email"
```

### Task 25: NotificationsStep

**Files:**
- Create: `mobile/app/onboarding/steps/NotificationsStep.tsx`

- [ ] **Step 1: Create the step**

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { MindyMascot } from '@/components/mindy';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { finalizeOnboarding } from '../hooks/finalize';

const TIME_OPTS: { hour: number; label: string }[] = [
  { hour:  9, label: 'Morning · 09:00' },
  { hour: 12, label: 'Lunch · 12:00' },
  { hour: 20, label: 'Evening · 20:00' },
  { hour: 22, label: 'Night · 22:00' },
];

export function NotificationsStep() {
  const dailyMinutes = useOnboardingStore((s) => s.dailyMinutes);
  const setNotifications = useOnboardingStore((s) => s.setNotifications);
  // Default hour based on dailyMinutes — shorter time => morning, longer => evening
  const defaultHour = dailyMinutes === 5 ? 9 : dailyMinutes === 10 ? 12 : 20;
  const [hour, setHour] = useState<number>(defaultHour);
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setNotifications(granted, granted ? hour : null);
      await finalizeOnboarding();
    } catch (err) {
      console.error('Notifications permission error:', err);
      setNotifications(false, null);
      await finalizeOnboarding();
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(false, null);
    await finalizeOnboarding();
  };

  return (
    <OnboardingScreen
      animationKey="notifications"
      footer={
        <>
          <PrimaryButton onPress={handleEnable} loading={loading}>
            Enable reminders
          </PrimaryButton>
          <PrimaryButton onPress={handleSkip} variant="ghost" disabled={loading}>
            Not now
          </PrimaryButton>
        </>
      }
    >
      <View style={styles.hero}>
        <MindyMascot mood="neutral" size={120} />
      </View>

      <Text style={styles.title}>Want me to remind you?</Text>
      <Text style={styles.subtitle}>Keep your streak alive with a daily nudge.</Text>

      <View style={styles.chips}>
        {TIME_OPTS.map((t) => (
          <Pressable
            key={t.hour}
            style={[styles.chip, hour === t.hour && styles.chipSelected]}
            onPress={() => setHour(t.hour)}
          >
            <Text style={[styles.chipText, hour === t.hour && styles.chipTextSelected]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter', fontSize: 26, fontWeight: '700', color: '#E6EDF3', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', marginBottom: 32 },
  chips: { gap: 10 },
  chip: { padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#30363D', backgroundColor: '#161B22' },
  chipSelected: { borderColor: '#39FF14', backgroundColor: 'rgba(57,255,20,0.1)' },
  chipText: { fontFamily: 'Inter', fontSize: 15, color: '#E6EDF3', textAlign: 'center' },
  chipTextSelected: { color: '#39FF14', fontWeight: '700' },
});
```

- [ ] **Step 2: Typecheck**

You will get an error because `finalizeOnboarding` doesn't exist yet — that's fine, next task creates it. Just verify the rest compiles:

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit 2>&1 | grep NotificationsStep || echo "no other NotificationsStep errors"
```

- [ ] **Step 3: Commit** (partial — file not wired yet)

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/steps/NotificationsStep.tsx
git commit -m "feat(mobile): add NotificationsStep (finalize wiring in next commit)"
```

---

## Phase 5 · Finalize + router wire-up

### Task 26: `finalizeOnboarding` function

**Files:**
- Create: `mobile/app/onboarding/hooks/finalize.ts`

This function is called from `NotificationsStep` on both Enable and Skip. It flushes the store to the backend, creates/updates the user, fires the magic-link email if one was provided, then clears the onboarding store and navigates to the main app.

- [ ] **Step 1: Implement finalize**

Create `mobile/app/onboarding/hooks/finalize.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useOnboardingStore } from './useOnboardingStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function finalizeOnboarding(): Promise<void> {
  const s = useOnboardingStore.getState();

  // 1. Create user
  const createBody: Record<string, unknown> = { username: s.username };
  if (s.email) createBody.email = s.email;

  const createResp = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  });
  if (!createResp.ok) throw new Error('Failed to create user');
  const { data: user } = await createResp.json();

  // 2. Update preferences (best-effort: block on error for critical fields)
  await fetch(`${API_URL}/users/${user.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferredDomain: s.domain,
      userGoal: s.goal,
      dailyMinutes: s.dailyMinutes,
      reminderHour: s.reminderHour,
    }),
  });

  // 3. Register push token if notifications enabled (best-effort)
  if (s.notificationsEnabled) {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await fetch(`${API_URL}/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, token: token.data }),
      });
    } catch (err) {
      console.warn('Failed to register push token:', err);
    }
  }

  // 4. Fire magic-link if email provided (fire-and-forget)
  if (s.email) {
    fetch(`${API_URL}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: s.email }),
    }).catch((err) => console.warn('Magic link send failed:', err));
  }

  // 5. Persist user identity locally (parity with useUser hook)
  await AsyncStorage.multiSet([
    ['@mindy/user_id', user.id],
    ['@mindy/username', user.username],
  ]);

  // 6. Clear onboarding store and navigate
  s.reset();
  await AsyncStorage.removeItem('@mindy/onboarding_state');
  router.replace('/(tabs)');
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit 2>&1 | grep -E "onboarding" | head -30
```

Expected: any remaining errors relate to `index.tsx` and `_layout.tsx` which are still stashed. NotificationsStep now resolves `finalizeOnboarding` cleanly.

- [ ] **Step 3: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/hooks/finalize.ts
git commit -m "feat(mobile): add finalizeOnboarding to flush store to API"
```

### Task 27: Pop router + delete old monolith

**Files:**
- Modify: `mobile/app/onboarding/index.tsx` (from stash)
- Create: `mobile/app/onboarding/_layout.tsx` (from stash)

- [ ] **Step 1: Pop the stash**

```bash
cd /Users/axelmisson/mindy_final && git stash pop
```

Expected: `index.tsx` and `_layout.tsx` now staged with the new content from Task 15.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
```

Expected: exit 0, no onboarding errors (every step imports now resolve).

- [ ] **Step 3: Smoke-run the Metro bundler**

Run:
```bash
cd /Users/axelmisson/mindy_final/mobile && npx expo export --platform ios --output-dir /tmp/mindy-smoke --dev 2>&1 | tail -20
```

Expected: export completes without errors. (If Metro hangs or fails, read the error carefully — most likely a missing import or typo in a step file.)

- [ ] **Step 4: Commit**

```bash
cd /Users/axelmisson/mindy_final && git add mobile/app/onboarding/index.tsx mobile/app/onboarding/_layout.tsx
git commit -m "feat(mobile): wire new onboarding router — replaces 1600-line monolith"
```

---

## Phase 6 · Magic-link verify route

### Task 28: Verify route

**Files:**
- Create: `mobile/app/auth/verify/[token].tsx`

- [ ] **Step 1: Create the route**

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { MindyMascot } from '@/components/mindy';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

type Status = 'loading' | 'success' | 'expired' | 'error';

export default function VerifyScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('loading');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    (async () => {
      try {
        const resp = await fetch(`${API_URL}/auth/verify/${token}`);
        if (resp.ok) {
          setStatus('success');
          setTimeout(() => router.replace('/(tabs)'), 1500);
        } else if (resp.status === 410) {
          setStatus('expired');
          setMsg('This link has expired. Request a new one from settings.');
        } else if (resp.status === 404) {
          setStatus('expired');
          setMsg('This link is invalid or was already used.');
        } else {
          setStatus('error');
          setMsg('Something went wrong. Try again later.');
        }
      } catch {
        setStatus('error');
        setMsg('Could not reach the server. Check your connection.');
      }
    })();
  }, [token]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        {status === 'loading' && (
          <>
            <MindyMascot mood="thinking" size={120} />
            <ActivityIndicator color="#39FF14" style={{ marginTop: 16 }} />
            <Text style={styles.caption}>Verifying your link...</Text>
          </>
        )}
        {status === 'success' && (
          <>
            <MindyMascot mood="hype" size={120} />
            <Icon name="check" size={40} color="#39FF14" />
            <Text style={styles.title}>Email verified!</Text>
            <Text style={styles.caption}>Taking you to the app...</Text>
          </>
        )}
        {(status === 'expired' || status === 'error') && (
          <>
            <MindyMascot mood="roast" size={120} />
            <Text style={styles.title}>Link problem</Text>
            <Text style={styles.caption}>{msg}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  title: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginTop: 12 },
  caption: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/app/auth/verify/
git commit -m "feat(mobile): add magic-link verify route"
```

---

## Phase 7 · Invite-friends relocation

### Task 29: Backend support for invite prompt tracking

**Files:**
- Modify: `server/src/users/users.service.ts` (extend update to accept hasSeenInvitePrompt)
- Modify: `server/src/users/users.controller.ts` if it has DTO validation

The Prisma field was already added in Task 2.

- [ ] **Step 1: Extend update DTO + service**

Add `hasSeenInvitePrompt: z.boolean().optional()` to `UpdateUserDto` (same pattern as Task 3 Step 3). Update the service `update()` method to pass it through to Prisma.

- [ ] **Step 2: Add/extend test**

In `server/src/users/users.service.spec.ts`:

```ts
describe('UsersService.update', () => {
  it('persists hasSeenInvitePrompt', async () => {
    prisma.user.update = jest.fn().mockResolvedValue({ id: 'u1', hasSeenInvitePrompt: true });
    await service.update('u1', { hasSeenInvitePrompt: true });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u1' },
      data: expect.objectContaining({ hasSeenInvitePrompt: true }),
    }));
  });
});
```

- [ ] **Step 3: Run test + commit**

```bash
cd /Users/axelmisson/mindy_final/server && npx jest users.service.spec
cd /Users/axelmisson/mindy_final && git add server/src/users/
git commit -m "feat(server): support hasSeenInvitePrompt on user update"
```

### Task 30: InviteFriendsPrompt component

**Files:**
- Create: `mobile/src/components/friends/InviteFriendsPrompt.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Share, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '@/components/ui/Icon';
import { MindyMascot } from '@/components/mindy';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Props {
  visible: boolean;
  referralCode: string;
  userId: string;
  onDismiss: () => void;
}

export function InviteFriendsPrompt({ visible, referralCode, userId, onDismiss }: Props) {
  const markSeen = async () => {
    try {
      await fetch(`${API_URL}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenInvitePrompt: true }),
      });
    } catch (err) {
      console.warn('Failed to mark invite prompt seen:', err);
    }
    onDismiss();
  };

  const share = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `🧠 Just started learning on MINDY. Join me with code ${referralCode} → mindy://invite/${referralCode}`,
        title: 'Join me on Mindy',
      });
    } finally {
      await markSeen();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={markSeen}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.mascot}><MindyMascot mood="hype" size={100} /></View>
          <Text style={styles.title}>First lesson done!</Text>
          <Text style={styles.subtitle}>Bring a friend and both of you earn bonus XP.</Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your referral code</Text>
            <Text style={styles.code}>{referralCode}</Text>
          </View>

          <Pressable style={styles.primary} onPress={share}>
            <Icon name="share" size={18} color="#0D1117" />
            <Text style={styles.primaryText}>Invite friends</Text>
          </Pressable>
          <Pressable style={styles.ghost} onPress={markSeen}>
            <Text style={styles.ghostText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#161B22', borderRadius: 20, padding: 24, borderWidth: 2, borderColor: 'rgba(57,255,20,0.4)', gap: 14, alignItems: 'center' },
  mascot: { marginBottom: 8 },
  title: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', color: '#E6EDF3', textAlign: 'center' },
  subtitle: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', textAlign: 'center', paddingHorizontal: 12 },
  codeBox: { backgroundColor: '#0D1117', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: '#39FF14', alignItems: 'center', gap: 4 },
  codeLabel: { fontFamily: 'Inter', fontSize: 11, color: '#8B949E' },
  code: { fontFamily: 'JetBrainsMono', fontSize: 22, fontWeight: '700', color: '#39FF14', letterSpacing: 3 },
  primary: { flexDirection: 'row', gap: 10, backgroundColor: '#39FF14', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '700', color: '#0D1117' },
  ghost: { paddingVertical: 8 },
  ghostText: { fontFamily: 'Inter', fontSize: 13, color: '#8B949E' },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final && git add mobile/src/components/friends/
git commit -m "feat(mobile): add InviteFriendsPrompt component"
```

### Task 31: Wire InviteFriendsPrompt into lesson-completion

**Files:**
- Modify: `mobile/app/lesson/[id].tsx` (main lesson screen — check its real shape first)

- [ ] **Step 1: Inspect lesson screen**

Run:
```bash
ls /Users/axelmisson/mindy_final/mobile/app/lesson/
```

Read the lesson completion flow in whatever file shows the end-of-lesson state (likely `[id].tsx` or a child component). The goal: find the "lesson completed" moment (after confetti / results screen).

- [ ] **Step 2: Fetch user + completed lessons**

In the lesson screen component, add logic after lesson completion:

```tsx
import { InviteFriendsPrompt } from '@/components/friends/InviteFriendsPrompt';
import { useReferrals } from '@/hooks/useReferrals';
import { useUser } from '@/hooks/useUser';

// ...inside the component:
const { userId } = useUser();
const { stats } = useReferrals(userId);
const [invitePromptVisible, setInvitePromptVisible] = useState(false);

// When lesson completes, check if we should show the prompt:
useEffect(() => {
  if (!lessonJustCompleted || !userId) return;
  (async () => {
    try {
      const resp = await fetch(`${API_URL}/users/${userId}/stats`);
      const { data } = await resp.json();
      // Show only after the 1st lesson, only once ever
      if (data.completedLessons === 1 && data.hasSeenInvitePrompt === false) {
        setInvitePromptVisible(true);
      }
    } catch { /* silent */ }
  })();
}, [lessonJustCompleted, userId]);

// Render modal conditionally:
<InviteFriendsPrompt
  visible={invitePromptVisible}
  referralCode={stats?.referralCode ?? ''}
  userId={userId ?? ''}
  onDismiss={() => setInvitePromptVisible(false)}
/>
```

> Note: the users `/stats` endpoint may not currently return `hasSeenInvitePrompt`. If it doesn't, extend it in `server/src/users/users.controller.ts` (stats endpoint) to include the flag — this is a ~5-line change.

- [ ] **Step 3: Ensure stats endpoint returns the flag**

Open `server/src/users/users.controller.ts` and find the stats endpoint (likely `@Get(':id/stats')` or similar). Wherever it assembles the response body, add `hasSeenInvitePrompt: user.hasSeenInvitePrompt` to the returned object. If the endpoint delegates to a `getStats()` service method, edit that method's return instead.

Rebuild + manual verify:
```bash
cd /Users/axelmisson/mindy_final/server && npm run build
```

Expected: exit 0. The new field will appear in the JSON response when the endpoint is called.

- [ ] **Step 4: Typecheck + commit**

```bash
cd /Users/axelmisson/mindy_final/mobile && npx tsc --noEmit
cd /Users/axelmisson/mindy_final/server && npm run build
cd /Users/axelmisson/mindy_final && git add mobile/app/lesson/ server/src/users/
git commit -m "feat: trigger InviteFriendsPrompt after first completed lesson"
```

---

## Phase 8 · Validation

### Task 32: Manual end-to-end test

No code changes — just verification. If anything fails, fix it in its own commit and re-run.

- [ ] **Step 1: Start backend locally OR use deployed API**

If local: `cd server && npm run start:dev`. If deployed: make sure `EXPO_PUBLIC_API_URL` points to your Render URL.

- [ ] **Step 2: Start Expo**

```bash
cd /Users/axelmisson/mindy_final/mobile && npm start
```

- [ ] **Step 3: Run the flow on a physical device (or simulator)**

Path A — **Crypto**, no email, skip notifications:
- Welcome → Crypto → "Curious" → 10 min → Mindy intro → Demo (all 3) → Results → username `testuser1` → Skip notifications.
- Verify: land on `/(tabs)`, user created in DB with no email override, `dailyMinutes=10`, `reminderHour=null`.

Path B — **Finance**, with email, enable notifications:
- Welcome → Finance → "Invest" → 15 min → Mindy → Demo (finance questions!) → Results → username `testuser2`, email `you@example.com` → Enable reminders at 20:00.
- Verify: land on `/(tabs)`, user has real email, `reminderHour=20`. Check Resend dashboard (or server logs if RESEND_API_KEY unset) for the magic-link email.

Path C — **Resume** after kill:
- Start the flow, advance to step 5 (`mindy_intro`), kill the app (swipe up in recents).
- Reopen. Expected: land back on `mindy_intro`, all prior choices retained.

Path D — **Magic-link click**:
- From Path B email, click the link on the device. Expected: deep link opens the app on the `verify/[token]` screen, then success, then `/(tabs)`.

Path E — **First lesson invite**:
- After Path A completion, open the first lesson, complete it. Expected: `InviteFriendsPrompt` modal appears. Dismiss → check `hasSeenInvitePrompt=true` in DB. Complete a second lesson → modal does NOT reappear.

- [ ] **Step 4: Run all tests one more time**

```bash
cd /Users/axelmisson/mindy_final/server && npx jest
cd /Users/axelmisson/mindy_final/mobile && npm test
```

Both should be green.

- [ ] **Step 5: Push to `main`**

```bash
cd /Users/axelmisson/mindy_final && git push origin main
```

This triggers:
- Render redeploy of the API (~5 min).
- GitHub Actions EAS Update for the mobile bundle (~30 s) on channel `preview`.

- [ ] **Step 6: Final cleanup**

Delete the old `mobile/app/onboarding/index.tsx` monolith contents were replaced in Task 27. Double-check no dead files remain:

```bash
cd /Users/axelmisson/mindy_final && git status
```

If clean, you're done. If dangling files remain (e.g. leftover unused styles from the old monolith that sneaked into your tree), remove them in a final cleanup commit:

```bash
git add -A
git commit -m "chore: clean up remnants of old onboarding monolith"
git push
```

---

## Done Criteria

- [ ] All 32 tasks completed and committed.
- [ ] All backend tests pass.
- [ ] All mobile store/data tests pass.
- [ ] Manual paths A-E walked on a real device without regressions.
- [ ] Render deploy is green (check `https://mindy-api.onrender.com/api/docs`).
- [ ] EAS Update published (check `https://expo.dev/accounts/axel877/projects/mindy/updates`).
- [ ] Old `mobile/app/onboarding/index.tsx` is ~80 lines (the new router), not 1600.

---

## Appendix · File inventory

**New files:**
- `server/src/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.service.spec.ts`
- `server/src/notifications/email.service.ts`
- `mobile/src/components/mindy/MindyMascot.tsx` + `moods/{Neutral,Hype,Roast,Thinking}Face.tsx` + `index.ts`
- `mobile/src/components/friends/InviteFriendsPrompt.tsx`
- `mobile/app/onboarding/_layout.tsx`
- `mobile/app/onboarding/components/{OnboardingScreen,ProgressBar,PrimaryButton}.tsx`
- `mobile/app/onboarding/hooks/{useOnboardingStore,useDemoQuestions,finalize}.ts` + `useOnboardingStore.spec.ts`
- `mobile/app/onboarding/data/demoQuestions.ts` + `demoQuestions.spec.ts`
- `mobile/app/onboarding/steps/{Welcome,Domain,Goal,Time,MindyIntro,DemoIntro,DemoQuestion,Results,Signup,Notifications}Step.tsx`
- `mobile/app/auth/verify/[token].tsx`
- `mobile/jest.config.js`, `mobile/tsconfig.jest.json`

**Modified files:**
- `server/prisma/schema.prisma`
- `server/src/users/{users.service,users.controller,dto/*}.ts`
- `server/src/users/users.service.spec.ts`
- `server/src/notifications/notifications.module.ts`
- `server/src/app.module.ts`
- `server/package.json`
- `mobile/app/onboarding/index.tsx` (full rewrite)
- `mobile/app/lesson/[id].tsx` (or wherever lesson completion lives)
- `mobile/src/components/MindyMessage.tsx`
- `mobile/package.json`
