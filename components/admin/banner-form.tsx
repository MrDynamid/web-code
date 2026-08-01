'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Banner } from '@/lib/db/schema'
import type { BannerActionState } from '@/app/admin/banners/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUploader } from '@/components/admin/image-uploader'

type Action = (
  prev: BannerActionState,
  formData: FormData,
) => Promise<BannerActionState>

export function BannerForm({
  action,
  banner,
  mode,
}: {
  action: Action
  banner?: Banner
  mode: 'create' | 'edit'
}) {
  const router = useRouter()
  const [active, setActive] = useState(banner?.active ?? true)

  const [, formAction, pending] = useActionState(
    async (prev: BannerActionState, formData: FormData) => {
      const result = await action(prev, formData)
      if (result?.success) {
        toast.success(mode === 'create' ? 'Banner created' : 'Banner updated')
        router.push('/admin/banners')
        router.refresh()
      } else if (result?.error) {
        toast.error(result.error)
      }
      return result
    },
    null,
  )

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="grid gap-5 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input
                id="eyebrow"
                name="eyebrow"
                defaultValue={banner?.eyebrow ?? ''}
                placeholder="e.g. Autumn / Winter 2026"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={banner?.title} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                name="subtitle"
                defaultValue={banner?.subtitle ?? ''}
                rows={3}
              />
            </div>

            <ImageUploader
              name="image"
              label="Banner image"
              multiple={false}
              bucket="banner-images"
              defaultValue={banner?.image ? [banner.image] : []}
              hint="Recommended 1600×900 · up to 8 MB"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ctaLabel">CTA label</Label>
                <Input
                  id="ctaLabel"
                  name="ctaLabel"
                  defaultValue={banner?.ctaLabel ?? ''}
                  placeholder="Shop the collection"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ctaHref">CTA link</Label>
                <Input
                  id="ctaHref"
                  name="ctaHref"
                  defaultValue={banner?.ctaHref ?? ''}
                  placeholder="/products"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardContent className="grid gap-5 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                type="number"
                min={0}
                defaultValue={banner?.position ?? 0}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Position 0 is used as the hero.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
              <Switch id="active" checked={active} onCheckedChange={setActive} />
              <input type="hidden" name="active" value={active ? 'on' : ''} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {mode === 'create' ? 'Create banner' : 'Save changes'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/banners">Cancel</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
