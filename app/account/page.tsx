import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Heart, MapPin, Package } from "lucide-react"
import { getProfile } from "@/lib/account.actions"
import { getSession } from "@/lib/session"
import { AccountProfileForm } from "@/components/account-profile-form"

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const session = await getSession()
  if (!session?.user) redirect("/auth?redirect=/account")

  const { profile, address, orderCount } = await getProfile()

  const tiles = [
    {
      href: "/orders",
      icon: Package,
      label: "Orders",
      value: orderCount === 0 ? "None yet" : `${orderCount} placed`,
    },
    {
      href: "/wishlist",
      icon: Heart,
      label: "Wishlist",
      value: "Saved pieces",
    },
    {
      href: "/checkout",
      icon: MapPin,
      label: "Address",
      value: address ? `${address.city}, ${address.state}` : "Not saved yet",
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-eyebrow text-muted-foreground">Your account</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          {profile.full_name ? `Hello, ${profile.full_name.split(" ")[0]}` : "Hello"}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {session.user.email}
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-lg border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <tile.icon width={18} height={18} strokeWidth={1.6} />
            </span>
            <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">{tile.label}</p>
            <p className="mt-1 text-sm transition-colors group-hover:text-primary">{tile.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Your details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We use these to prefill checkout and to reach you about a delivery.
        </p>
        <div className="mt-6 rounded-lg border bg-card p-6">
          <AccountProfileForm
            fullName={profile.full_name ?? ""}
            phone={profile.phone ?? ""}
          />
        </div>
      </section>
    </div>
  )
}
