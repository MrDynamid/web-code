import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { BannerForm } from '@/components/admin/banner-form'
import { createBanner } from '../actions'

export default async function NewBannerPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/banners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Banners
      </Link>
      <h1 className="mt-3 mb-8 font-serif text-3xl tracking-tight md:text-4xl">
        New banner
      </h1>
      <BannerForm action={createBanner} mode="create" />
    </div>
  )
}
