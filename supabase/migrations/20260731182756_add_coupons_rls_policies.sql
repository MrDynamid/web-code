/*
# Add explicit RLS policies to coupons table

## Problem
The `coupons` table had RLS enabled but zero policies, which triggers the
"RLS Enabled No Policy" advisor warning. An empty policy set is ambiguous —
it's unclear whether access was intentionally blocked or the policies were
simply forgotten.

## Intent
Coupon data is intentionally server-only. All reads and writes happen through
Next.js server actions that connect via the `DATABASE_URL` Postgres connection
(running as the postgres superuser), which **bypasses RLS entirely**. No browser
client should ever be able to read coupon codes, discount values, or active
status directly through the Supabase anon or authenticated keys.

## Changes
Four explicit deny-all policies are added to `coupons` — one per SQL verb —
each scoped to `anon, authenticated` with `USING (false)` / `WITH CHECK (false)`.

This approach:
1. Makes the security intent explicit and self-documenting in the policy list.
2. Clears the "RLS Enabled No Policy" advisor warning.
3. Ensures that even if a future code change accidentally uses the anon key to
   query coupons, it receives zero rows rather than full access.
4. Does not affect server-action behaviour because the Postgres superuser
   connection bypasses RLS.

## Security notes
- `USING (false)` on SELECT, UPDATE, DELETE means every row fails the policy
  check → zero rows returned / affected for anon and authenticated roles.
- `WITH CHECK (false)` on INSERT means every attempted insert is rejected for
  those roles.
- The `service_role` key (used internally by Supabase functions) and the direct
  Postgres superuser connection both bypass RLS, so admin server actions are
  unaffected.
*/

DROP POLICY IF EXISTS "coupons_no_select" ON coupons;
CREATE POLICY "coupons_no_select"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "coupons_no_insert" ON coupons;
CREATE POLICY "coupons_no_insert"
  ON coupons FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "coupons_no_update" ON coupons;
CREATE POLICY "coupons_no_update"
  ON coupons FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "coupons_no_delete" ON coupons;
CREATE POLICY "coupons_no_delete"
  ON coupons FOR DELETE
  TO anon, authenticated
  USING (false);
