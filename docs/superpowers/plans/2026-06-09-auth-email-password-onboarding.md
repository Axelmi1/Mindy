# Auth Email/Password + Onboarding Entry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passwordless device-identity scheme with professional email/password + JWT auth, route logged-out users to a clean login screen whose primary CTA starts onboarding, collect email+password during onboarding, and make logout fully reset local state.

**Architecture:** NestJS gains a JWT auth stack (`@nestjs/jwt` + `passport-jwt` + `bcrypt`) with a **global `JwtAuthGuard` (secure-by-default)** and an `@Public()` opt-out. The mobile client attaches a bearer token (in-memory, hydrated from `AsyncStorage`) to every request; `useUser` manages the session via `/auth/me`. Onboarding's Signup step collects email+password and registers via `POST /auth/register`.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres/Neon), Zod, bcrypt, `@nestjs/jwt`, `passport-jwt`; Expo Router, React Native, Zustand, AsyncStorage, jest/ts-jest.

**Reference spec:** `docs/superpowers/specs/2026-06-09-auth-email-password-onboarding-design.md`

---

## File Structure

**Backend (`server/`)**
- Create: `src/auth/public.decorator.ts` — `@Public()` metadata decorator.
- Create: `src/auth/jwt.strategy.ts` — passport-jwt strategy, validates user.
- Create: `src/auth/jwt-auth.guard.ts` — global guard honoring `@Public()`.
- Create: `src/auth/jwt-auth.guard.spec.ts`, `src/auth/auth.service.spec.ts` — tests.
- Create: `src/users/user.mapper.ts` — extracted `mapUserToResponse` (DRY between users + auth).
- Modify: `prisma/schema.prisma` (add `password`), `prisma/seed.ts` (seed password).
- Modify: `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.module.ts`.
- Modify: `src/users/users.service.ts`, `src/users/users.controller.ts`, `src/users/users.module.ts`.
- Modify: `src/app.module.ts` (global guard), `src/main.ts` (JWT_SECRET check).
- Modify: `src/subscriptions/stripe-webhook.controller.ts`, `src/progress/progress.controller.ts` (`@Public()`).

**Shared (`shared/`)**
- Modify: `types/api.ts` (RegisterDto/LoginDto/AuthResponse + CreateUserDto.password), `types/index.ts` (exports). Rebuild `dist/`.

**Mobile (`mobile/`)**
- Modify: `src/api/client.ts` (token store, header, 401, `authApi`).
- Modify: `src/hooks/useUser.ts` (token, `/auth/me`, `login`, `clearUser`).
- Modify: `app/onboarding/hooks/useOnboardingStore.ts` (password + partialize).
- Modify: `app/onboarding/hooks/finalizeOnboarding.ts` (register flow) + `__tests__/onboarding/finalizeOnboarding.spec.ts`.
- Modify: `app/onboarding/steps/SignupStep.tsx` (email+password fields).
- Modify: `app/login.tsx` (redesign), `app/index.tsx` (logged-out → `/login`).

> ⚠️ Intermediate states are intentionally broken: once the global guard lands (Task 8) the mobile app cannot call the API until token plumbing lands (Tasks 11–12). The feature is verified working end-to-end only at Task 18. Do **not** deploy mid-plan.

---

## Task 1: Add `password` to the User model + migration

**Files:**
- Modify: `server/prisma/schema.prisma:10-51`

- [ ] **Step 1: Add the nullable column**

In `server/prisma/schema.prisma`, inside `model User`, add after the `username` line (`username String @unique`):

```prisma
  password                String?
```

- [ ] **Step 2: Create + apply the migration**

Run: `cd server && npx prisma migrate dev --name add_user_password`
Expected: a new folder under `prisma/migrations/<timestamp>_add_user_password/` with `migration.sql` containing `ALTER TABLE "users" ADD COLUMN "password" TEXT;`, and "Your database is now in sync".

> If `migrate dev` fails on the Neon shadow database, create the migration SQL by hand: `mkdir -p prisma/migrations/0000_add_user_password` and write `ALTER TABLE "users" ADD COLUMN "password" TEXT;` into `migration.sql`, then `npx prisma migrate deploy`. The column is nullable so it is safe on existing rows.

- [ ] **Step 3: Regenerate the Prisma client**

Run: `cd server && npx prisma generate`
Expected: "Generated Prisma Client". `prisma.user` now accepts `password`.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "feat(auth): ajouter la colonne password (nullable) au modèle User

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Shared auth types

**Files:**
- Modify: `shared/types/api.ts:58-77`
- Modify: `shared/types/index.ts`

- [ ] **Step 1: Add the DTOs**

In `shared/types/api.ts`, replace the `CreateUserDto` interface (lines 58-65) with this and append the three new interfaces directly after it:

```ts
export interface CreateUserDto {
  username: string;
  email?: string;
  password?: string;
  preferredDomain?: 'CRYPTO' | 'FINANCE' | 'BOTH';
  userGoal?: string;
  dailyMinutes?: 5 | 10 | 15;
  reminderHour?: number;
}

export interface RegisterDto {
  email: string;
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
```

`AuthResponse` references `User`. Confirm `shared/types/api.ts` already imports it (it imports from `./user` near the top); if not, add `import type { User } from './user';` at the top.

- [ ] **Step 2: Export them**

In `shared/types/index.ts`, find the block that re-exports the api types (around `CreateUserDto, UpdateUserDto`) and add `RegisterDto`, `LoginDto`, `AuthResponse` to the same `export type { ... } from './api';` list.

- [ ] **Step 3: Rebuild the shared package (required for mobile resolution)**

Run: `cd shared && npm run build`
Expected: no errors; `shared/dist/api.d.ts` now contains `RegisterDto`, `LoginDto`, `AuthResponse`.
Verify: `grep -c "RegisterDto" shared/dist/api.d.ts` → `≥ 1`.

- [ ] **Step 4: Commit**

```bash
git add shared/types shared/dist
git commit -m "feat(shared): types RegisterDto/LoginDto/AuthResponse + password sur CreateUserDto

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Extract the user response mapper + accept password in `create`

**Files:**
- Create: `server/src/users/user.mapper.ts`
- Modify: `server/src/users/users.controller.ts:259-291` and `:13-15`
- Modify: `server/src/users/users.service.ts:24-59`

- [ ] **Step 1: Create the mapper**

Create `server/src/users/user.mapper.ts`:

```ts
import type { User } from '@mindy/shared';

