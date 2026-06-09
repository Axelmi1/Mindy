# Auth Redesign — Email/Password + Onboarding Entry

**Date:** 2026-06-09
**Branch:** `feat/onboarding-redesign`
**Status:** Approved (design) — pending spec review

## 1. Problem & Context

Today the app has **no real authentication**:

- "Session" = an `@mindy/user_id` string in `AsyncStorage`. `isLoggedIn` is derived purely from its presence (`mobile/src/hooks/useUser.ts`).
- The backend is **passwordless**: every route is public (only a global `ThrottlerGuard`), identity is `POST /users` (create) + `GET /users/by-username/:username` (lookup), plus an email magic-link.
- Logged-out users are redirected **straight to `/onboarding`** (`mobile/app/index.tsx:27`), skipping the login screen entirely.
- The `app/login.tsx` screen is cluttered with dev/test affordances: an "anonymous" start that lands in the tabs **with no account** (because `initUser()` no longer creates anything), "Nouveau compte test", a hidden "Se connecter avec @pseudo" username login, a referral toggle, and dead Google/Apple handlers.
- `clearUser()` (logout) only clears `user_id` + `username` — it leaves `@mindy/onboarding_state` and `@mindy/admin_mode` behind, so "start learning" after logout would **resume mid-wizard** instead of starting fresh.

### Desired behaviour (from the user)

