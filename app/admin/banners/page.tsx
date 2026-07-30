import Image from 'next/image'
import Link from 'next/link'
import { Pencil, Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllBanners } from '@/lib/banners'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteButton } from '@/components/admin/delete-button'
import { BannerActiveToggle } from '@/components/admin/banner-active-toggle'
import { deleteBanner } from './actions'
import { cn } from '@/lib/utils'

export default async function AdminBannersPage() {
  await requireAdmin()
  const banners = await getAllBanners()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Merchandising
          </p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            Banners
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The banner at position 0 drives the homepage hero. Others become
            editorial features.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/banners/new">
            <Plus className="size-4" /> Add banner
          </Link>
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No banners yet. Create one to feature it on the homepage.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((b) => (
            <Card key={b.id} className="overflow-hidden py-0">
              <CardContent className="flex flex-col gap-4 p-0 sm:flex-row">
                <div className="relative aspect-[16/9] w-full shrink-0 bg-muted sm:aspect-auto sm:w-56">
                  {b.image ? (
                    <Image
                      src={b.image}
                      alt=""
                      fill
                      sizes="224px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="tabular-nums">
                      #{b.position}
                    </Badge>
                    {b.eyebrow && (
                      <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                        {b.eyebrow}
                      </span>
                    )}
                    <Badge
                      variant={b.active ? 'default' : 'secondary'}
                      className={cn(!b.active && 'text-muted-foreground')}
                    >
                      {b.active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <h2 className="font-serif text-xl tracking-tight text-balance">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
                      {b.subtitle}
                    </p>
                  )}
                  {b.ctaLabel && (
                    <p className="text-xs text-muted-foreground">
                      CTA: <span className="text-foreground">{b.ctaLabel}</span>
                      {b.ctaHref ? ` → ${b.ctaHref}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border p-5 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:border-l">
                  <BannerActiveToggle id={b.id} active={b.active} />
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/banners/${b.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'size-8 text-muted-foreground hover:text-foreground',
                      )}
                      aria-label={`Edit ${b.title}`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteButton
                      id={b.id}
                      label={b.title}
                      action={deleteBanner}
                      successMessage="Banner deleted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
