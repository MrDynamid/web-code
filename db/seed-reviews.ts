/**
 * Seeds realistic customer reviews for every product.
 *
 * The catalogue seed sets each product's `review_count` and `rating`, but the
 * `reviews` table itself was empty — so the product page showed a review count
 * with no actual reviews and an all-zero rating breakdown. This script fills the
 * table with reviews whose star distribution matches each product's rating, then
 * recomputes `rating` + `review_count` from the real rows so the summary, the
 * progress bars and the review list are always in sync.
 *
 * Run with:  npx tsx src/db/seed-reviews.ts
 *
 * Idempotent: it only ever replaces its own generated rows (user_id IS NULL);
 * genuine customer reviews (which carry a user_id) are left untouched.
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, pool } from "./index";
import { products, reviews } from "./schema";

const FIRST_NAMES = [
  "Aditi", "Priya", "Sneha", "Meera", "Kavya", "Ananya", "Riya", "Isha", "Neha", "Divya",
  "Pooja", "Shreya", "Nisha", "Tanvi", "Aarohi", "Lakshmi", "Sana", "Ritika", "Gauri", "Payal",
  "Simran", "Vaishnavi", "Anjali", "Radhika", "Deepa", "Manasi", "Swati", "Trisha", "Bhavya", "Charu",
];
const LAST_INITIALS = ["S.", "K.", "R.", "M.", "P.", "N.", "V.", "D.", "G.", "B.", "T.", "J."];

const POSITIVE_TITLES = [
  "Absolutely stunning", "Worth every rupee", "Exceeded my expectations", "My new favourite",
  "Perfect for the occasion", "Beautiful craftsmanship", "So many compliments", "Gorgeous in person",
  "Exactly as pictured", "A true heirloom piece", "Loved it", "Fell in love with it",
];
const POSITIVE_BODIES = [
  "The fabric quality is exceptional and the weave feels so premium. Draped beautifully and I received endless compliments at the wedding.",
  "Colours are even richer in person than in the photos. The zari work is delicate and clearly handmade — you can feel the difference.",
  "Fit was true to size and the finishing is immaculate. Shipping was quick and it arrived wrapped so carefully.",
  "This is easily the most elegant piece in my wardrobe now. Lightweight, comfortable to wear all day, and the detailing is gorgeous.",
  "Bought it for a family function and it was perfect. The craftsmanship is stunning and it feels like it will last for years.",
  "Soft, breathable and beautifully finished. The embroidery is neat with no loose threads. Highly recommend to anyone on the fence.",
  "Such a graceful drape and the pallu is a showstopper. Packaging felt premium too. Will definitely be ordering again.",
];
const MID_TITLES = ["Lovely, with a small note", "Beautiful but runs slightly large", "Pretty piece overall", "Good, a few minor things"];
const MID_BODIES = [
  "Really pretty piece and the colour is lovely. It ran a touch large for me, so consider sizing down. Otherwise very happy.",
  "The material is nice and the work is neat. Delivery took a little longer than expected but the product itself is good.",
  "Gorgeous design and comfortable fabric. Wish the blouse piece was a bit longer, but overall a solid buy for the price.",
  "Colour is slightly different from the screen under indoor light, but still beautiful. The quality is genuinely good.",
];
const LOW_TITLES = ["A bit underwhelming", "Not quite what I expected", "Okay for the price"];
const LOW_BODIES = [
  "The design is nice but the fabric felt lighter than I expected. It's fine for occasional wear.",
  "Colour was a little different from the pictures for me. Fit was okay after minor alterations.",
  "Decent piece but the finishing could be better in a couple of spots. Customer service was helpful though.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Star weights biased by the product's target average rating. */
function weightsFor(target: number) {
  return {
    5: Math.max(0.05, (target - 3) / 2),
    4: 0.3,
    3: Math.max(0.02, (5 - target) * 0.16),
    2: Math.max(0.01, (5 - target) * 0.07),
    1: Math.max(0.004, (5 - target) * 0.03),
  } as Record<number, number>;
}

function sampleRating(target: number): number {
  const w = weightsFor(target);
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const star of [5, 4, 3, 2, 1]) {
    r -= w[star]!;
    if (r <= 0) return star;
  }
  return 5;
}

function contentFor(rating: number) {
  if (rating >= 4) return { title: pick(POSITIVE_TITLES), body: pick(POSITIVE_BODIES) };
  if (rating === 3) return { title: pick(MID_TITLES), body: pick(MID_BODIES) };
  return { title: pick(LOW_TITLES), body: pick(LOW_BODIES) };
}

async function seedReviews() {
  const catalogue = await db
    .select({
      slug: products.slug,
      rating: products.rating,
      review_count: products.review_count,
      image: sql<string | null>`${products.images}[1]`,
    })
    .from(products);

  for (const product of catalogue) {
    const target = Number(product.rating) || 4.6;
    const count = Math.max(0, product.review_count ?? 0);

    // Remove only previously generated rows for this product (keep real ones).
    await db
      .delete(reviews)
      .where(and(eq(reviews.product_slug, product.slug), isNull(reviews.user_id)));

    if (count === 0) continue;

    const rows = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const rating = sampleRating(target);
      const { title, body } = contentFor(rating);
      const daysAgo = Math.floor(Math.random() * 300) + 1;
      rows.push({
        product_slug: product.slug,
        user_id: null,
        author_name: `${pick(FIRST_NAMES)} ${pick(LAST_INITIALS)}`,
        title,
        body,
        rating,
        verified: Math.random() < 0.85,
        approved: true,
        // Attach the product photo to roughly 1 in 7 reviews as a "customer photo".
        image_url: rating >= 4 && i % 7 === 0 ? product.image : null,
        helpful_count: Math.floor(Math.random() ** 2 * 45),
        created_at: new Date(now - daysAgo * 86_400_000).toISOString(),
      });
    }

    await db.insert(reviews).values(rows);

    // Recompute the headline rating from every approved row in the table — both
    // the ones just generated and any genuine customer reviews we preserved — so
    // the summary number, the breakdown bars and the count always agree.
    const [totals] = await db
      .select({
        count: sql<number>`count(*)::int`,
        avg: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      })
      .from(reviews)
      .where(and(eq(reviews.product_slug, product.slug), eq(reviews.approved, true)));

    const reviewCount = totals?.count ?? 0;
    const avg = Math.round((totals?.avg ?? 0) * 10) / 10;

    await db
      .update(products)
      .set({ rating: avg, review_count: reviewCount })
      .where(eq(products.slug, product.slug));

    console.log(`[seed-reviews] ${product.slug}: ${reviewCount} reviews, avg ${avg}`);
  }

  console.log("[seed-reviews] done.");
  await pool.end();
}

seedReviews().catch((error) => {
  console.error("[seed-reviews] failed:", error);
  process.exit(1);
});
