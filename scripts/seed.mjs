import pg from 'pg'
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const products = [
  {
    name: 'Silk Slip Dress', slug: 'silk-slip-dress', category: 'Dresses',
    description: 'A fluid bias-cut slip in lustrous mulberry silk that skims the body with quiet elegance.',
    details: 'Cut on the bias for a graceful drape, this slip features delicate adjustable straps and a midi length. Fully lined.',
    price: 24500, compareAtPrice: null, badge: 'Bestseller', featured: true,
    materials: '100% mulberry silk', rating: '4.9', reviewCount: 214, stock: 22,
    colors: ['Champagne', 'Black', 'Ivory'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Ribbed Knit Dress', slug: 'ribbed-knit-dress', category: 'Dresses',
    description: 'A body-skimming ribbed knit dress with a high neck and long sleeves for effortless layering.',
    details: 'Soft stretch rib knit with a fitted silhouette that moves with you. Midi length.',
    price: 18500, compareAtPrice: null, badge: null, featured: false,
    materials: '82% viscose, 18% nylon', rating: '4.7', reviewCount: 96, stock: 30,
    colors: ['Camel', 'Charcoal'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Cashmere Wrap Coat', slug: 'cashmere-wrap-coat', category: 'Outerwear',
    description: 'An unstructured wrap coat in pure cashmere with a self-tie belt and dropped shoulders.',
    details: 'Double-faced cashmere with a soft hand and generous wrap silhouette. Fully lined with interior pocket.',
    price: 68000, compareAtPrice: null, badge: null, featured: true,
    materials: '100% cashmere', rating: '5.0', reviewCount: 148, stock: 12,
    colors: ['Camel', 'Grey'], sizes: ['S', 'M', 'L'],
  },
  {
    name: 'Classic Trench Coat', slug: 'trench-coat', category: 'Outerwear',
    description: 'A timeless double-breasted trench in water-resistant cotton gabardine.',
    details: 'Storm flap, belted waist, and horn buttons. A wardrobe cornerstone built to last.',
    price: 42000, compareAtPrice: null, badge: 'New', featured: false,
    materials: '100% cotton gabardine', rating: '4.8', reviewCount: 73, stock: 18,
    colors: ['Sand', 'Black'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Wool Blazer', slug: 'wool-blazer', category: 'Outerwear',
    description: 'A tailored single-breasted blazer in Italian wool with a clean, minimal lapel.',
    details: 'Structured shoulders, functional pockets, and a half-canvas construction for a refined drape.',
    price: 38000, compareAtPrice: null, badge: null, featured: false,
    materials: '96% virgin wool, 4% elastane', rating: '4.8', reviewCount: 61, stock: 20,
    colors: ['Charcoal', 'Navy'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Cashmere Crewneck', slug: 'cashmere-crewneck', category: 'Knitwear',
    description: 'An everyday crewneck sweater in grade-A cashmere, light enough for year-round wear.',
    details: 'Fully fashioned knit with ribbed trims. Naturally soft and breathable.',
    price: 22000, compareAtPrice: null, badge: 'Bestseller', featured: true,
    materials: '100% grade-A cashmere', rating: '4.9', reviewCount: 302, stock: 26,
    colors: ['Oatmeal', 'Black', 'Camel'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Merino Turtleneck', slug: 'merino-turtleneck', category: 'Knitwear',
    description: 'A fine-gauge merino turtleneck that layers seamlessly under coats and blazers.',
    details: 'Extra-fine merino wool with a slim fit and a soft roll neck. Machine washable on wool cycle.',
    price: 16500, compareAtPrice: 19500, badge: null, featured: false,
    materials: '100% extra-fine merino wool', rating: '4.7', reviewCount: 118, stock: 14,
    colors: ['Ivory', 'Black', 'Burgundy'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Satin Blouse', slug: 'satin-blouse', category: 'Tops',
    description: 'A softly draped satin blouse with a relaxed fit and hidden button placket.',
    details: 'Fluid satin with a subtle sheen. Dresses up with tailoring or down with denim.',
    price: 14500, compareAtPrice: null, badge: null, featured: false,
    materials: '100% recycled polyester satin', rating: '4.6', reviewCount: 84, stock: 28,
    colors: ['Blush', 'Black', 'Ivory'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Linen Trousers', slug: 'linen-trousers', category: 'Bottoms',
    description: 'High-waisted wide-leg trousers in breathable European linen.',
    details: 'Pressed pleat front, side pockets, and a tailored wide leg. Effortless warm-weather ease.',
    price: 16000, compareAtPrice: null, badge: null, featured: false,
    materials: '100% European linen', rating: '4.7', reviewCount: 92, stock: 24,
    colors: ['Sand', 'White', 'Black'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Pleated Midi Skirt', slug: 'pleated-midi-skirt', category: 'Bottoms',
    description: 'A fluid accordion-pleated midi skirt with an elasticated waist for all-day comfort.',
    details: 'Sunray pleats that catch the light with movement. Fully lined.',
    price: 15500, compareAtPrice: null, badge: 'New', featured: false,
    materials: '100% recycled polyester', rating: '4.6', reviewCount: 47, stock: 32,
    colors: ['Olive', 'Black'], sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    name: 'Leather Tote', slug: 'leather-tote', category: 'Accessories',
    description: 'A structured everyday tote in full-grain Italian leather with a spacious interior.',
    details: 'Vegetable-tanned leather that patinas beautifully. Interior zip pocket and magnetic closure.',
    price: 32000, compareAtPrice: null, badge: null, featured: true,
    materials: 'Full-grain Italian leather', rating: '4.9', reviewCount: 156, stock: 15,
    colors: ['Tan', 'Black'], sizes: ['One Size'],
  },
  {
    name: 'Silk Scarf', slug: 'silk-scarf', category: 'Accessories',
    description: 'A hand-rolled silk twill scarf with a painterly print in rich seasonal tones.',
    details: '90cm square in pure silk twill with hand-finished edges. A versatile finishing touch.',
    price: 8500, compareAtPrice: null, badge: null, featured: false,
    materials: '100% silk twill', rating: '4.8', reviewCount: 65, stock: 40,
    colors: ['Gold', 'Rose', 'Emerald'], sizes: ['One Size'],
  },
]

async function main() {
  await pool.query('DROP TABLE IF EXISTS products')
  await pool.query(`
    CREATE TABLE products (
      id serial PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      description text NOT NULL,
      details text,
      price integer NOT NULL,
      compare_at_price integer,
      category text NOT NULL,
      images text[] NOT NULL DEFAULT '{}',
      colors text[] NOT NULL DEFAULT '{}',
      sizes text[] NOT NULL DEFAULT '{}',
      badge text,
      materials text,
      featured boolean NOT NULL DEFAULT false,
      rating numeric(2,1) NOT NULL DEFAULT '5.0',
      review_count integer NOT NULL DEFAULT 0,
      stock integer NOT NULL DEFAULT 25,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  let i = 0
  for (const p of products) {
    i++
    await pool.query(
      `INSERT INTO products
        (name, slug, description, details, price, compare_at_price, category, images, colors, sizes, badge, materials, featured, rating, review_count, stock, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now() - ($17 || ' hours')::interval)`,
      [
        p.name, p.slug, p.description, p.details, p.price, p.compareAtPrice, p.category,
        [`/products/${p.slug}.png`], p.colors, p.sizes, p.badge, p.materials,
        p.featured, p.rating, p.reviewCount, p.stock, String(i),
      ],
    )
  }

  const c = await pool.query('select count(*)::int as n from products')
  console.log('Seeded rows:', c.rows[0].n)
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
