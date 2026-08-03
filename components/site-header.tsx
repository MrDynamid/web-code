"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, Menu, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { SmartImage } from "@/components/smart-image";
import type { NavProduct } from "@/lib/catalog.queries";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "New in", href: "/shop?sort=new" },
  { label: "Shop all", href: "/shop" },
  { label: "Our craft", href: "/about" },
  { label: "Size guide", href: "/size-guide" },
];

export function SiteHeader({
  categories,
  products,
  isAuthenticated,
  isAdmin,
}: {
  categories: { slug: string; name: string }[];
  products: NavProduct[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const { count, setOpen } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Instant suggestions from the nav payload the server already sent — the full
  // search still runs in Postgres on /shop, this is just the type-ahead.
  const suggestions = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (query.length < 2) return [];
    return products
      .filter((product) =>
        [product.name, product.fabric ?? "", product.category_slug].join(" ").toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [products, term]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = term.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="marquee bg-ink py-2 text-ink-foreground">
        <div className="marquee-track text-[10px] tracking-[0.24em] uppercase">
          {[0, 1].map((copy) => (
            <div key={copy} className="marquee-group" aria-hidden={copy === 1}>
              <span>Free shipping over ₹2,999</span>
              <span>Handloom, made in India</span>
              <span>7-day easy returns</span>
              <span>Use FIRST10 for 10% off</span>
              <span>Woven by hand in Varanasi &amp; Kanchipuram</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "border-b transition-all duration-500",
          scrolled ? "border-border bg-background/90 backdrop-blur-md" : "border-transparent bg-background",
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* Mobile menu + desktop nav */}
          <div className="flex min-w-0 items-center gap-1">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="-ml-2 rounded-md p-2 transition-colors hover:text-primary lg:hidden"
                >
                  <Menu width={20} height={20} strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
                <SheetTitle className="border-b border-border px-5 py-4 font-display text-2xl">MEHR</SheetTitle>
                <nav className="px-5 py-4">
                  <p className="text-eyebrow text-muted-foreground">Categories</p>
                  <ul className="mt-3 space-y-1">
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link
                          href={`/shop?category=${category.slug}`}
                          className="flex items-center justify-between rounded-md px-2 py-2.5 font-display text-xl transition-colors hover:bg-secondary"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="text-eyebrow mt-6 text-muted-foreground">More</p>
                  <ul className="mt-3 space-y-1">
                    {NAV_LINKS.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="block rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={isAuthenticated ? "/account" : "/auth"}
                        className="block rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary"
                      >
                        {isAuthenticated ? "My account" : "Sign in"}
                      </Link>
                    </li>
                    {isAuthenticated ? (
                      <li>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary"
                        >
                          <Package width={16} height={16} strokeWidth={1.5} />
                          Track your order
                        </Link>
                      </li>
                    ) : null}
                    {isAdmin ? (
                      <li>
                        <Link
                          href="/admin"
                          className="block rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary"
                        >
                          Admin dashboard
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>

            <nav className="hidden min-w-0 items-center gap-5 text-xs tracking-[0.16em] uppercase lg:flex">
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop?category=${category.slug}`}
                  className="link-underline shrink-0 transition-colors hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
              <Link href="/shop" className="link-underline shrink-0 transition-colors hover:text-primary">
                All
              </Link>
            </nav>
          </div>

          <Link href="/" className="justify-self-center text-center leading-none" aria-label="MEHR home">
            <span className="font-display text-2xl tracking-[0.3em] sm:text-3xl">MEHR</span>
            <span className="block text-[8px] tracking-[0.4em] uppercase text-muted-foreground">
              Handloom India
            </span>
          </Link>

          <div className="flex items-center justify-end gap-0.5">
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
              className="rounded-md p-2 transition-colors hover:text-primary"
            >
              {searchOpen ? (
                <X width={19} height={19} strokeWidth={1.5} />
              ) : (
                <Search width={19} height={19} strokeWidth={1.5} />
              )}
            </button>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden rounded-md p-2 transition-colors hover:text-primary sm:block"
            >
              <Heart width={19} height={19} strokeWidth={1.5} />
            </Link>
            <Link
              href={isAuthenticated ? "/account" : "/auth"}
              aria-label={isAuthenticated ? "Account" : "Sign in"}
              className="hidden rounded-md p-2 transition-colors hover:text-primary sm:block"
            >
              <User width={19} height={19} strokeWidth={1.5} />
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                aria-label="Admin dashboard"
                className="hidden rounded-md p-2 transition-colors hover:text-primary sm:block"
              >
                <LayoutDashboard width={19} height={19} strokeWidth={1.5} />
              </Link>
            ) : null}
            <button
              type="button"
              aria-label={`Bag, ${count} items`}
              onClick={() => setOpen(true)}
              className="relative rounded-md p-2 transition-colors hover:text-primary"
            >
              <ShoppingBag width={19} height={19} strokeWidth={1.5} />
              {count > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 animate-scale-in place-items-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "grid overflow-hidden border-border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            searchOpen ? "max-h-[480px] border-t opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6">
            <form onSubmit={submitSearch} className="flex gap-2">
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search sarees, lehengas, kurta sets…"
                className="h-10"
                autoComplete="off"
                aria-label="Search products"
              />
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>

            {suggestions.length > 0 ? (
              <ul className="mt-2 divide-y divide-border rounded-md border border-border bg-card">
                {suggestions.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={() => {
                        setTerm("");
                        setSearchOpen(false);
                      }}
                      className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 transition-colors hover:bg-secondary"
                    >
                      <SmartImage
                        src={product.images[0] ?? ""}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        width={40}
                        height={52}
                        className="h-[52px] w-10 rounded object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{product.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {product.category_slug.replace(/-/g, " ")}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