/** Map a Prisma User row to the public API response shape (never leaks password). */
export function mapUserToResponse(user: {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  streakFreezes: number;
  soundEnabled: boolean;
  lastActiveAt: Date | null;
  preferredDomain?: string | null;
  userGoal?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    maxStreak: user.maxStreak,
    streakFreezes: user.streakFreezes,
    soundEnabled: user.soundEnabled,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    preferredDomain: user.preferredDomain ?? null,
    userGoal: user.userGoal ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
```

- [ ] **Step 2: Use it in the controller**

In `server/src/users/users.controller.ts`, add to the imports (after line 15):

```ts
import { mapUserToResponse } from './user.mapper';
```

Then delete the entire `private mapUserToResponse(...)` method (lines 259-291) and replace every `this.mapUserToResponse` with `mapUserToResponse`. (Occurrences: `create`, `findAll` uses `users.map(this.mapUserToResponse)` → `users.map(mapUserToResponse)`, `findByUsername`, `findOne`, `update`, `addXp`, `updateStreak`, `updateUsername`, `updateSettings`.)

- [ ] **Step 3: Accept `password` in `UsersService.create`**

In `server/src/users/users.service.ts`, inside `create` (the `prisma.user.create({ data: { ... } })` call at lines 31-41), add `password: data.password ?? null,` after the `username:` line:

```ts
      return await this.prisma.user.create({
        data: {
          email: finalEmail,
          username: data.username,
          password: data.password ?? null,
          referralCode,
          preferredDomain: data.preferredDomain ?? null,
          userGoal: data.userGoal ?? null,
          dailyMinutes: data.dailyMinutes ?? null,
          reminderHour: data.reminderHour ?? null,
        },
      });
```

- [ ] **Step 4: Verify it still compiles**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/users
git commit -m "refactor(users): extraire mapUserToResponse + accepter password dans create

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `@Public()` decorator + JwtStrategy + JwtAuthGuard

**Files:**
- Create: `server/src/auth/public.decorator.ts`
- Create: `server/src/auth/jwt.strategy.ts`
- Create: `server/src/auth/jwt-auth.guard.ts`
- Test: `server/src/auth/jwt-auth.guard.spec.ts`

- [ ] **Step 1: Install dependencies**

Run: `cd server && npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt && npm install -D @types/passport-jwt @types/bcrypt`
Expected: packages added to `package.json`.

- [ ] **Step 2: Write the failing guard test**

Create `server/src/auth/jwt-auth.guard.spec.ts`:

```ts
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function ctx(): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('bypasses authentication for @Public() routes', () => {
    const reflector = { getAllAndOverride: () => true } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('delegates to passport for protected routes (does not short-circuit to true)', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    // No bearer token → passport rejects. We only assert it did NOT return the
    // public-bypass `true`; passport throws/returns a non-true value here.
    let result: unknown;
    try { result = guard.canActivate(ctx()); } catch { result = 'threw'; }
    expect(result).not.toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd server && npm test -- jwt-auth.guard`
Expected: FAIL — "Cannot find module './jwt-auth.guard'".

- [ ] **Step 4: Create the decorator**

Create `server/src/auth/public.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route (or controller) as exempt from the global JwtAuthGuard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 5: Create the strategy**

Create `server/src/auth/jwt.strategy.ts`:

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-insecure-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid token');
    }
    return { userId: user.id, username: user.username };
  }
}
```

- [ ] **Step 6: Create the guard**

Create `server/src/auth/jwt-auth.guard.ts`:

```ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `cd server && npm test -- jwt-auth.guard`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add server/src/auth server/package.json server/package-lock.json
git commit -m "feat(auth): décorateur @Public + JwtStrategy + JwtAuthGuard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: AuthService register/login/me

**Files:**
- Modify: `server/src/auth/auth.service.ts`
- Test: `server/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/auth/auth.service.spec.ts`:

```ts
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

function makeService(over: any = {}) {
  const prisma = {
    user: { findUnique: jest.fn() },
    magicLinkToken: { updateMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
    ...over.prisma,
  };
  const jwt = { sign: jest.fn(() => 'signed.jwt.token'), ...over.jwt };
  const users = { create: jest.fn(), findById: jest.fn(), ...over.users };
  const email = { sendMagicLink: jest.fn() };
  const service = new AuthService(prisma as any, email as any, jwt as any, users as any);
  return { service, prisma, jwt, users };
}

describe('AuthService.register', () => {
  it('hashes the password, creates the user and returns a token', async () => {
    const { service, users, jwt } = makeService({
      users: { create: jest.fn(async (d: any) => ({ id: 'u1', username: d.username, password: d.password })) },
    });
    const out = await service.register({ email: 'A@B.com', password: 'secret12', username: 'sat' });
    const created = (users.create as jest.Mock).mock.calls[0][0];
    expect(created.email).toBe('a@b.com'); // normalised lower-case
    expect(created.password).not.toBe('secret12'); // hashed
    expect(await bcrypt.compare('secret12', created.password)).toBe(true);
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', username: 'sat' });
    expect(out.accessToken).toBe('signed.jwt.token');
  });
});

describe('AuthService.login', () => {
  it('returns a token for valid credentials', async () => {
    const hash = await bcrypt.hash('secret12', 12);
    const { service, jwt } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => ({ id: 'u1', username: 'sat', password: hash })) } },
    });
    const out = await service.login({ email: 'a@b.com', password: 'secret12' });
    expect(jwt.sign).toHaveBeenCalled();
    expect(out.accessToken).toBe('signed.jwt.token');
  });

  it('rejects a wrong password', async () => {
    const hash = await bcrypt.hash('secret12', 12);
    const { service } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => ({ id: 'u1', username: 'sat', password: hash })) } },
    });
    await expect(service.login({ email: 'a@b.com', password: 'WRONG' })).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the user has no password (legacy account)', async () => {
    const { service } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => ({ id: 'u1', username: 'sat', password: null })) } },
    });
    await expect(service.login({ email: 'a@b.com', password: 'whatever' })).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an unknown email', async () => {
    const { service } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => null) } },
    });
    await expect(service.login({ email: 'no@one.com', password: 'x' })).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd server && npm test -- auth.service`
Expected: FAIL — `AuthService` constructor has the wrong arity / `register` is not a function.

- [ ] **Step 3: Rewrite the service**

Replace the entire contents of `server/src/auth/auth.service.ts`:

```ts
import { Injectable, NotFoundException, GoneException, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { UsersService } from '../users/users.service';
import type { RegisterDto, LoginDto } from '@mindy/shared';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const LINK_BASE = process.env.MAGIC_LINK_BASE_URL ?? 'mindy://auth/verify';
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      password: passwordHash,
      preferredDomain: dto.preferredDomain,
      userGoal: dto.userGoal,
      dailyMinutes: dto.dailyMinutes,
      reminderHour: dto.reminderHour,
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    return this.issueToken(user);
  }

  async me(userId: string) {
    return this.users.findById(userId);
  }

  private issueToken(user: { id: string; username: string }) {
    const accessToken = this.jwt.sign({ sub: user.id, username: user.username });
    return { accessToken, user };
  }

  // ── Magic link (unchanged) ────────────────────────────────────────────────
  async sendMagicLink(userId: string, email: string): Promise<void> {
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

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd server && npm test -- auth.service`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/auth/auth.service.ts server/src/auth/auth.service.spec.ts
git commit -m "feat(auth): register/login/me dans AuthService (bcrypt + JWT)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: AuthController endpoints + AuthModule wiring

**Files:**
- Modify: `server/src/auth/auth.controller.ts`
- Modify: `server/src/auth/auth.module.ts`

- [ ] **Step 1: Rewrite the controller**

Replace the entire contents of `server/src/auth/auth.controller.ts`:

```ts
import { BadRequestException, Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { mapUserToResponse } from '../users/user.mapper';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  preferredDomain: z.enum(['CRYPTO', 'FINANCE', 'BOTH']).optional(),
  userGoal: z.string().optional(),
  dailyMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MagicLinkSchema = z.object({
  userId: z.string().cuid(),
  email: z.string().email(),
});

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async register(@Body() body: unknown) {
    const dto = this.parse(RegisterSchema, body);
    const { accessToken, user } = await this.auth.register(dto);
    return { success: true, data: { accessToken, user: mapUserToResponse(user) } };
  }

  @Public()
  @Post('login')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async login(@Body() body: unknown) {
    const dto = this.parse(LoginSchema, body);
    const { accessToken, user } = await this.auth.login(dto);
    return { success: true, data: { accessToken, user: mapUserToResponse(user) } };
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@Req() req: any) {
    const user = await this.auth.me(req.user.userId);
    return { success: true, data: mapUserToResponse(user) };
  }

  @Public()
  @Post('magic-link')
  @Throttle({ strict: { limit: 20, ttl: 60_000 } })
  async sendMagicLink(@Body() body: unknown) {
    const parsed = this.parse(MagicLinkSchema, body);
    try {
      await this.auth.sendMagicLink(parsed.userId, parsed.email);
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  @Public()
  @Get('verify/:token')
  async verify(@Param('token') token: string) {
    const user = await this.auth.verify(token);
    return { success: true, data: user };
  }

  private parse<T>(schema: z.ZodType<T>, body: unknown): T {
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message ?? 'Données invalides');
    }
    return result.data;
  }
}
```

- [ ] **Step 2: Wire the module**

Replace the entire contents of `server/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-insecure-secret',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

`UsersModule` already `exports: [UsersService]` (verified at `server/src/users/users.module.ts:12`), so the import resolves.

- [ ] **Step 3: Verify the app compiles and existing tests pass**

Run: `cd server && npx tsc --noEmit -p tsconfig.json && npm test`
Expected: no type errors; all specs pass.

- [ ] **Step 4: Commit**

```bash
git add server/src/auth/auth.controller.ts server/src/auth/auth.module.ts
git commit -m "feat(auth): endpoints register/login/me + câblage JwtModule

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: JWT_SECRET startup check + local env

**Files:**
- Modify: `server/src/main.ts:6-11`
- Modify: `server/.env`

- [ ] **Step 1: Fail fast if the secret is missing**

In `server/src/main.ts`, inside `bootstrap()` add as the first lines (before `NestFactory.create`):

```ts
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set — refusing to start (tokens would be signed with an insecure default).');
  }
```

- [ ] **Step 2: Add the secret locally**

Append to `server/.env` (create it if absent):

```
JWT_SECRET=local-dev-change-me-32-chars-minimum-please
```

- [ ] **Step 3: Verify the server boots**

Run: `cd server && npx nest start &` then wait for the banner, confirm it prints "Running on port", then stop it (`kill %1`).
Expected: banner prints; no "JWT_SECRET is not set" error. (Sanity check the negative case once: unset `JWT_SECRET` and confirm the server refuses to start with the expected message.)

- [ ] **Step 4: Commit (do NOT commit `.env`)**

```bash
git add server/src/main.ts
git commit -m "feat(auth): refuser le démarrage sans JWT_SECRET

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> Deployment reminder (do at deploy time, Task 18): add `JWT_SECRET` to the Render service env.

---

## Task 8: Register the global guard + mark remaining public routes

**Files:**
- Modify: `server/src/app.module.ts:1-65`
- Modify: `server/src/subscriptions/stripe-webhook.controller.ts:33-35,50`
- Modify: `server/src/progress/progress.controller.ts:271`

- [ ] **Step 1: Add the global JwtAuthGuard**

In `server/src/app.module.ts`, add the import near the other imports:

```ts
import { JwtAuthGuard } from './auth/jwt-auth.guard';
```

Then in the `providers` array (lines 57-63), add a second guard after the `ThrottlerGuard` entry:

```ts
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
```

- [ ] **Step 2: Mark the Stripe webhook public**

In `server/src/subscriptions/stripe-webhook.controller.ts`, add the import:

```ts
import { Public } from '../auth/public.decorator';
```

and add `@Public()` on the controller class (above `@Controller('webhooks')` at line 34):

```ts
@ApiTags('webhooks')
@Public()
@Controller('webhooks')
export class StripeWebhookController {
```

- [ ] **Step 3: Mark the PDF export route public**

In `server/src/progress/progress.controller.ts`, add the import:

```ts
import { Public } from '../auth/public.decorator';
```

and add `@Public()` immediately above the `@Get(':userId/export/pdf')` decorator (line 271):

```ts
  @Public()
  @Get(':userId/export/pdf')
```

- [ ] **Step 4: Verify the guard is wired and public routes are exempt**

Run: `cd server && npx tsc --noEmit -p tsconfig.json && npm test`
Expected: compiles; tests pass.

Manual smoke (optional, needs the server running with `JWT_SECRET` + DB):
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/lessons` → `401` (protected).
- `curl -s -o /dev/null -w "%{http_code}" -X POST localhost:3000/api/auth/login -H 'content-type: application/json' -d '{}'` → `400` (public, reached validation).

- [ ] **Step 5: Commit**

```bash
git add server/src/app.module.ts server/src/subscriptions/stripe-webhook.controller.ts server/src/progress/progress.controller.ts
git commit -m "feat(auth): JwtAuthGuard global + @Public sur webhook Stripe et export PDF

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Seed the test user with a password

**Files:**
- Modify: `server/prisma/seed.ts:403-409` (the `testUser` object) + imports

- [ ] **Step 1: Hash a known password in the seed**

In `server/prisma/seed.ts`, add at the top with the other imports:

```ts
import * as bcrypt from 'bcrypt';
```

Then add `password` to the `testUser` object (around line 403):

```ts
const testUser = {
  email: 'test@mindy.app',
  username: 'test_user',
  password: bcrypt.hashSync(process.env.ADMIN_PASSWORD ?? 'test1234', 12),
  // ...keep the rest of the existing fields unchanged
};
```

- [ ] **Step 2: Re-run the seed**

Run: `cd server && npm run prisma:seed`
Expected: "Created user: test_user" — now with a password. (If the user already exists, the seed may need a reset: `npm run db:reset` recreates from scratch — only do this if losing local data is acceptable.)

- [ ] **Step 3: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "feat(auth): seed un mot de passe sur le compte test (login admin)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Mobile API client — token store, bearer header, 401 handler, authApi

**Files:**
- Modify: `mobile/src/api/client.ts:8-66`, `:982-1000`

- [ ] **Step 1: Import the new shared types**

In `mobile/src/api/client.ts`, extend the type import block (lines 9-18) to include the auth types:

```ts
import type {
  ApiResponse,
  User,
  UserStats,
  Lesson,
  UserProgress,
  UserProgressWithLesson,
  CreateProgressDto,
  CompleteStepDto,
  RegisterDto,
  LoginDto,
  AuthResponse,
} from '@mindy/shared';
```

- [ ] **Step 2: Add the in-memory token store + 401 hook**

In `mobile/src/api/client.ts`, immediately after the `console.log('[API] Base URL:', API_BASE_URL);` line (line 27), add:

```ts
// ── Auth token (in-memory, hydrated from AsyncStorage by useUser at startup) ─
let authToken: string | null = null;
export function setAuthToken(token: string | null): void { authToken = token; }
export function getAuthToken(): string | null { return authToken; }

let onUnauthorized: (() => void) | null = null;
/** Registered by useUser: called when an authenticated request returns 401. */
export function setUnauthorizedHandler(fn: (() => void) | null): void { onUnauthorized = fn; }
```

- [ ] **Step 3: Attach the header + handle 401 in `fetchApi`**

In `fetchApi` (lines 40-57), change the `fetch` headers and the error branch:

```ts
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Only treat 401 as a session-expiry when we actually sent a token —
    // a failed login attempt (no token yet) must NOT trigger a global logout.
    if (response.status === 401 && authToken) {
      onUnauthorized?.();
    }
    const text = await response.text();
    console.log('[API] Error response:', response.status, text.substring(0, 200));
    try {
      const error = JSON.parse(text);
      throw new Error(error.message || `HTTP ${response.status}`);
    } catch {
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }
  }
```

- [ ] **Step 4: Add `authApi` and register it on the aggregate**

In `mobile/src/api/client.ts`, just before the `// User Endpoints` section header (line 68), add:

```ts
// ============================================================================
// Auth Endpoints
// ============================================================================

export const authApi = {
  register: (body: RegisterDto) =>
    fetchApi<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (email: string, password: string) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password } as LoginDto),
    }),
  me: () => fetchApi<User>('/auth/me'),
};
```

Then add `auth: authApi,` to the `export const api = { ... }` object (around line 983, first entry):

```ts
export const api = {
  auth: authApi,
  users: usersApi,
  // ...rest unchanged
};
```

- [ ] **Step 5: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors (new shared types resolve from the rebuilt `shared/dist`).

- [ ] **Step 6: Commit**

```bash
git add mobile/src/api/client.ts
git commit -m "feat(auth): client mobile — token bearer, handler 401, authApi

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: `useUser` — token session, login, full logout reset

**Files:**
- Modify: `mobile/src/hooks/useUser.ts` (whole file)

- [ ] **Step 1: Rewrite the hook**

Replace the entire contents of `mobile/src/hooks/useUser.ts`:

```ts
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setAuthToken, setUnauthorizedHandler } from '@/api/client';

const TOKEN_KEY = '@mindy/auth_token';
const USER_ID_KEY = '@mindy/user_id';
const USERNAME_KEY = '@mindy/username';
const ADMIN_KEY = '@mindy/admin_mode';
const ONBOARDING_KEY = '@mindy/onboarding_state';
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface UserState {
  userId: string | null;
  username: string | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
}

/**
 * Manages the authenticated session (email/password + JWT).
 * The session is the bearer token in AsyncStorage; identity is verified via /auth/me.
 */
export function useUser() {
  const [state, setState] = useState<UserState>({
    userId: null,
    username: null,
    token: null,
    isLoading: true,
    isLoggedIn: false,
    error: null,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Logout / full reset — "always start fresh".
  const clearUser = useCallback(async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY, USERNAME_KEY, ADMIN_KEY, ONBOARDING_KEY]);
    try {
      // Lazy require avoids a src→app import cycle and keeps jest happy.
      const { useOnboardingStore } = require('../../app/onboarding/hooks/useOnboardingStore');
      useOnboardingStore.getState().reset();
    } catch {
      /* store not loaded (e.g. unit tests) — nothing to reset */
    }
    setState({ userId: null, username: null, token: null, isLoading: false, isLoggedIn: false, error: null });
  }, []);

  const checkExistingUser = useCallback(async () => {
    try {
      const [storedToken, storedUserId, storedUsername] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_ID_KEY),
        AsyncStorage.getItem(USERNAME_KEY),
      ]);

      if (!storedToken) {
        setAuthToken(null);
        setState({ userId: null, username: null, token: null, isLoading: false, isLoggedIn: false, error: null });
        return false;
      }

      setAuthToken(storedToken);

      try {
        const res = await fetchWithTimeout(
          `${API_URL}/auth/me`,
          { headers: { Authorization: `Bearer ${storedToken}` } },
          5000,
        );
        if (res.ok) {
          const data = await res.json();
          const user = data?.data;
          const username = user?.username ?? storedUsername;
          const userId = user?.id ?? storedUserId;
          if (username && username !== storedUsername) await AsyncStorage.setItem(USERNAME_KEY, username);
          if (userId && userId !== storedUserId) await AsyncStorage.setItem(USER_ID_KEY, userId);
          setState({ userId, username, token: storedToken, isLoading: false, isLoggedIn: true, error: null });
          return true;
        }
        if (res.status === 401) {
          await clearUser();
          return false;
        }
        // Other server error — trust cached creds rather than logging the user out.
        if (storedUserId) {
          setState({ userId: storedUserId, username: storedUsername, token: storedToken, isLoading: false, isLoggedIn: true, error: null });
          return true;
        }
      } catch {
        // Offline / timeout — trust cached creds.
        if (storedUserId) {
          setState({ userId: storedUserId, username: storedUsername, token: storedToken, isLoading: false, isLoggedIn: true, error: null });
          return true;
        }
      }

      await clearUser();
      return false;
    } catch (err) {
      setState({
        userId: null,
        username: null,
        token: null,
        isLoading: false,
        isLoggedIn: false,
        error: err instanceof Error ? err.message : 'Failed to check user',
      });
      return false;
    }
  }, [API_URL, clearUser]);

  // Email/password login.
  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password); // throws on 401 (bad creds)
    if (!res.success || !res.data) throw new Error(res.message || 'Connexion échouée');
    const { accessToken, user } = res.data;
    setAuthToken(accessToken);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [USER_ID_KEY, user.id],
      [USERNAME_KEY, user.username],
    ]);
    setState({ userId: user.id, username: user.username, token: accessToken, isLoading: false, isLoggedIn: true, error: null });
    return user;
  }, []);

  const initUser = useCallback(async () => {
    await checkExistingUser();
  }, [checkExistingUser]);

  useEffect(() => {
    checkExistingUser();
  }, [checkExistingUser]);

  // A 401 on any authenticated request = session expired → reset + go to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearUser().then(() => {
        try {
          const { router } = require('expo-router');
          router.replace('/login');
        } catch {
          /* router unavailable (tests) */
        }
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearUser]);

  return { ...state, initUser, login, clearUser, refreshUser: checkExistingUser };
}
```

- [ ] **Step 2: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/hooks/useUser.ts
git commit -m "feat(auth): useUser — session JWT (/auth/me), login, reset complet au logout

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Onboarding store — password field, excluded from persistence

**Files:**
- Modify: `mobile/app/onboarding/hooks/useOnboardingStore.ts`
- Test: `mobile/__tests__/onboarding/useOnboardingStore.spec.ts`

- [ ] **Step 1: Add a failing test for password handling**

Append to `mobile/__tests__/onboarding/useOnboardingStore.spec.ts` (inside the existing top-level `describe`, or as a new `describe`):

```ts
import { useOnboardingStore } from '../../app/onboarding/hooks/useOnboardingStore';

