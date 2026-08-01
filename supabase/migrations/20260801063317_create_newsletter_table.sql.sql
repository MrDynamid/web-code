/*
# Create newsletter_subscribers table

1. New Tables
- `newsletter_subscribers`
  - `id` (serial, primary key)
  - `email` (text, unique, not null) — subscriber email
  - `active` (boolean, default true) — soft-unsubscribe flag
  - `created_at` (timestamptz) — signup time

2. Security
- RLS enabled.
- Anyone (anon + authenticated) can INSERT their email — the newsletter form is public.
- No SELECT, UPDATE, or DELETE from the client — all management is server-side.
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_insert_public" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert_public"
ON newsletter_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_no_select" ON newsletter_subscribers;
CREATE POLICY "newsletter_no_select"
ON newsletter_subscribers FOR SELECT
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "newsletter_no_update" ON newsletter_subscribers;
CREATE POLICY "newsletter_no_update"
ON newsletter_subscribers FOR UPDATE
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "newsletter_no_delete" ON newsletter_subscribers;
CREATE POLICY "newsletter_no_delete"
ON newsletter_subscribers FOR DELETE
TO anon, authenticated
USING (false);