> When I log out and press "start learning" I should go through onboarding (because I'm a new user). Otherwise it should be a simple login/register. No more username login or test-user buttons — but keep the Admin button.

Confirmed design decisions:

- **Auth model:** "Most professional" → real **email + password** auth with **JWT**.
- **Where credentials are collected for new users:** extend the existing onboarding **Signup step**.
- **Existing DB rows:** fresh scheme, **don't migrate** — `password` is nullable; pre-existing accounts (auto-generated emails, no password) simply can't password-login.
- **Route protection (Decision A):** **global `JwtAuthGuard`, secure-by-default**, with an `@Public()` opt-out.
- **Token lifetime (Decision B):** single **long-lived access token (30 days)**, no refresh tokens.
- **Reset on logout:** **always start fresh** — logout wipes token, user id/username, `admin_mode`, and onboarding progress.
- **Login screen layout:** **"Commencer à apprendre"** is the primary green CTA (→ onboarding); email/password login sits below; Admin kept at the bottom.

## 2. Goals / Non-Goals

**Goals**

1. Add professional email/password + JWT auth to the NestJS backend (hashed passwords, protected routes, login/register/me endpoints).
2. Make the mobile app send a bearer token on every request and manage a real session.
3. Redesign `app/login.tsx`: primary "Commencer à apprendre" → onboarding; email/password login; keep Admin; remove username-login, test-user, referral, and dead social code.
4. Collect email + password during onboarding's Signup step and register via `POST /auth/register`.
5. Logout fully resets local state so the next "start learning" is a clean onboarding run.

**Non-Goals (explicitly out of scope)**

- Refresh-token rotation / short-lived access tokens.
- Password reset / "forgot password" flow.
- IDOR hardening — endpoints keep taking `:userId` in the path; we enforce **authentication**, not per-resource **authorization**. (Documented limitation; this gap exists today.)
- Social login (Google/Apple) — dead handlers are removed, not implemented.
- Migrating pre-existing passwordless accounts.

## 3. Target Flow

```
Cold start / after logout
  └─ /login
       ├─ "Commencer à apprendre" (primary)  ──▶ /onboarding
       │        hello → level → domain → goal → time → demo → result
       │        → signup (@username + email + password) → plan
       │        → finalizeOnboarding(): POST /auth/register → {accessToken, user}
       │        → store token + user_id + username → /(tabs)
       ├─ email + password + "Se connecter"  ──▶ POST /auth/login → {accessToken, user}
       │        → store token + user_id + username → /(tabs)
       └─ "🛠 Admin"  ──▶ POST /auth/login (seeded dev creds) → set admin_mode → /(tabs)

Existing logged-in user (token present)
  └─ /index → GET /auth/me (Bearer) → ok → /(tabs)   |   401 → clear → /login
```

## 4. Backend Design (`server/`)

### 4.1 Dependencies

Add: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
Dev: `@types/passport-jwt`, `@types/bcrypt`.

### 4.2 Schema & migration

`prisma/schema.prisma` — add to `User`:

```prisma
password String?   // bcrypt hash; null for legacy/passwordless accounts
```

Nullable ⇒ the generated migration is safe on existing rows. Run `prisma migrate dev` locally to author it; `prisma migrate deploy` applies it on Render.

### 4.3 Auth module (`src/auth/`)

- **`JwtModule.register`** — `secret: process.env.JWT_SECRET`, `signOptions: { expiresIn: '30d' }`. Fail fast at boot if `JWT_SECRET` is unset.
- **`jwt.strategy.ts`** (`passport-jwt`) — extract bearer token; payload `{ sub: userId, username }`; `validate()` loads the user and rejects if missing/soft-deleted; attaches `req.user = { userId, username }`.
- **`jwt-auth.guard.ts`** — `extends AuthGuard('jwt')`; checks the `isPublic` metadata via `Reflector` and bypasses when present.
- **`public.decorator.ts`** — `export const Public = () => SetMetadata('isPublic', true)`.
- **Register globally** in `app.module.ts`: add `{ provide: APP_GUARD, useClass: JwtAuthGuard }` (alongside the existing `ThrottlerGuard`).

### 4.4 Endpoints (`auth.controller.ts`, all Zod-validated to match existing style)

| Method | Route | Public? | Body | Returns |
|---|---|---|---|---|
| POST | `/api/auth/register` | ✅ | `{ email, password, username, preferredDomain?, userGoal?, dailyMinutes?, reminderHour? }` | `{ accessToken, user }` |
| POST | `/api/auth/login` | ✅ | `{ email, password }` | `{ accessToken, user }` |
| GET | `/api/auth/me` | ❌ | — | `{ user }` |
| POST | `/api/auth/magic-link` | ✅ | (unchanged) | `{ success }` |
| GET | `/api/auth/verify/:token` | ✅ | (unchanged) | `{ success, data }` |

- **register:** validate; `bcrypt.hash(password, 12)`; create user (reuse/extend `UsersService.create` to accept `password` + a required `email` + prefs); sign JWT; return token + mapped user. `409` on duplicate email/username (existing P2002 handling).
- **login:** find user by email; `bcrypt.compare`; `401 Unauthorized` ("Email ou mot de passe incorrect") on missing user / null password / mismatch; sign JWT; return token + mapped user.
- **me:** return `mapUserToResponse(req.user)`.
- Password rule: **min 8 chars** (validated both client and server).

### 4.5 `@Public()` allow-list (must be exhaustive)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/magic-link`, `GET /auth/verify/:token`
- `subscriptions/stripe-webhook.controller.ts` (called by Stripe, no token)
- `GET /progress/:id/export/pdf` (opened directly as a URL by `progressExportApi.getPdfUrl`, no header)

> Onboarding makes **no API calls before account creation** (verified — demo questions are local data), so no onboarding endpoint needs to be public.

### 4.6 `UsersService.create`

Extend to accept optional `password` (already-hashed) and to honour a provided `email` (required from register). `POST /users` stays for compatibility but now sits **behind the guard**; the mobile app no longer calls it.

### 4.7 Seed (`prisma/seed.ts`)

Give the seeded `test_user` a bcrypt password so the Admin quick-login works. Creds surfaced via env with safe dev defaults (e.g. `test@mindy.app` / `test1234`).

### 4.8 Env

- `JWT_SECRET` — **required**, add to local `.env` and to Render.

## 5. Shared Types (`shared/types/`)

Add to `api.ts`: `RegisterDto`, `LoginDto`, `AuthResponse { accessToken: string; user: User }`. Extend `CreateUserDto` with optional `password`. The `User` type already omits `password` (response mapper is allow-list based) — keep it that way.

> Note: `shared/types/` ships both `.ts` and `.d.ts`. Confirm whether `.d.ts` are generated (build step) or hand-maintained, and update accordingly during implementation.

## 6. Mobile Design (`mobile/`)

### 6.1 Token plumbing (`src/api/client.ts`)

- Module-level in-memory `authToken: string | null` with `setAuthToken(t)` / `getAuthToken()`; hydrate from `@mindy/auth_token` on first import / app start.
- `fetchApi` attaches `Authorization: Bearer ${token}` when a token is present.
- On a `401`, clear the in-memory token + session keys and emit a redirect to `/login` (single shared handler).
- Add `authApi`: `register(body)`, `login(email, password)`, `me()`.

### 6.2 Session hook (`src/hooks/useUser.ts`)

- Add `token` to state; persist key `@mindy/auth_token`.
- On mount: read token → `setAuthToken` → `GET /auth/me`; ok ⇒ logged in, `401` ⇒ clear.
- Add `login(email, password)`: call `authApi.login`, persist `auth_token` + `user_id` + `username`, set state.
- **Extend `clearUser()`** to `multiRemove(['@mindy/auth_token','@mindy/user_id','@mindy/username','@mindy/admin_mode','@mindy/onboarding_state'])`, reset the onboarding Zustand store, and clear the in-memory token. (Existing logout handlers in `profile.tsx`/`settings.tsx` only call `clearUser()`, so they need no change.)

### 6.3 Root routing (`app/index.tsx`)

Change the logged-out target from `/onboarding` to **`/login`**. Logged-in still → `/(tabs)`.

### 6.4 Login screen (`app/login.tsx`)

**Remove:** `handleAnonymousLogin` (anonymous start), `handleNewTestUser`, `handleUsernameLogin`, the referral toggle/input, the divider, `handleGoogleLogin`/`handleAppleLogin`, and now-unused state/styles.

**New layout (top → bottom):**
1. Branding (keep MINDY logo/tagline/"Bienvenue").
2. **Primary green** `Commencer à apprendre` → `router.replace('/onboarding')`.
3. Email + password inputs + **`Se connecter`** → `useUser.login(email, password)`; on `401` show Alert "Email ou mot de passe incorrect".
4. **`🛠 Admin`** (kept) → `authApi.login(ADMIN_EMAIL, ADMIN_PASSWORD)` → `setAuthToken` + persist + `AsyncStorage.setItem('@mindy/admin_mode','true')` → `/(tabs)`. Creds from `EXPO_PUBLIC_ADMIN_EMAIL` / `EXPO_PUBLIC_ADMIN_PASSWORD`, defaulting to the seed dev creds.

### 6.5 Onboarding signup (`app/onboarding/`)

- **Store (`hooks/useOnboardingStore.ts`):** add `password: string` + `setPassword`. Use `partialize` so **`password` is excluded from the persisted state** (no plaintext password in AsyncStorage). Make `email` effectively required for completion.
- **`steps/SignupStep.tsx`:** add an **email (required)** and a **password (required, ≥ 8)** field beside the existing `@username`; gate the CTA on all three being valid.
- **`hooks/finalizeOnboarding.ts`:** replace `POST /users` with **`POST /auth/register`** (`{ username, email, password, preferredDomain, userGoal, dailyMinutes, reminderHour }`); on success `setAuthToken` + persist `auth_token`/`user_id`/`username`; the push-token registration call then runs authenticated. **Drop** the separate prefs `PATCH` (folded into register) and the magic-link step (email+password is now the recovery path). Update the `FinalizeState`/deps types accordingly.
- **`steps/HelloStep.tsx`:** keep the "J'ai déjà un compte" → `/login` secondary link.

## 7. Error Handling

- **Bad login:** `401` → Alert "Email ou mot de passe incorrect".
- **Duplicate email/username at register:** `409` → field-specific message (reuse existing P2002 handling), surfaced on the Signup step.
- **Expired/invalid token mid-session:** `401` from any call → clear session → `/login`.
- **Server unreachable:** keep existing timeout + "Impossible de joindre le serveur" messaging.

## 8. Testing

- **Backend (jest):** `auth.service` — register hashes & creates, login verifies, wrong password → 401, duplicate → 409; `JwtAuthGuard` — `@Public` bypass vs protected rejection; `jwt.strategy` validate.
- **Mobile:** update existing `__tests__/onboarding/finalize*` specs to the `/auth/register` flow (they currently assert `POST /users` — they **will** break otherwise); add `useUser` login/logout (token persisted, `clearUser` wipes all keys); add a basic login-screen render/login test.
- **Manual E2E (local, before pushing):** register via onboarding → land in tabs; logout → land on `/login` with cleared state; login with the same creds → tabs; wrong password → error; Admin → tabs; protected call without token → 401 → `/login`.

## 9. Migration & Deployment

1. Add `JWT_SECRET` to local `.env` and **Render** env (server won't sign tokens without it).
2. Author migration locally (`prisma migrate dev`); `prisma migrate deploy` runs on Render deploy (nullable column ⇒ safe).
3. Re-run the seed (or patch the test user) so `test_user` has a password.
4. Verify the full flow **locally** before `git push` (global guard is high-blast-radius — a missed `@Public` or a token-plumbing gap breaks the live app).

## 10. Risks & Limitations

- **Global-guard blast radius:** any unmarked public endpoint or token-plumbing gap breaks the deployed app → mitigated by the exhaustive `@Public` list (§4.5) and local E2E before deploy.
- **IDOR (known, out of scope):** authenticated users can still pass arbitrary `:userId` path params; authentication is enforced, authorization-by-resource is not.
- **Legacy accounts:** pre-existing passwordless users can't log in (accepted — "fresh scheme").
- **Admin creds in client:** the Admin quick-login uses dev creds from env — acceptable for a school project; not a production admin pattern.
- **PDF export endpoint** must stay `@Public` (opened as a bare URL) — note it returns user data without a token by design today.
```
