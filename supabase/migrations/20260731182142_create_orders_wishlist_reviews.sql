/*
# Create orders, wishlist, and reviews tables

These tables handle the transactional and social sides of the storefront.

## New Tables

### `orders`
Records every purchase attempt and its lifecycle. Line items are stored as a JSON
snapshot so the order is self-contained even if the product is later edited or deleted.

Amounts are stored in paise (smallest INR unit); divide by 100 to display in ₹.

- `id` (serial, PK)
- `userId` (text) — Better Auth user ID of the buyer
- `email` (text) — buyer email (snapshot at order time)
- `full_name`, `address`, `city`, `state`, `zip`, `phone` — shipping details
- `items` (jsonb) — array of {id, slug, name, image, color, size, price, quantity}
- `subtotal`, `shipping`, `discount`, `total` (integer) — amounts in paise
- `coupon_code` (text) — redeem code applied, if any
- `currency` (text, default 'INR')
- `status` (text) — lifecycle: created → paid → processing → shipped → delivered | cancelled
- `status_history` (jsonb) — timestamped log of every status change with optional note
- `tracking_number` (text) — shipping tracking reference set by admin
- `razorpay_order_id` (text) — Razorpay order ID for payment reference
- `razorpay_payment_id` (text) — Razorpay payment ID set after verification
- `created_at` (timestamptz)

### `wishlist`
Each row is a (user, product) pair representing a saved item.
A unique constraint prevents duplicates; toggle logic uses ON CONFLICT.

- `id` (serial, PK)
- `userId` (text) — owner
- `product_id` (integer, FK → products)
- `created_at` (timestamptz)

### `reviews`
One review per user per product (enforced by unique index).
Aggregate rating and review_count on the products table are recomputed by a
server action whenever a review is submitted or deleted.

- `id` (serial, PK)
- `product_id` (integer, FK → products)
- `userId` (text) — reviewer's Better Auth user ID
- `user_name` (text) — display name snapshot at time of review
- `rating` (integer, 1–5)
- `title` (text) — optional headline
- `body` (text) — review text
- `created_at` (timestamptz)

## Security

- RLS enabled on all tables.
- Orders: authenticated users can SELECT, INSERT, and UPDATE (status cancel) their own rows.
  Admins update via server actions using the service-role key (bypasses RLS).
- Wishlist: owner-scoped CRUD.
- Reviews: anyone can read reviews (public); only authenticated users can write their own.

## Indexes
- `orders_user_idx` — fast lookup of a user's order history
- `wishlist_user_product_unique` — prevents duplicate wishlist entries
- `reviews_user_product_unique` — prevents multiple reviews per user per product
- `reviews_product_idx` — fast aggregation for product rating pages
*/

-- ─── orders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                    serial PRIMARY KEY,
  "userId"              text NOT NULL,
  email                 text NOT NULL,
  full_name             text NOT NULL,
  address               text NOT NULL,
  city                  text NOT NULL,
  state                 text NOT NULL,
  zip                   text NOT NULL,
  phone                 text,
  items                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal              integer NOT NULL,
  shipping              integer NOT NULL DEFAULT 0,
  discount              integer NOT NULL DEFAULT 0,
  coupon_code           text,
  total                 integer NOT NULL,
  currency              text NOT NULL DEFAULT 'INR',
  status                text NOT NULL DEFAULT 'created',
  status_history        jsonb NOT NULL DEFAULT '[]'::jsonb,
  tracking_number       text,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx   ON orders("userId");
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

-- Customers can update only their own orders (e.g. cancel before shipping).
-- Admins use service-role which bypasses RLS.
DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- ─── wishlist ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id          serial PRIMARY KEY,
  "userId"    text NOT NULL,
  product_id  integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_product_unique
  ON wishlist("userId", product_id);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_select_own" ON wishlist;
CREATE POLICY "wishlist_select_own" ON wishlist
  FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "wishlist_insert_own" ON wishlist;
CREATE POLICY "wishlist_insert_own" ON wishlist
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlist;
CREATE POLICY "wishlist_delete_own" ON wishlist
  FOR DELETE TO authenticated
  USING ("userId" = auth.uid()::text);

-- ─── reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          serial PRIMARY KEY,
  product_id  integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "userId"    text NOT NULL,
  user_name   text NOT NULL,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       text,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_unique
  ON reviews("userId", product_id);
CREATE INDEX IF NOT EXISTS reviews_product_idx
  ON reviews(product_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are publicly readable
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE TO authenticated
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE TO authenticated
  USING ("userId" = auth.uid()::text);
