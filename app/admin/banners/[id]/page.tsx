import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { getBannerById } from '@/lib/banners'
import { BannerForm } from '@/components/admin/banner-form'
import { updateBanner } from '../actions'

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const bannerId = Number(id)
  if (!Number.isInteger(bannerId)) notFound()

  const banner = await getBannerById(bannerId)
  if (!banner) notFound()

  const action = updateBanner.bind(null, banner.id)

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/banners"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Banners
      </Link>
      <h1 className="mt-3 mb-8 font-serif text-3xl tracking-tight md:text-4xl">
        Edit banner
      </h1>
      <BannerForm action={action} banner={banner} mode="edit" />
    </div>
  )
}
