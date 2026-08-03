"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Instagram, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { subscribeNewsletter } from "@/lib/catalog.actions";

const HELP_LINKS = [
  { label: "Size guide", href: "/size-guide" },
  { label: "Shipping & returns", href: "/shipping-returns" },
  { label: "Contact us", href: "/contact" },
  { label: "Track your order", href: "/orders" },
];

export function SiteFooter({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function subscribe(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await subscribeNewsletter({ email });
        if (!result.ok) {
          toast.error(result.message ?? "Please try again later.");
          return;
        }
        setEmail("");
        toast.success("You're on the list. Welcome to MEHR.");
      } catch {
        toast.error("Please enter a valid email address.");
      }
    });
  }

  return (
    <footer className="mt-20 border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-display text-3xl tracking-[0.28em]">MEHR</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Handloom womenswear from Varanasi, Kanchipuram, Lucknow and Bagru — made in small runs
              by the families who have always made it.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Instagram width={16} height={16} strokeWidth={1.5} />
              @mehr.handloom
            </a>
          </div>

          <nav>
            <h2 className="text-eyebrow text-muted-foreground">Shop</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="link-underline transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h2 className="text-eyebrow text-muted-foreground">Help</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="link-underline transition-colors hover:text-primary">
                  Our craft
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-eyebrow text-muted-foreground">The atelier letter</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              New drops, weaver stories and early access. No noise.
            </p>
            <form className="mt-4 flex gap-2" onSubmit={subscribe}>
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                aria-label="Email address"
              />
              <Button type="submit" disabled={pending} aria-label="Subscribe">
                <Mail width={16} height={16} strokeWidth={1.6} />
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MEHR Handloom. Made in India.</p>
          <p>Secure payments · UPI, cards, netbanking &amp; cash on delivery</p>
        </div>
      </div>
    </footer>
  );
}
