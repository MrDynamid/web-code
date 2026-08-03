import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Better Auth tables                                                         */
/* Column + property names are camelCase to match Better Auth's defaults.     */
/* These are read/written by Better Auth through its own pg Pool, so their     */
/* timestamps stay as real Date objects — do not rename or retype them.        */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Application tables                                                         */
/*                                                                            */
/* Property names are snake_case (identical to the column names) so a plain   */
/* `db.select().from(table)` returns rows shaped exactly like the storefront  */
/* already expects (the old Supabase/PostgREST JSON contract).                */
/*                                                                            */
/* Numeric columns are typed as `number` and timestamps as ISO `string` to    */
/* match the app pool's runtime type parsers in db/index.ts. Every user-owned  */
/* table carries a plain `user_id` text column (no FK) so queries scope by     */
/* user id — there is no RLS on Neon.                                          */
/* -------------------------------------------------------------------------- */

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: text("user_id").notNull(),
    role: text("role").notNull(), // 'admin' | 'customer'
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    userRoleUnique: uniqueIndex("user_roles_user_role_key").on(t.user_id, t.role),
  }),
);

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Better Auth user id
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  phone: text("phone"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  image: text("image"),
  position: integer("position").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    details: text("details"),
    care: text("care"),
    fabric: text("fabric"),
    category_slug: text("category_slug").notNull(),
    price: numeric("price", { mode: "number" }).notNull(),
    compare_at_price: numeric("compare_at_price", { mode: "number" }),
    images: text("images").array().notNull().default([]),
    colors: text("colors").array().notNull().default([]),
    sizes: text("sizes").array().notNull().default([]),
    badge: text("badge"),
    featured: boolean("featured").notNull().default(false),
    stock: integer("stock").notNull().default(10),
    rating: numeric("rating", { mode: "number" }).notNull().default(0),
    review_count: integer("review_count").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index("products_category_idx").on(t.category_slug),
  }),
);

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  eyebrow: text("eyebrow"),
  image: text("image"),
  cta_label: text("cta_label"),
  cta_href: text("cta_href"),
  // 'hero'  -> full-width slides in the homepage hero carousel
  // 'promo' -> the two smaller secondary promo tiles further down the page
  placement: text("placement").notNull().default("hero"),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  label: text("label").notNull().default(""),
  type: text("type").notNull().default("percentage"), // 'percentage' | 'fixed'
  value: numeric("value", { mode: "number" }).notNull().default(0),
  min_order: numeric("min_order", { mode: "number" }).notNull().default(0),
  active: boolean("active").notNull().default(true),
  // Null means "never expires" / "unlimited uses". times_used is incremented
  // when an order is placed so a capped promo can actually run out.
  expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  usage_limit: integer("usage_limit"),
  times_used: integer("times_used").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    product_slug: text("product_slug").notNull(),
    user_id: text("user_id"),
    author_name: text("author_name").notNull().default("Verified buyer"),
    title: text("title"),
    body: text("body").notNull().default(""),
    rating: numeric("rating", { mode: "number" }).notNull().default(5),
    verified: boolean("verified").notNull().default(false),
    approved: boolean("approved").notNull().default(true),
    image_url: text("image_url"),
    helpful_count: integer("helpful_count").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    productIdx: index("reviews_product_idx").on(t.product_slug),
  }),
);

export const reviewVotes = pgTable(
  "review_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    review_id: uuid("review_id").notNull(),
    user_id: text("user_id").notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    reviewUserUnique: uniqueIndex("review_votes_review_user_key").on(t.review_id, t.user_id),
  }),
);

export const wishlist = pgTable(
  "wishlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: text("user_id").notNull(),
    product_slug: text("product_slug").notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    userProductUnique: uniqueIndex("wishlist_user_product_key").on(t.user_id, t.product_slug),
    userIdx: index("wishlist_user_idx").on(t.user_id),
  }),
);

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull(),
  full_name: text("full_name").notNull(),
  phone: text("phone"),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  is_default: boolean("is_default").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: text("user_id").notNull(),
    order_number: text("order_number").notNull().unique(),
    full_name: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    items: jsonb("items").$type<unknown[]>().notNull().default([]),
    subtotal: numeric("subtotal", { mode: "number" }).notNull(),
    discount: numeric("discount", { mode: "number" }).notNull().default(0),
    shipping: numeric("shipping", { mode: "number" }).notNull().default(0),
    total: numeric("total", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    coupon_code: text("coupon_code"),
    payment_method: text("payment_method").notNull().default("cod"),
    payment_status: text("payment_status").notNull().default("pending"),
    payment_reference: text("payment_reference"),
    status: text("status").notNull().default("placed"),
    status_history: jsonb("status_history").$type<unknown[]>().notNull().default([]),
    tracking_number: text("tracking_number"),
    courier: text("courier"),
    estimated_delivery: timestamp("estimated_delivery", { withTimezone: true, mode: "string" }),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("orders_user_created_idx").on(t.user_id, t.created_at),
  }),
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    order_id: uuid("order_id").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    note: text("note"),
    location: text("location"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_events_order_idx").on(t.order_id, t.created_at),
  }),
);

export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  order_id: uuid("order_id").notNull(),
  user_id: text("user_id").notNull(),
  method: text("method").notNull(),
  channel: text("channel"),
  amount: numeric("amount", { mode: "number" }).notNull(),
  reference: text("reference"),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const newsletterThrottle = pgTable("newsletter_throttle", {
  client_key: text("client_key").primaryKey(),
  hits: integer("hits").notNull().default(0),
  window_start: timestamp("window_start", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attempt_key: text("attempt_key").notNull(),
    kind: text("kind").notNull().default("signin"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (t) => ({
    keyTimeIdx: index("auth_attempts_key_time_idx").on(t.attempt_key, t.created_at),
  }),
);

/* -------------------------------------------------------------------------- */
/* Inferred row types (replace the former Supabase generated types)          */
/* -------------------------------------------------------------------------- */

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
