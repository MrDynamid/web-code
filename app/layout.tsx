import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ShopEase — Best Deals on Electronics, Fashion & More',
    template: '%s | ShopEase',
  },
  description:
    'ShopEase is your one-stop online marketplace for electronics, fashion, home & kitchen, beauty, sports and books. Free delivery on orders above ₹200.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1c1a18' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1a18' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light bg-background ${jost.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased transition-colors duration-300">
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 transition-all duration-300">{children}</main>
            <SiteFooter />
          </div>
        </CartProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
