import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Better Auth tables (camelCase columns to match Better Auth defaults)
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  details: text('details'),
  price: integer('price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  category: text('category').notNull(),
  images: text('images').array().notNull().default([]),
  colors: text('colors').array().notNull().default([]),
  sizes: text('sizes').array().notNull().default([]),
  badge: text('badge'),
  materials: text('materials'),
  featured: boolean('featured').notNull().default(false),
  rating: numeric('rating', { precision: 2, scale: 1 }).notNull().default('5.0'),
  reviewCount: integer('review_count').notNull().default(0),
  stock: integer('stock').notNull().default(25),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Product = typeof products.$inferSelect

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  ctaLabel: text('cta_label'),
  ctaHref: text('cta_href'),
  image: text('image'),
  eyebrow: text('eyebrow'),
  active: boolean('active').notNull().default(true),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Banner = typeof banners.$inferSelect

// Line items are stored as JSON so an order is a self-contained snapshot even
// if the underlying product later changes or is removed.
export type OrderItem = {
  id: number
  slug: string
  name: string
  image: string
  color: string
  size: string
  price: number
  quantity: number
}

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  phone: text('phone'),
  items: jsonb('items').$type<OrderItem[]>().notNull().default([]),
  subtotal: integer('subtotal').notNull(),
  shipping: integer('shipping').notNull().default(0),
  total: integer('total').notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('created'),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Order = typeof orders.$inferSelect

export const wishlist = pgTable('wishlist', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  productId: integer('product_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type WishlistRow = typeof wishlist.$inferSelect
