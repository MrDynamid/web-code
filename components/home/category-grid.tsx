import Image from 'next/image'
import Link from 'next/link'

const CATEGORY_TILES = [
  {
    label: 'Electronics',
    href: '/products?category=Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    caption: 'Phones, Laptops & More',
  },
  {
    label: 'Fashion',
    href: '/products?category=Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
    caption: 'Clothing & Footwear',
  },
  {
    label: 'Home & Kitchen',
    href: '/products?category=Home+%26+Kitchen',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
    caption: 'Appliances & Decor',
  },
  {
    label: 'Beauty',
    href: '/products?category=Beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    caption: 'Skincare & Makeup',
  },
  {
    label: 'Sports',
    href: '/products?category=Sports',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    caption: 'Fitness & Outdoor',
  },
  {
    label: 'Books',
    href: '/products?category=Books',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
    caption: 'Bestsellers & More',
  },
]

export function CategoryGrid() {
  return (
    <section className="bg-secondary/30 py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
            Shop by Category
          </h2>
          <Link
            href="/products"
            className="hidden text-sm font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline sm:block"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {CATEGORY_TILES.map((tile) => (
            <Link key={tile.label} href={tile.href} className="group">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-all duration-200 hover:border-primary hover:shadow-md">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={tile.image}
                    alt={tile.label}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{tile.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{tile.caption}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
