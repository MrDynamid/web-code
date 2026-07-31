# Maison Lumière — Full-stack Storefront

Merged and hardened storefront built with Next.js 16, React 19, PostgreSQL/Drizzle, Better Auth and Razorpay.

## Included

- Responsive storefront, product catalogue, category/sort filters and product search
- Product details, variants, stock, wishlist and persistent cart
- Email/password authentication and protected account pages
- Customer order history
- Admin dashboard for products, banners and latest orders
- PostgreSQL as the source of truth for users, products, orders, wishlist and content
- Server-side price calculation: client prices/totals are never trusted
- Razorpay payment wall with server-created orders and HMAC signature verification
- No COD/demo bypass: an order is only marked `paid` after successful Razorpay verification

## Setup

1. Copy `.env.example` to `.env.local` and fill every required value.
2. Install dependencies with `npm install` (or your preferred package manager).
3. Run `node scripts/setup-db.mjs` once to create/seed the database.
4. Run `npm run dev`.

## Razorpay

Use test keys first. The checkout creates the Razorpay order on the server and verifies the returned signature on the server before confirming payment. Never expose `RAZORPAY_KEY_SECRET` to the browser.

For production, configure the same environment variables in your hosting provider and use HTTPS. Replace test keys with live keys only after testing the complete order flow.

## Admin

Set `ADMIN_EMAILS` to a comma-separated allow-list of account email addresses. Those accounts can use `/admin` after signing in.

## Database notes

Prices are stored as integer rupees in this project. Order line items are snapshotted into JSON so order history remains intact even if a product later changes.
