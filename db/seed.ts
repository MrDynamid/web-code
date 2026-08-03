/**
 * Seed script for the MEHR handloom storefront.
 *
 * Run with:  npx tsx src/db/seed.ts   (or: node --import tsx src/db/seed.ts)
 *
 * It is idempotent — every insert uses onConflictDoNothing / onConflictDoUpdate
 * keyed on the natural unique column (slug / code / email), so re-running it
 * refreshes the catalogue without creating duplicates.
 */
import { db, pool } from "./index";
import { banners, categories, coupons, products } from "./schema";

const IMG = "/images/products";

const categoryRows = [
  { slug: "sarees", name: "Sarees", tagline: "Handwoven silks & drapes", image: `${IMG}/banarasi-silk-saree.jpg`, position: 0 },
  { slug: "lehengas", name: "Lehengas", tagline: "Bridal & festive sets", image: `${IMG}/bridal-lehenga.jpg`, position: 1 },
  { slug: "kurta-sets", name: "Kurta Sets", tagline: "Everyday elegance", image: `${IMG}/chikankari-kurta-set.jpg`, position: 2 },
  { slug: "suits", name: "Suits & Anarkalis", tagline: "Salwars, shararas & gowns", image: `${IMG}/pastel-sharara-set.jpg`, position: 3 },
  { slug: "accessories", name: "Accessories", tagline: "Dupattas & finishing touches", image: `${IMG}/zari-dupatta.jpg`, position: 4 },
];

