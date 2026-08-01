/*
# Seed products and banners

Inserts 12 curated products for the Maison Lumière fashion storefront and 2 homepage banners.
All prices are stored in paise (smallest INR unit): divide by 100 to display in ₹.

## Products seeded (12 items)
Dresses (3), Outerwear (3), Knitwear (3), Accessories (2), Bottoms (1).
Each product includes image paths, colour and size variants, editorial badges,
featured flags, and starter stock levels.

## Banners seeded (2 items)
- Hero banner: "The New Collection" (active, position 0)
- Editorial banner: "Effortless Dressing" (active, position 1)

## Notes
- Uses ON CONFLICT (slug) DO NOTHING so re-running this migration is safe.
- Image paths reference files in /public/products/ and /public/editorial/ already
  present in the repository.
*/

INSERT INTO products
  (name, slug, description, details, price, compare_at_price, category, images, colors, sizes, badge, materials, featured, stock)
VALUES
  (
    'Silk Slip Dress',
    'silk-slip-dress',
    'A fluid slip dress crafted from pure silk charmeuse. The bias cut skims the body effortlessly, catching the light with every movement.',
    'Dry clean only. Do not wring. Store folded in tissue paper.',
    38500, NULL,
    'Dresses',
    ARRAY['/products/silk-slip-dress.png'],
    ARRAY['Ivory', 'Blush', 'Noir'],
    ARRAY['XS','S','M','L'],
    'Bestseller',
    '100% Silk charmeuse',
    true, 18
  ),
  (
    'Ribbed Knit Dress',
    'ribbed-knit-dress',
    'A column dress in fine-gauge ribbed knit. Cut close to the body with a subtle side slit for ease of movement.',
    'Hand wash cold. Lay flat to dry.',
    28500, 34000,
    'Dresses',
    ARRAY['/products/ribbed-knit-dress.png'],
    ARRAY['Oatmeal', 'Forest', 'Charcoal'],
    ARRAY['XS','S','M','L'],
    'Sale',
    '85% Merino wool, 15% nylon',
    true, 22
  ),
  (
    'Pleated Midi Skirt',
    'pleated-midi-skirt',
    'Knife-pleated midi skirt in a lightweight satin. Falls just below the knee with a concealed side zipper.',
    'Dry clean only.',
    24500, NULL,
    'Dresses',
    ARRAY['/products/pleated-midi-skirt.png'],
    ARRAY['Champagne', 'Slate'],
    ARRAY['XS','S','M','L'],
    'New',
    '100% Viscose satin',
    false, 30
  ),
  (
    'Cashmere Wrap Coat',
    'cashmere-wrap-coat',
    'A generous wrap coat in double-face cashmere. Belt-tie closure and deep patch pockets. Seasonless and timeless.',
    'Dry clean only. Steam to refresh.',
    148000, NULL,
    'Outerwear',
    ARRAY['/products/cashmere-wrap-coat.png'],
    ARRAY['Camel', 'Ivory', 'Graphite'],
    ARRAY['XS','S','M','L'],
    'Bestseller',
    '100% Cashmere',
    true, 8
  ),
  (
    'Trench Coat',
    'trench-coat',
    'A classic trench in water-resistant cotton gabardine. Storm flap, epaulettes, and adjustable belt — all the details in the right place.',
    'Dry clean only. Do not tumble dry.',
    89000, NULL,
    'Outerwear',
    ARRAY['/products/trench-coat.png'],
    ARRAY['Stone', 'Khaki', 'Black'],
    ARRAY['XS','S','M','L'],
    NULL,
    '100% Cotton gabardine',
    true, 14
  ),
  (
    'Wool Blazer',
    'wool-blazer',
    'A single-button blazer in herringbone wool. Structured shoulders, a nipped waist, and patch pockets.',
    'Dry clean only.',
    74000, 89000,
    'Outerwear',
    ARRAY['/products/wool-blazer.png'],
    ARRAY['Charcoal', 'Camel'],
    ARRAY['XS','S','M','L'],
    'Sale',
    '80% Wool, 20% polyamide',
    false, 11
  ),
  (
    'Cashmere Crewneck',
    'cashmere-crewneck',
    'A relaxed crewneck knit in Grade-A cashmere. Garment-washed for immediate softness.',
    'Hand wash cold. Dry flat. Do not bleach.',
    52000, NULL,
    'Knitwear',
    ARRAY['/products/cashmere-crewneck.png'],
    ARRAY['Oatmeal', 'Dusty Rose', 'Navy'],
    ARRAY['XS','S','M','L'],
    'Bestseller',
    '100% Grade-A cashmere',
    true, 20
  ),
  (
    'Merino Turtleneck',
    'merino-turtleneck',
    'A fine-gauge turtleneck in extra-fine merino. Slim fit with a neat, folded neck.',
    'Machine wash cold on delicate cycle. Lay flat to dry.',
    32000, NULL,
    'Knitwear',
    ARRAY['/products/merino-turtleneck.png'],
    ARRAY['Ivory', 'Black', 'Bordeaux', 'Forest'],
    ARRAY['XS','S','M','L'],
    NULL,
    '100% Extra-fine merino',
    false, 25
  ),
  (
    'Linen Trousers',
    'linen-trousers',
    'Wide-leg trousers in relaxed linen. A high rise and a gentle pleat at the front create an elongating line.',
    'Machine wash cold. Line dry.',
    29500, NULL,
    'Knitwear',
    ARRAY['/products/linen-trousers.png'],
    ARRAY['Ecru', 'Terracotta', 'Navy'],
    ARRAY['XS','S','M','L'],
    'New',
    '100% Linen',
    false, 28
  ),
  (
    'Leather Tote',
    'leather-tote',
    'A structured tote in full-grain vegetable-tanned leather. A single internal zip pocket. Gets better with age.',
    'Condition with leather balm occasionally. Avoid prolonged exposure to water.',
    64500, NULL,
    'Accessories',
    ARRAY['/products/leather-tote.png'],
    ARRAY['Tan', 'Black', 'Burgundy'],
    ARRAY['One Size'],
    'Bestseller',
    '100% Full-grain leather',
    true, 9
  ),
  (
    'Silk Scarf',
    'silk-scarf',
    'A 90×90cm scarf in woven silk twill. The hand-rolled hem is a mark of the finest French scarfmakers.',
    'Dry clean recommended. Can be hand-washed with extreme care.',
    18500, NULL,
    'Accessories',
    ARRAY['/products/silk-scarf.png'],
    ARRAY['Floral Print', 'Geometric', 'Solid Ivory'],
    ARRAY['One Size'],
    NULL,
    '100% Silk twill',
    false, 35
  ),
  (
    'Satin Blouse',
    'satin-blouse',
    'A fluid blouse in satin-backed crepe. Relaxed fit with a V-neck and concealed placket.',
    'Dry clean only.',
    26500, NULL,
    'Dresses',
    ARRAY['/products/satin-blouse.png'],
    ARRAY['Ivory', 'Champagne', 'Black'],
    ARRAY['XS','S','M','L'],
    NULL,
    '100% Cupro satin',
    true, 20
  )
ON CONFLICT (slug) DO NOTHING;

-- ─── banners ─────────────────────────────────────────────────────────────────
INSERT INTO banners (title, subtitle, cta_label, cta_href, image, eyebrow, active, position)
VALUES
  (
    'The New Collection',
    'Considered pieces crafted from nature''s finest materials.',
    'Explore now',
    '/products',
    '/editorial/hero.png',
    'Autumn — Winter',
    true, 0
  ),
  (
    'Effortless Dressing',
    'Wardrobe essentials designed to last a lifetime.',
    'Shop outerwear',
    '/products?category=Outerwear',
    '/editorial/category-outerwear.png',
    'The Edit',
    true, 1
  )
ON CONFLICT DO NOTHING;