describe('onboarding password', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('stores the password in memory', () => {
    useOnboardingStore.getState().setPassword('secret12');
    expect(useOnboardingStore.getState().password).toBe('secret12');
  });

  it('clears the password on reset', () => {
    useOnboardingStore.getState().setPassword('secret12');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().password).toBe('');
  });

  it('excludes the password from the persisted slice', () => {
    const persisted = (useOnboardingStore.persist.getOptions().partialize as any)({
      ...useOnboardingStore.getState(),
      password: 'secret12',
    });
    expect(persisted.password).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd mobile && npm test -- useOnboardingStore`
Expected: FAIL — `setPassword is not a function` / `partialize` is undefined.

- [ ] **Step 3: Add `password` + `setPassword` + `partialize`**

In `mobile/app/onboarding/hooks/useOnboardingStore.ts`:

In the `OnboardingState` interface (after `email: string | null;`, line 34) add:

```ts
  password: string;
```

In the actions section of the interface (after `setEmail: ...`, line 49) add:

```ts
  setPassword: (p: string) => void;
```

In `initialState` (after `email: null,`, line 64) add:

```ts
  password: '',
```

In the store creator (after `setEmail: (email) => set({ email }),`, line 95) add:

```ts
      setPassword: (password) => set({ password }),
```

In the `persist` options object (after the `storage:` line, line 101) add:

```ts
      partialize: (state) => {
        // Never persist the plaintext password to AsyncStorage.
        const { password: _password, ...rest } = state;
        return rest as OnboardingState;
      },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd mobile && npm test -- useOnboardingStore`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/app/onboarding/hooks/useOnboardingStore.ts mobile/__tests__/onboarding/useOnboardingStore.spec.ts
git commit -m "feat(onboarding): champ password (hors persistance AsyncStorage)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: `finalizeOnboarding` → register flow

**Files:**
- Modify: `mobile/app/onboarding/hooks/finalizeOnboarding.ts` (whole file)
- Test: `mobile/__tests__/onboarding/finalizeOnboarding.spec.ts` (rewrite)

- [ ] **Step 1: Rewrite the failing test**

Replace the entire contents of `mobile/__tests__/onboarding/finalizeOnboarding.spec.ts`:

```ts
import { runFinalize, toPlatformEnum, FinalizeDeps } from '../../app/onboarding/hooks/finalizeOnboarding';

const baseState = {
  username: 'satoshi',
  email: 'sat@example.com',
  password: 'secret12',
  domain: 'CRYPTO' as const,
  goal: 'invest',
  dailyMinutes: 5 as const,
  reminderHour: 9,
  notificationsEnabled: false,
};

function makeDeps(over: Partial<FinalizeDeps> = {}): FinalizeDeps {
  return {
    apiUrl: 'http://api.test/api',
    getExistingUserId: async () => null,
    getExistingToken: async () => null,
    persistAuth: async () => {},
    clearOnboarding: async () => {},
    navigateToApp: () => {},
    requestPushPermission: async () => true,
    getPushToken: async () => 'ExponentPushToken[xxx]',
    platformOS: 'ios',
    fetchImpl: jest.fn(async (url: string) => {
      if (url.endsWith('/auth/register')) {
        return {
          ok: true,
          status: 201,
          json: async () => ({ success: true, data: { accessToken: 'jwt.tok', user: { id: 'u1', username: 'satoshi' } } }),
        } as any;
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) } as any;
    }),
    ...over,
  };
}

describe('toPlatformEnum', () => {
  it('mappe ios/android vers IOS/ANDROID', () => {
    expect(toPlatformEnum('ios')).toBe('IOS');
    expect(toPlatformEnum('android')).toBe('ANDROID');
    expect(toPlatformEnum('web')).toBe('ANDROID');
  });
});

describe('runFinalize', () => {
  it('enregistre via /auth/register puis navigue', async () => {
    const deps = makeDeps();
    await runFinalize(baseState, deps);
    const urls = (deps.fetchImpl as jest.Mock).mock.calls.map((c) => c[0]);
    expect(urls).toContain('http://api.test/api/auth/register');
  });

  it('persiste le token + id renvoyés', async () => {
    const persistAuth = jest.fn(async () => {});
    await runFinalize(baseState, makeDeps({ persistAuth }));
    expect(persistAuth).toHaveBeenCalledWith('jwt.tok', 'u1', 'satoshi');
  });

  it('est idempotent : ne ré-enregistre pas si un user existe déjà', async () => {
    const deps = makeDeps({ getExistingUserId: async () => 'existing' });
    await runFinalize(baseState, deps);
    const posts = (deps.fetchImpl as jest.Mock).mock.calls
      .filter((c) => c[0] === 'http://api.test/api/auth/register');
    expect(posts).toHaveLength(0);
  });

  it('enregistre le push token avec platform + header Authorization', async () => {
    const deps = makeDeps();
    await runFinalize({ ...baseState, notificationsEnabled: true }, deps);
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeTruthy();
    expect(JSON.parse(call[1].body)).toMatchObject({ userId: 'u1', token: 'ExponentPushToken[xxx]', platform: 'IOS' });
    expect(call[1].headers.Authorization).toBe('Bearer jwt.tok');
  });

  it('ne plante pas si la permission push est refusée', async () => {
    const deps = makeDeps({ requestPushPermission: async () => false });
    await expect(runFinalize({ ...baseState, notificationsEnabled: true }, deps)).resolves.toBeUndefined();
    const call = (deps.fetchImpl as jest.Mock).mock.calls
      .find((c) => c[0] === 'http://api.test/api/notifications/register-token');
    expect(call).toBeFalsy();
  });

  it('propage une erreur claire en cas de 409', async () => {
    const deps = makeDeps({
      fetchImpl: jest.fn(async () => ({ ok: false, status: 409, json: async () => ({ message: 'taken' }) } as any)),
    });
    await expect(runFinalize(baseState, deps)).rejects.toThrow(/taken|déjà pris/i);
  });

  it('refuse de continuer sans mot de passe (nouveau compte)', async () => {
    const deps = makeDeps();
    await expect(runFinalize({ ...baseState, password: '' }, deps)).rejects.toThrow(/mot de passe/i);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd mobile && npm test -- finalizeOnboarding`
Expected: FAIL — `getExistingToken`/`persistAuth` not part of `FinalizeDeps`, register URL not called.

- [ ] **Step 3: Rewrite the implementation**

Replace the entire contents of `mobile/app/onboarding/hooks/finalizeOnboarding.ts`:

```ts
import { useOnboardingStore } from './useOnboardingStore';

const REQUEST_TIMEOUT_MS = 60000; // large : couvre le cold-start Render (~42s)

export type FinalizeState = {
  username: string;
  email: string | null;
  password: string;
  domain: string | null;
  goal: string | null;
  dailyMinutes: 5 | 10 | 15 | null;
  reminderHour: number | null;
  notificationsEnabled: boolean;
};

/** Signature minimale de fetch dont on a besoin (toujours appelé avec une URL string). */
export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface FinalizeDeps {
  apiUrl: string;
  getExistingUserId: () => Promise<string | null>;
  getExistingToken: () => Promise<string | null>;
  persistAuth: (token: string, id: string, username: string) => Promise<void>;
  clearOnboarding: () => Promise<void>;
  navigateToApp: () => void;
  requestPushPermission: () => Promise<boolean>;
  getPushToken: () => Promise<string>;
  platformOS: string;
  fetchImpl: FetchLike;
}

export function toPlatformEnum(os: string): 'IOS' | 'ANDROID' {
  return os === 'ios' ? 'IOS' : 'ANDROID';
}

async function fetchWithTimeout(
  fetchImpl: FetchLike, input: string, init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Orchestration testable (sans dépendances natives). */
export async function runFinalize(state: FinalizeState, deps: FinalizeDeps): Promise<void> {
  const { apiUrl, fetchImpl } = deps;

  // 1) Inscription idempotente : si un user existe déjà, on réutilise son token.
  let userId = await deps.getExistingUserId();
  let username = state.username;
  let token = await deps.getExistingToken();

  if (!userId) {
    if (!state.email) throw new Error('Email manquant. Reviens à l’étape précédente.');
    if (!state.password) throw new Error('Mot de passe manquant. Reviens à l’étape précédente.');

    const body = {
      username: state.username,
      email: state.email,
      password: state.password,
      preferredDomain: state.domain ?? undefined,
      userGoal: state.goal ?? undefined,
      dailyMinutes: state.dailyMinutes ?? undefined,
      reminderHour: state.reminderHour ?? undefined,
    };

    let resp: Response;
    try {
      resp = await fetchWithTimeout(fetchImpl, `${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`Cannot reach the server (${(err as Error).message}). API: ${apiUrl}`);
    }
    if (!resp.ok) {
      let serverMsg = '';
      try {
        const b = await resp.json();
        serverMsg = typeof b?.message === 'string' ? b.message : (b?.message?.message ?? '');
      } catch { /* ignore */ }
      if (resp.status === 409) throw new Error(serverMsg || 'Ce nom ou cet email est déjà pris.');
      throw new Error(`Failed to register (HTTP ${resp.status}${serverMsg ? ` — ${serverMsg}` : ''})`);
    }
    const { data } = await resp.json();
    token = data.accessToken;
    userId = data.user.id as string;
    username = data.user.username;
    await deps.persistAuth(token as string, userId, username);
  }

  // 2) Push token — endpoint + platform + permission + header auth (non bloquant).
  if (state.notificationsEnabled) {
    try {
      const granted = await deps.requestPushPermission();
      if (granted) {
        const pushToken = await deps.getPushToken();
        await fetchWithTimeout(fetchImpl, `${apiUrl}/notifications/register-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId, token: pushToken, platform: toPlatformEnum(deps.platformOS),
          }),
        });
      }
    } catch (err) {
      console.warn('[finalize] push token failed (non-blocking):', err);
    }
  }

  await deps.clearOnboarding();
  deps.navigateToApp();
}

/** Point d'entrée réel utilisé par l'UI : câble les vraies dépendances. */
export async function finalizeOnboarding(): Promise<void> {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { router } = require('expo-router');
  const Notifications = require('expo-notifications');
  const { Platform } = require('react-native');
  const Constants = require('expo-constants').default;
  const { setAuthToken } = require('../../../src/api/client');

  const s = useOnboardingStore.getState();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  await runFinalize(
    {
      username: s.username, email: s.email, password: s.password,
      domain: s.domain, goal: s.goal,
      dailyMinutes: s.dailyMinutes, reminderHour: s.reminderHour,
      notificationsEnabled: s.notificationsEnabled,
    },
    {
      apiUrl,
      getExistingUserId: () => AsyncStorage.getItem('@mindy/user_id'),
      getExistingToken: () => AsyncStorage.getItem('@mindy/auth_token'),
      persistAuth: async (token: string, id: string, username: string) => {
        setAuthToken(token);
        await AsyncStorage.multiSet([
          ['@mindy/auth_token', token],
          ['@mindy/user_id', id],
          ['@mindy/username', username],
        ]);
      },
      clearOnboarding: async () => {
        s.reset();
        await AsyncStorage.removeItem('@mindy/onboarding_state');
      },
      navigateToApp: () => router.replace('/(tabs)'),
      requestPushPermission: async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      },
      getPushToken: async () => {
        const t = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        return t.data;
      },
      platformOS: Platform.OS,
      fetchImpl: fetch,
    },
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd mobile && npm test -- finalizeOnboarding`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add mobile/app/onboarding/hooks/finalizeOnboarding.ts mobile/__tests__/onboarding/finalizeOnboarding.spec.ts
git commit -m "feat(onboarding): finaliser via POST /auth/register (token + push authentifié)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Signup step — email (required) + password

**Files:**
- Modify: `mobile/app/onboarding/steps/SignupStep.tsx` (whole file)

- [ ] **Step 1: Rewrite the step**

Replace the entire contents of `mobile/app/onboarding/steps/SignupStep.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MindyTurn } from '../components/MindyTurn';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { suggestUsername, isValidUsername } from '../lib/usernameSuggest';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupStep() {
  const next = useOnboardingStore((s) => s.next);
  const username = useOnboardingStore((s) => s.username);
  const setUsername = useOnboardingStore((s) => s.setUsername);
  const email = useOnboardingStore((s) => s.email);
  const setEmail = useOnboardingStore((s) => s.setEmail);
  const password = useOnboardingStore((s) => s.password);
  const setPassword = useOnboardingStore((s) => s.setPassword);
  const setMood = useOnboardingStore((s) => s.setMood);
  useEffect(() => { setMood('neutral'); }, [setMood]);

  const suggested = useMemo(() => suggestUsername(Date.now()), []);
  useEffect(() => {
    if (!username) setUsername(suggested);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [emailText, setEmailText] = useState(email ?? '');
  const [pwText, setPwText] = useState(password ?? '');

  const usernameOk = isValidUsername(username);
  const emailOk = EMAIL_RE.test(emailText.trim());
  const pwOk = pwText.length >= 8;
  const valid = usernameOk && emailOk && pwOk;

  const handleNext = () => {
    setEmail(emailText.trim());
    setPassword(pwText);
    next();
  };

  return (
    <MindyTurn
      turnKey="signup"
      mood="neutral"
      message="Crée ton compte — pseudo, email et mot de passe."
      ctaLabel="Continuer"
      ctaDisabled={!valid}
      onCta={handleNext}
      keyboardAware
    >
      <View style={styles.field}>
        <Text style={styles.at}>@</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="satoshi"
          placeholderTextColor="#484F58"
          style={[styles.input, usernameOk ? styles.inputOk : styles.inputBad]}
        />
      </View>
      <Text style={styles.hint}>Lettres, chiffres, underscore — 3 à 20 caractères.</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={emailText}
        onChangeText={setEmailText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="ton@email.com"
        placeholderTextColor="#484F58"
        style={[styles.input, emailText.length === 0 || emailOk ? styles.inputOk : styles.inputBad]}
      />
      <Text style={styles.hint}>Sert à te reconnecter sur un autre téléphone.</Text>

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput
        value={pwText}
        onChangeText={setPwText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholder="8 caractères minimum"
        placeholderTextColor="#484F58"
        style={[styles.input, pwText.length === 0 || pwOk ? styles.inputOk : styles.inputBad]}
      />
      <Text style={styles.hint}>Au moins 8 caractères.</Text>
    </MindyTurn>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  at: { fontFamily: 'JetBrainsMono', fontSize: 22, color: '#39FF14' },
  input: {
    flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#E6EDF3',
    backgroundColor: '#161B22', borderRadius: 12, borderWidth: 2, padding: 14,
  },
  inputOk: { borderColor: '#30363D' },
  inputBad: { borderColor: '#F85149' },
  label: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 16, marginBottom: 6 },
  hint: { fontFamily: 'Inter', fontSize: 12, color: '#8B949E', marginTop: 6 },
});
```

> The `email` `<TextInput>` is not wrapped in the `styles.field` row (no `flex:1` sibling), so it keeps full width — same as the original email input.

- [ ] **Step 2: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/app/onboarding/steps/SignupStep.tsx
git commit -m "feat(onboarding): étape signup avec email requis + mot de passe

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Login screen redesign

**Files:**
- Modify: `mobile/app/login.tsx` (whole file)

- [ ] **Step 1: Rewrite the screen**

Replace the entire contents of `mobile/app/login.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/hooks/useUser';
import { Icon } from '@/components/ui/Icon';

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || 'test@mindy.app';
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || 'test1234';

/**
 * Login screen — primary CTA starts onboarding (new user); returning users
 * sign in with email + password. Admin button quick-logs into the dev account.
 */
export default function LoginScreen() {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartLearning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/onboarding');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Connexion échouée', 'Email ou mot de passe incorrect.', [{ text: 'OK' }]);
      setIsLoading(false);
    }
  };

  const handleAdmin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      await AsyncStorage.setItem('@mindy/admin_mode', 'true');
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Admin', 'Compte admin indisponible (vérifie le seed / les identifiants).', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Icon name="brain" size={48} color="#39FF14" />
          </View>
          <Text style={styles.appName}>MINDY</Text>
          <Text style={styles.tagline}>Apprends la crypto & la finance</Text>
        </Animated.View>

        {/* Welcome */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bienvenue</Text>
          <Text style={styles.welcomeText}>
            Deviens bon en trading, crypto et finances perso avec des mini-leçons interactives.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.authSection}>
          {/* Primary: start learning → onboarding */}
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleStartLearning} disabled={isLoading}>
            <Icon name="rocket" size={20} color="#0D1117" />
            <Text style={styles.buttonPrimaryText}>Commencer à apprendre</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>déjà un compte ?</Text>
            <View style={styles.divider} />
          </View>

          {/* Login form */}
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <Pressable
            style={[styles.button, styles.buttonSecondary, (!email.trim() || !password || isLoading) && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={!email.trim() || !password || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#E6EDF3" />
            ) : (
              <Text style={styles.buttonSecondaryText}>Se connecter</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>

      {/* Admin */}
      <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.adminSection}>
        <Pressable style={styles.adminButton} onPress={handleAdmin}>
          <Text style={styles.adminButtonText}>🛠 Admin</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 100, height: 100, borderRadius: 24, backgroundColor: '#161B22',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#39FF14', marginBottom: 16,
  },
  appName: { fontFamily: 'JetBrainsMono', fontSize: 36, fontWeight: '700', color: '#39FF14', letterSpacing: 4 },
  tagline: { fontFamily: 'Inter', fontSize: 14, color: '#8B949E', marginTop: 4 },
  welcomeSection: { alignItems: 'center', marginBottom: 32 },
  welcomeTitle: { fontFamily: 'Inter', fontSize: 28, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },
  welcomeText: { fontFamily: 'Inter', fontSize: 15, color: '#8B949E', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  authSection: { gap: 12 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 10 },
  buttonPrimary: { backgroundColor: '#39FF14' },
  buttonPrimaryText: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700', color: '#0D1117' },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#30363D' },
  buttonSecondaryText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: '#E6EDF3' },
  input: {
    backgroundColor: '#161B22', borderRadius: 12, borderWidth: 1, borderColor: '#30363D',
    paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Inter', fontSize: 15, color: '#E6EDF3',
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: '#30363D' },
  dividerText: { fontFamily: 'Inter', fontSize: 12, color: '#484F58', paddingHorizontal: 16 },
  adminSection: { alignItems: 'center', paddingBottom: 8 },
  adminButton: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
    borderColor: '#30363D', backgroundColor: 'transparent',
  },
  adminButtonText: { fontFamily: 'JetBrainsMono', fontSize: 11, color: '#484F58' },
});
```

- [ ] **Step 2: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors (no leftover references to `referralsApi`/`usersApi`/`initUser`/`clearUser` in this file).

- [ ] **Step 3: Commit**

```bash
git add mobile/app/login.tsx
git commit -m "feat(auth): écran login — CTA onboarding + connexion email/mot de passe, admin conservé

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Logged-out cold start → `/login`