const productRows = [
  {
    slug: "banarasi-silk-saree", name: "Banarasi Silk Saree", category_slug: "sarees",
    description: "Pure Banarasi silk woven with intricate gold zari motifs, finished with a rich pallu.",
    details: "Handwoven in Varanasi over 20 days. Comes with an unstitched blouse piece.",
    fabric: "Pure Katan silk with real zari", care: "Dry clean only. Store wrapped in muslin.",
    price: 24999, compare_at_price: 32999, images: [`${IMG}/banarasi-silk-saree.jpg`],
    colors: ["Crimson", "Royal Blue", "Emerald"], sizes: ["Free Size"], badge: "Bestseller",
    featured: true, stock: 12, rating: 4.8, review_count: 42,
  },
  {
    slug: "kanjivaram-saree", name: "Kanjivaram Silk Saree", category_slug: "sarees",
    description: "Temple-border Kanjivaram in lustrous mulberry silk with a contrast pallu.",
    details: "Traditional korvai weave with a genuine zari border.",
    fabric: "Mulberry silk", care: "Dry clean only.",
    price: 28999, compare_at_price: 35999, images: [`${IMG}/kanjivaram-saree.jpg`],
    colors: ["Mustard", "Maroon"], sizes: ["Free Size"], badge: null,
    featured: true, stock: 8, rating: 4.9, review_count: 31,
  },
  {
    slug: "organza-saree", name: "Organza Floral Saree", category_slug: "sarees",
    description: "Featherlight organza with hand-painted florals and a delicate scalloped edge.",
    details: "Sheer drape, ideal for daytime celebrations.",
    fabric: "Silk organza", care: "Dry clean only.",
    price: 12999, compare_at_price: null, images: [`${IMG}/organza-saree.jpg`],
    colors: ["Blush", "Sky"], sizes: ["Free Size"], badge: "New",
    featured: false, stock: 20, rating: 4.6, review_count: 18,
  },
  {
    slug: "bridal-lehenga", name: "Bridal Velvet Lehenga", category_slug: "lehengas",
    description: "Regal hand-embroidered velvet lehenga with zardozi and sequin detailing.",
    details: "Includes lehenga, blouse and dupatta. Made-to-measure available.",
    fabric: "Velvet with zardozi embroidery", care: "Dry clean only.",
    price: 84999, compare_at_price: 99999, images: [`${IMG}/bridal-lehenga.jpg`],
    colors: ["Wine", "Deep Red"], sizes: ["XS", "S", "M", "L", "XL"], badge: "Bridal",
    featured: true, stock: 5, rating: 5.0, review_count: 12,
  },
  {
    slug: "pastel-sharara-set", name: "Pastel Sharara Set", category_slug: "suits",
    description: "Dreamy pastel sharara with mirror work and a flowing kurta.",
    details: "Three-piece set: kurta, sharara and dupatta.",
    fabric: "Georgette with mirror work", care: "Dry clean recommended.",
    price: 15999, compare_at_price: 19999, images: [`${IMG}/pastel-sharara-set.jpg`],
    colors: ["Mint", "Lilac", "Peach"], sizes: ["S", "M", "L", "XL"], badge: null,
    featured: true, stock: 15, rating: 4.7, review_count: 26,
  },
  {
    slug: "chikankari-kurta-set", name: "Chikankari Kurta Set", category_slug: "kurta-sets",
    description: "Lucknowi chikankari kurta with hand-embroidered threadwork and matching pants.",
    details: "Two-piece cotton set, breathable for all-day wear.",
    fabric: "Cotton mulmul", care: "Gentle hand wash.",
    price: 6999, compare_at_price: 8999, images: [`${IMG}/chikankari-kurta-set.jpg`],
    colors: ["White", "Powder Blue"], sizes: ["S", "M", "L", "XL", "XXL"], badge: "Bestseller",
    featured: true, stock: 30, rating: 4.8, review_count: 58,
  },
  {
    slug: "chanderi-kurta-set", name: "Chanderi Kurta Set", category_slug: "kurta-sets",
    description: "Lightweight Chanderi kurta with subtle buti weave and a tissue dupatta.",
    details: "Three-piece set with straight pants.",
    fabric: "Chanderi silk-cotton", care: "Dry clean recommended.",
    price: 8499, compare_at_price: null, images: [`${IMG}/chanderi-kurta-set.jpg`],
    colors: ["Ivory", "Sage"], sizes: ["S", "M", "L", "XL"], badge: null,
    featured: false, stock: 22, rating: 4.5, review_count: 21,
  },
  {
    slug: "block-print-kurta", name: "Block Print Cotton Kurta", category_slug: "kurta-sets",
    description: "Hand block-printed cotton kurta with natural dyes and wooden buttons.",
    details: "Single kurta, relaxed fit.",
    fabric: "100% cotton", care: "Machine wash cold.",
    price: 2999, compare_at_price: 3999, images: [`${IMG}/block-print-kurta.jpg`],
    colors: ["Indigo", "Rust"], sizes: ["S", "M", "L", "XL", "XXL"], badge: "Everyday",
    featured: false, stock: 40, rating: 4.4, review_count: 37,
  },
  {
    slug: "velvet-salwar-suit", name: "Velvet Salwar Suit", category_slug: "suits",
    description: "Warm velvet salwar suit with delicate dori work, perfect for winter weddings.",
    details: "Three-piece set with churidar.",
    fabric: "Velvet", care: "Dry clean only.",
    price: 13999, compare_at_price: 17999, images: [`${IMG}/velvet-salwar-suit.jpg`],
    colors: ["Bottle Green", "Navy"], sizes: ["S", "M", "L", "XL"], badge: null,
    featured: false, stock: 14, rating: 4.6, review_count: 15,
  },
  {
    slug: "bandhani-anarkali", name: "Bandhani Anarkali", category_slug: "suits",
    description: "Flowing Anarkali in traditional bandhani tie-dye with gota accents.",
    details: "Floor-length Anarkali with dupatta.",
    fabric: "Georgette", care: "Dry clean recommended.",
    price: 11999, compare_at_price: null, images: [`${IMG}/bandhani-anarkali.jpg`],
    colors: ["Fuchsia", "Yellow"], sizes: ["S", "M", "L", "XL"], badge: "New",
    featured: true, stock: 18, rating: 4.7, review_count: 22,
  },
  {
    slug: "indo-western-gown", name: "Indo-Western Gown", category_slug: "suits",
    description: "Contemporary draped gown blending Indian craft with a modern silhouette.",
    details: "Pre-stitched, ready to wear.",
    fabric: "Crepe with embellishment", care: "Dry clean only.",
    price: 18999, compare_at_price: 22999, images: [`${IMG}/indo-western-gown.jpg`],
    colors: ["Charcoal", "Wine"], sizes: ["XS", "S", "M", "L"], badge: null,
    featured: false, stock: 9, rating: 4.5, review_count: 8,
  },
  {
    slug: "patola-palazzo-set", name: "Patola Palazzo Set", category_slug: "kurta-sets",
    description: "Ikat-inspired Patola print kurta with wide palazzo pants.",
    details: "Two-piece coordinated set.",
    fabric: "Cotton silk", care: "Gentle hand wash.",
    price: 7499, compare_at_price: 9499, images: [`${IMG}/patola-palazzo-set.jpg`],
    colors: ["Teal", "Maroon"], sizes: ["S", "M", "L", "XL"], badge: null,
    featured: false, stock: 25, rating: 4.6, review_count: 19,
  },
  {
    slug: "zari-dupatta", name: "Zari Border Dupatta", category_slug: "accessories",
    description: "Handwoven dupatta with a rich zari border to elevate any outfit.",
    details: "Single dupatta, 2.5 metres.",
    fabric: "Silk blend", care: "Dry clean recommended.",
    price: 3499, compare_at_price: 4499, images: [`${IMG}/zari-dupatta.jpg`],
    colors: ["Gold", "Silver", "Red"], sizes: ["Free Size"], badge: "Gifting",
    featured: false, stock: 50, rating: 4.7, review_count: 44,
  },
];

