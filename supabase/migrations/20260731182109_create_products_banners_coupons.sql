/*
# Create storefront tables: products, banners, coupons

These are the core catalogue and marketing tables for the Maison Lumière storefront.

## New Tables

### `products`
The main product catalogue. Each product has pricing (stored in paise — smallest INR unit),
inventory stock, variant options (colors/sizes), and can carry editorial badges.

- `id` (serial, PK)
- `name` (text) — display name
- `slug` (text, unique) — URL-safe identifier used in /products/[slug]
- `description` (text) — long-form description shown on product page
- `details` (text) — care/fit notes
- `price` (integer) — price in paise (÷100 = ₹)
- `compare_at_price` (integer) — original price for sale display
- `category` (text) — e.g. "Dresses", "Outerwear"
- `images` (text[]) — ordered list of image URLs
- `colors` (text[]) — available colour options
- `sizes` (text[]) — available size options (XS/S/M/L or One Size)
- `badge` (text) — optional label e.g. "Bestseller", "New"
- `materials` (text) — fabric composition
- `featured` (boolean) — shown on homepage rails
- `rating` (numeric 2,1) — aggregate star rating, recomputed on review submit
- `review_count` (integer) — total reviews, recomputed on review submit
- `stock` (integer) — available inventory; decremented on payment
- `created_at` (timestamptz)

### `banners`
Homepage editorial banners managed from the admin panel.

- `id` (serial, PK)
- `title`, `subtitle`, `eyebrow` (text) — copy fields
- `cta_label`, `cta_href` (text) — call-to-action button
- `image` (text) — banner background image URL
- `active` (boolean) — toggle without deleting
- `position` (integer) — display order (ascending)
- `created_at` (timestamptz)

### `coupons`
Redeem codes for checkout discounts.

- `id` (serial, PK)
- `code` (text, unique) — the redeem code (uppercase by convention)
- `label` (text) — human-readable name shown in admin
- `type` (text) — "percentage" or "fixed" (paise)
- `value` (integer) — discount amount (% or paise)
- `min_order` (integer) — minimum subtotal in paise to qualify
- `active` (boolean) — whether the code can be used
- `created_at` (timestamptz)

## Security

- RLS enabled on all three tables.
- Products and banners are PUBLIC READ (anon + authenticated) — anyone can browse the catalogue.
- Products and banners are WRITE-PROTECTED — only the service-role key (used by server actions)
  can insert/update/delete. No client-side writes are permitted via the anon key.
- Coupons are completely server-side: no anon or authenticated reads via the client.
  Coupon validation happens in server actions (Next.js) using the service-role connection.

## Seeds
Two starter coupons are inserted on first run:
- FIRST10 — 10% off any order
- SAVE500 — flat ₹500 off orders ≥ ₹5,000
*/

-- ─── products ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              serial PRIMARY KEY,
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text NOT NULL,
  details         text,
  price           integer NOT NULL,
  compare_at_price integer,
  category        text NOT NULL,
  images          text[] NOT NULL DEFAULT '{}',
  colors          text[] NOT NULL DEFAULT '{}',
  sizes           text[] NOT NULL DEFAULT '{}',
  badge           text,
  materials       text,
  featured        boolean NOT NULL DEFAULT false,
  rating          numeric(2,1) NOT NULL DEFAULT 5.0,
  review_count    integer NOT NULL DEFAULT 0,
  stock           integer NOT NULL DEFAULT 25,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_featured_idx  ON products(featured);
CREATE INDEX IF NOT EXISTS products_slug_idx      ON products(slug);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read — anyone can browse the catalogue
DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public" ON products
  FOR SELECT TO anon, authenticated USING (true);

-- Writes are server-only (service-role key bypasses RLS)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated intentionally.

-- ─── banners ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id          serial PRIMARY KEY,
  title       text NOT NULL,
  subtitle    text,
  cta_label   text,
  cta_href    text,
  image       text,
  eyebrow     text,
  active      boolean NOT NULL DEFAULT true,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select_public" ON banners;
CREATE POLICY "banners_select_public" ON banners
  FOR SELECT TO anon, authenticated USING (true);

-- ─── coupons ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id          serial PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  label       text NOT NULL DEFAULT 'Promo code',
  type        text NOT NULL DEFAULT 'percentage',
  value       integer NOT NULL DEFAULT 0,
  min_order   integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- Coupons are never exposed to the browser — server actions use service-role.
-- No client policies needed.

-- ─── seed coupons ────────────────────────────────────────────────────────────
INSERT INTO coupons (code, label, type, value, min_order, active)
VALUES
  ('FIRST10', 'Welcome offer — 10% off',   'percentage', 10,   0,      true),
  ('SAVE500',  'Flat ₹500 off over ₹5,000', 'fixed',     500,  500000, true)
ON CONFLICT (code) DO NOTHING;
