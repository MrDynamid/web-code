import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Jost } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/lib/cart"
import { WishlistProvider } from "@/lib/wishlist"
import { CartDrawer } from "@/components/cart-drawer"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getNavData } from "@/lib/catalog.queries"
import { getWishlistSlugs } from "@/lib/account.actions"
import { getSession, isAdmin } from "@/lib/session"
import "./globals.css"

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
})

const sans = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "MEHR — Handcrafted Indian Womenswear",
    template: "%s · MEHR",
  },
  description:
    "Handwoven sarees, lehengas and everyday edits made with heritage Indian craft. Free shipping across India, easy 7-day returns.",
  keywords: ["Indian womenswear", "handloom saree", "lehenga", "kurta set", "ethnic wear", "MEHR"],
  generator: "v0.app",
  openGraph: {
    title: "MEHR — Handcrafted Indian Womenswear",
    description: "Handwoven sarees, lehengas and everyday edits made with heritage Indian craft.",
    type: "website",
    siteName: "MEHR",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#221a14" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The chrome (header nav, search type-ahead, wishlist hearts) is shared by
  // every route, so it's resolved once here on the server instead of being
  // re-fetched per page the way the TanStack loaders did.
  const [nav, session, admin] = await Promise.all([getNavData(), getSession(), isAdmin()])
  const isAuthenticated = Boolean(session?.user)
  const wishlistSlugs = isAuthenticated ? await getWishlistSlugs() : []

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} bg-background`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <CartProvider>
          <WishlistProvider initialSlugs={wishlistSlugs} isAuthenticated={isAuthenticated}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <SiteHeader
              categories={nav.categories}
              products={nav.products}
              isAuthenticated={isAuthenticated}
              isAdmin={admin}
            />
            <main id="main">{children}</main>
            <SiteFooter categories={nav.categories} />
            <CartDrawer />
            <Toaster position="bottom-right" />
          </WishlistProvider>
        </CartProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