const bannerRows = [
  // ---- Hero carousel slides (full-width) ----
  {
    title: "Woven for the days you'll never forget",
    subtitle: "Handwoven zardozi lehengas and heirloom drapes for your big day.",
    eyebrow: "The Bridal Edit", image: "/images/hero-bridal.png",
    cta_label: "Shop bridal", cta_href: "/shop?category=lehengas",
    placement: "hero", position: 0, active: true,
  },
  {
    title: "Handloom you'll actually live in",
    subtitle: "Breathable chikankari and cotton kurta sets, thoughtfully crafted.",
    eyebrow: "Everyday Edit", image: "/images/hero-everyday.png",
    cta_label: "Explore kurta sets", cta_href: "/shop?category=kurta-sets",
    placement: "hero", position: 1, active: true,
  },
  {
    title: "The saree, in its purest form",
    subtitle: "Real-zari Banarasi and Kanjivaram silks from India's finest karigars.",
    eyebrow: "Silk Stories", image: "/images/hero-saree.png",
    cta_label: "Shop sarees", cta_href: "/shop?category=sarees",
    placement: "hero", position: 2, active: true,
  },
  {
    title: "Dressed for every celebration",
    subtitle: "Festive Anarkalis, shararas and gowns that turn heads.",
    eyebrow: "Festive Edit", image: "/images/hero-festive.png",
    cta_label: "Shop festive", cta_href: "/shop?category=suits",
    placement: "hero", position: 3, active: true,
  },
  // ---- Secondary promo tiles ----
  {
    title: "Bridal, built to be kept",
    subtitle: "640 hours on the handloom. Real gold zari. One unforgettable lehenga.",
    eyebrow: "The Bridal Edit", image: "/images/banner-lehenga.png",
    cta_label: "Discover bridal", cta_href: "/shop?category=lehengas",
    placement: "promo", position: 0, active: true,
  },
  {
    title: "Everyday, elevated",
    subtitle: "Soft handloom cottons and chikankari for the ordinary days worth dressing for.",
    eyebrow: "Everyday Edit", image: "/images/banner-kurta.png",
    cta_label: "Shop kurta sets", cta_href: "/shop?category=kurta-sets",
    placement: "promo", position: 1, active: true,
  },
];

const couponRows = [
  { code: "WELCOME10", label: "10% off your first order", type: "percentage", value: 10, min_order: 2999, active: true },
  { code: "FESTIVE500", label: "₹500 off orders over ₹7,999", type: "fixed", value: 500, min_order: 7999, active: true },
];

async function seed() {
  console.log("[seed] categories…");
  for (const row of categoryRows) {
    await db.insert(categories).values(row).onConflictDoUpdate({
      target: categories.slug,
      set: { name: row.name, tagline: row.tagline, image: row.image, position: row.position },
    });
  }

  console.log("[seed] products…");
  for (const row of productRows) {
    await db.insert(products).values(row).onConflictDoUpdate({
      target: products.slug,
      set: { ...row },
    });
  }

  console.log("[seed] banners…");
  for (const row of bannerRows) {
    // banners have no natural unique key; only insert when absent by title.
    const existing = await db.query.banners.findFirst({
      where: (b, { eq }) => eq(b.title, row.title),
    });
    if (!existing) await db.insert(banners).values(row);
  }

  console.log("[seed] coupons…");
  for (const row of couponRows) {
    await db.insert(coupons).values(row).onConflictDoUpdate({
      target: coupons.code,
      set: { ...row },
    });
  }

  console.log("[seed] done.");
  await pool.end();
}

seed().catch((error) => {
  console.error("[seed] failed:", error);
  process.exit(1);
});
