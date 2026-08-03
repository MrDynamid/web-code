import Link from "next/link"
import { ArrowRight, Leaf, Scissors, Truck } from "lucide-react"
import { getStorefront } from "@/lib/catalog.queries"
import { HeroCarousel } from "@/components/hero-carousel"
import { ProductCard } from "@/components/product-card"
import { RecentlyViewed } from "@/components/recently-viewed"
import { Reveal } from "@/components/reveal"
import { SmartImage } from "@/components/smart-image"

export default async function HomePage() {
  const { products, categories, banners } = await getStorefront()

  const heroSlides = banners
    .filter((banner) => banner.placement === "hero")
    .map((banner) => ({
      id: banner.id,
      image: banner.image,
      eyebrow: banner.eyebrow,
      title: banner.title,
      subtitle: banner.subtitle,
      cta_label: banner.cta_label,
      cta_href: banner.cta_href,
    }))

  const featured = products.filter((product) => product.featured).slice(0, 8)
  const edit = featured.length > 0 ? featured : products.slice(0, 8)
  const newArrivals = [...products]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 4)

  return (
    <>
      <HeroCarousel slides={heroSlides} />

      <section aria-label="Why MEHR" className="border-b bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            { icon: Scissors, title: "Handcrafted in India", copy: "Woven and finished by karigar families we work with directly." },
            { icon: Truck, title: "Free shipping over ₹2,999", copy: "Dispatched within 48 hours, tracked to your door." },
            { icon: Leaf, title: "Natural fibres", copy: "Silk, cotton and linen chosen to last decades, not seasons." },
          ].map(({ icon: Icon, title, copy }, index) => (
            <Reveal key={title} delay={index * 80} className="flex items-start gap-3">
              <Icon width={20} height={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h2 className="text-sm font-medium tracking-wide">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow text-muted-foreground">Shop by category</p>
              <h2 id="categories-heading" className="mt-2 font-display text-3xl sm:text-4xl text-balance">
                Find your occasion
              </h2>
            </div>
            <Link href="/shop" className="link-underline flex items-center gap-1.5 text-sm text-primary">
              Shop all <ArrowRight width={15} height={15} strokeWidth={1.6} />
            </Link>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((category, index) => (
              <Reveal key={category.id} delay={index * 70}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="group block overflow-hidden rounded-lg bg-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  <div className="relative overflow-hidden">
                    <SmartImage
                      src={category.image ?? "/images/hero.jpg"}
                      alt={category.name}
                      width={800}
                      height={1000}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="aspect-[4/5] w-full transform-gpu object-cover object-center backface-hidden [transition:transform_620ms_var(--ease-silk)] group-hover:scale-[1.05] motion-reduce:transform-none"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 text-ink-foreground">
                      <h3 className="font-display text-xl">{category.name}</h3>
                      {category.tagline ? <p className="mt-0.5 text-xs opacity-85">{category.tagline}</p> : null}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="edit-heading" className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <Reveal className="text-center">
            <p className="text-eyebrow text-muted-foreground">The signature edit</p>
            <h2 id="edit-heading" className="mt-2 font-display text-3xl sm:text-4xl text-balance">
              Pieces our clients keep coming back for
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {edit.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 70}>
                <ProductCard product={product} priority={index < 4} />
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/shop"
              className="rounded-md border border-primary px-8 py-3 text-xs tracking-[0.18em] uppercase text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              View the full collection
            </Link>
          </div>
        </div>
      </section>

      {newArrivals.length > 0 ? (
        <section aria-labelledby="new-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow text-muted-foreground">Just in</p>
              <h2 id="new-heading" className="mt-2 font-display text-3xl sm:text-4xl text-balance">
                New this week
              </h2>
            </div>
            <Link href="/shop?sort=new" className="link-underline flex items-center gap-1.5 text-sm text-primary">
              All new arrivals <ArrowRight width={15} height={15} strokeWidth={1.6} />
            </Link>
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 70}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <RecentlyViewed catalogue={products} />
    </>
  )
}
