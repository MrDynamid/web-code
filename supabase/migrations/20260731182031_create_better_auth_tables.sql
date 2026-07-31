/*
# Better Auth tables

These tables are required by the Better Auth authentication library used in this project.
They store user accounts, active sessions, OAuth accounts, and email verification tokens.

## New Tables

1. `user`
   - `id` (text, primary key) — Better Auth uses text IDs not UUIDs
   - `name` (text) — display name
   - `email` (text, unique) — login email
   - `emailVerified` (boolean) — whether email has been confirmed
   - `image` (text) — optional profile picture URL
   - `createdAt`, `updatedAt` (timestamp) — audit timestamps

2. `session`
   - `id` (text, primary key)
   - `expiresAt` (timestamp) — session expiry
   - `token` (text, unique) — session token
   - `userId` (text, FK → user) — owner; cascades on user deletion
   - `ipAddress`, `userAgent` — request metadata

3. `account`
   - Links a user to an auth provider (email/password, OAuth, etc.)
   - `userId` (text, FK → user) — cascades on deletion
   - `password` stored hashed by Better Auth

4. `verification`
   - Short-lived tokens for email verification / password reset

## Security
- RLS enabled on all tables.
- Better Auth communicates via the service-role key (server-side only), so policies
  are intentionally restrictive — authenticated users can only read their own data.
- The `user` table SELECT policy lets an authenticated user read their own row.
- All other tables are locked to the owning user.

## Notes
- Column names use camelCase to match Better Auth's expected schema exactly.
- Do NOT rename these columns or Better Auth will break.
*/

-- ─── user ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user" (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image         text,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON "user";
CREATE POLICY "users_select_own" ON "user"
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "users_update_own" ON "user";
CREATE POLICY "users_update_own" ON "user"
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- ─── session ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "session" (
  id            text PRIMARY KEY,
  "expiresAt"   timestamptz NOT NULL,
  token         text NOT NULL UNIQUE,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now(),
  "ipAddress"   text,
  "userAgent"   text,
  "userId"      text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_select_own" ON "session";
CREATE POLICY "session_select_own" ON "session"
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "session_delete_own" ON "session";
CREATE POLICY "session_delete_own" ON "session"
  FOR DELETE TO authenticated
  USING ("userId" = auth.uid()::text);

-- ─── account ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "account" (
  id                        text PRIMARY KEY,
  "accountId"               text NOT NULL,
  "providerId"              text NOT NULL,
  "userId"                  text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"             text,
  "refreshToken"            text,
  "idToken"                 text,
  "accessTokenExpiresAt"    timestamptz,
  "refreshTokenExpiresAt"   timestamptz,
  scope                     text,
  password                  text,
  "createdAt"               timestamptz NOT NULL DEFAULT now(),
  "updatedAt"               timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_select_own" ON "account";
CREATE POLICY "account_select_own" ON "account"
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

-- ─── verification ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "verification" (
  id           text PRIMARY KEY,
  identifier   text NOT NULL,
  value        text NOT NULL,
  "expiresAt"  timestamptz NOT NULL,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- Verification tokens are server-side only; no client-side access needed.
DROP POLICY IF EXISTS "verification_no_access" ON "verification";
CREATE POLICY "verification_no_access" ON "verification"
  FOR SELECT TO authenticated
  USING (false);
