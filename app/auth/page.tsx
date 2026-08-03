import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthForm } from "@/components/auth-form"
import { SmartImage } from "@/components/smart-image"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to track orders, save pieces to your wishlist and check out faster.",
  robots: { index: false, follow: false },
}

/** Only allow same-site redirects, so `?redirect=` can't be used for phishing. */
function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account"
  return value
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; mode?: string }>
}) {
  const [session, params] = await Promise.all([getSession(), searchParams])
  const redirectTo = safeRedirect(params.redirect)

  if (session?.user) redirect(redirectTo)

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-20">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-eyebrow text-muted-foreground">Your account</p>
        <h1 className="mt-2 font-display text-4xl text-balance">Welcome to MEHR</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Track orders, keep a wishlist across devices and check out in a couple of taps.
        </p>

        <div className="mt-8">
          <AuthForm
            initialMode={params.mode === "signup" ? "signup" : "signin"}
            redirectTo={redirectTo}
            googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
          />
        </div>
      </div>

      <div className="relative hidden overflow-hidden rounded-lg lg:block">
        <SmartImage
          src="/images/hero.jpg"
          alt="A handwoven MEHR saree photographed in natural light"
          width={900}
          height={1100}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes="50vw"
          className="aspect-[4/5] w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
        <blockquote className="absolute inset-x-8 bottom-8 text-ink-foreground">
          <p className="font-display text-2xl leading-snug text-balance">
            “Woven over six weeks by a family of four in Varanasi.”
          </p>
          <footer className="mt-2 text-xs tracking-[0.16em] uppercase opacity-80">The Banarasi edit</footer>
        </blockquote>
      </div>
    </div>
  )
}
