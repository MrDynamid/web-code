'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateOrderStatus, type OrderStatusState } from '@/app/admin/orders/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const OPTIONS = ['paid', 'processing', 'shipped', 'delivered', 'cancelled'] as const

export function OrderStatusControl({
  orderId,
  status,
  trackingNumber,
}: {
  orderId: number
  status: string
  trackingNumber: string | null
}) {
  const router = useRouter()
  const [value, setValue] = useState(
    (OPTIONS as readonly string[]).includes(status) ? status : 'paid',
  )

  const [, formAction, pending] = useActionState(
    async (prev: OrderStatusState, formData: FormData) => {
      formData.set('status', value)
      const result = await updateOrderStatus(prev, formData)
      if (result?.success) {
        toast.success(`Order #${orderId} updated`)
        router.refresh()
      } else if (result?.error) {
        toast.error(result.error)
      }
      return result
    },
    null,
  )

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="h-9 w-36 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        name="trackingNumber"
        defaultValue={trackingNumber ?? ''}
        placeholder="Tracking #"
        className="h-9 w-36"
      />
      <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        Save
      </Button>
    </form>
  )
}