**Files:**
- Modify: `mobile/app/index.tsx:27`

- [ ] **Step 1: Change the redirect target**

In `mobile/app/index.tsx`, change line 27 from:

```tsx
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/onboarding'} />;
```

to:

```tsx
  return <Redirect href={isLoggedIn ? '/(tabs)' : '/login'} />;
```

Also update the file's top comment (lines 6-10) to reflect that logged-out users now land on `/login` (which offers "Commencer à apprendre" → onboarding), not `/onboarding` directly.

- [ ] **Step 2: Type-check**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/app/index.tsx
git commit -m "feat(auth): rediriger les utilisateurs déconnectés vers /login

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Full test suites green

- [ ] **Step 1: Backend**

Run: `cd server && npm test`
Expected: all specs pass (auth.service, jwt-auth.guard, plus pre-existing suites).

- [ ] **Step 2: Mobile**

Run: `cd mobile && npm test`
Expected: all specs pass (finalizeOnboarding, useOnboardingStore, plus pre-existing suites).

- [ ] **Step 3: Type-check both**

Run: `cd server && npx tsc --noEmit -p tsconfig.json && cd ../mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Lint**

Run: `cd server && npm run lint && cd ../mobile && npm run lint`
Expected: no errors (warnings tolerable if pre-existing).

> If anything fails, fix it before proceeding — do not claim completion on red. (Use superpowers:systematic-debugging if a failure is non-obvious.)

---

## Task 18: Manual end-to-end verification (local), then deploy notes

**Prereq:** server running locally with `JWT_SECRET` set and the seed applied; mobile pointed at it (or at Render once `JWT_SECRET` is added there).

- [ ] **Step 1: New-user flow**
Launch app logged-out → lands on `/login` → tap "Commencer à apprendre" → complete onboarding (Signup step requires @username + email + password ≥ 8) → finishes into the tabs. Confirm the account exists (`GET /api/users` shows it / the dashboard loads).

- [ ] **Step 2: Logout resets**
From profile/settings → Logout → lands on `/login`. Tap "Commencer à apprendre" → onboarding starts at **step 1** (not mid-wizard). Confirms `@mindy/onboarding_state` + token were cleared.

- [ ] **Step 3: Returning login**
On `/login`, enter the email + password used in Step 1 → "Se connecter" → lands in tabs. Wrong password → "Email ou mot de passe incorrect" alert, stays on `/login`.

- [ ] **Step 4: Admin**
Tap "🛠 Admin" → logs in as the seed account → tabs load (authenticated API calls succeed).

- [ ] **Step 5: Token enforcement**
While logged in, the app's normal screens (dashboard, lessons, leaderboard) load — confirming the bearer token reaches the now-guarded API. (Optional: temporarily clear `@mindy/auth_token` and confirm a 401 bounces you to `/login`.)

- [ ] **Step 6: Deploy**
Add `JWT_SECRET` to the Render service environment **before** the deploy completes (the server refuses to boot without it). Push the branch; Render runs `prisma migrate deploy` (safe — nullable column) and the seed if configured. Verify the deployed `/api/auth/login` works and the app talks to Render.

> Per project memory, `git push` auto-deploys via Render/EAS — coordinate the `JWT_SECRET` env addition with the push so production doesn't boot-loop.

---

## Self-Review (completed during planning)

- **Spec coverage:** §4.1 deps→T4; §4.2 schema→T1; §4.3 strategy/guard/decorator→T4, module wiring→T6; §4.4 endpoints→T6; §4.5 @Public list→T6(auth)+T8(stripe,pdf); §4.6 create+password→T3; §4.7 seed→T9; §4.8 JWT_SECRET→T7; §5 shared types→T2; §6.1 token plumbing→T10; §6.2 useUser→T11; §6.3 index→T16; §6.4 login→T15; §6.5 store/signup/finalize→T12,T13,T14; §7 error handling→T6/T11/T15; §8 testing→T4,T5,T12,T13,T17,T18; §9 deployment→T1,T7,T9,T18; §10 risks acknowledged in plan header + T18.
- **Type consistency:** `FinalizeDeps` (`getExistingToken`, `persistAuth(token,id,username)`) matches between T13 impl and spec; `AuthResponse { accessToken, user }` consistent across shared (T2), server controller (T6), client `authApi` (T10), `useUser.login` (T11), `runFinalize` (T13). `mapUserToResponse` named identically in T3/T6. `setAuthToken`/`setUnauthorizedHandler` exported in T10, consumed in T11/T13.
- **Placeholders:** none — every code step contains full code.
