'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { toggleBannerActive } from '@/app/admin/banners/actions'

export function BannerActiveToggle({
  id,
  active,
}: {
  id: number
  active: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(next: boolean) {
    startTransition(async () => {
      try {
        await toggleBannerActive(id, next)
        toast.success(next ? 'Banner activated' : 'Banner hidden')
        router.refresh()
      } catch {
        toast.error('Could not update banner.')
      }
    })
  }

  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={handleChange}
      aria-label="Toggle banner active"
    />
  )
}
