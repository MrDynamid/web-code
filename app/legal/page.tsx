import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Policies | Maison Lumière',
  description: 'Privacy policy, terms of service and accessibility statement for Maison Lumière.',
}

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Legal</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Policies</h1>

      <nav className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="#privacy" className="text-gold underline underline-offset-4">Privacy Policy</Link>
        <Link href="#terms" className="text-gold underline underline-offset-4">Terms of Service</Link>
        <Link href="#accessibility" className="text-gold underline underline-offset-4">Accessibility</Link>
      </nav>

      <section id="privacy" className="mt-14 scroll-mt-28">
        <h2 className="font-serif text-2xl tracking-tight">Privacy Policy</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We collect only the information needed to fulfil your orders and improve your
          experience — your name, contact details, shipping address and order history. We never
          sell your personal data.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Payment details are processed securely by our payment provider and are never stored on our servers.</li>
          <li>You can request access to, or deletion of, your data at any time by contacting us.</li>
          <li>We use essential cookies to keep you signed in and remember your cart.</li>
        </ul>
      </section>

      <section id="terms" className="mt-14 scroll-mt-28 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">Terms of Service</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          By placing an order with Maison Lumière you agree to the following terms.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>All prices are listed in Indian Rupees and include applicable taxes.</li>
          <li>Orders are confirmed only once payment has been successfully received.</li>
          <li>We reserve the right to cancel any order in the rare event of a pricing or stock error, with a full refund.</li>
          <li>Returns are governed by our Shipping &amp; Returns policy.</li>
        </ul>
        <Link href="/shipping-returns" className="mt-5 inline-block text-sm font-medium text-gold underline underline-offset-4">
          Read Shipping &amp; Returns
        </Link>
      </section>

      <section id="accessibility" className="mt-14 scroll-mt-28 border-t border-border pt-14">
        <h2 className="font-serif text-2xl tracking-tight">Accessibility</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We are committed to making maisonlumiere.com usable for everyone. We aim to meet WCAG
          2.1 AA standards, with semantic markup, keyboard navigation and sufficient colour
          contrast throughout the store.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          If you encounter any barrier while browsing or checking out, please let us know so we
          can put it right.
        </p>
        <Link href="/contact" className="mt-5 inline-block text-sm font-medium text-gold underline underline-offset-4">
          Report an accessibility issue
        </Link>
      </section>
    </div>
  )
}
