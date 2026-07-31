'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Coupon } from '@/lib/db/schema'
import type { CouponActionState } from '@/app/admin/coupons/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Action = (
  prev: CouponActionState,
  formData: FormData,
) => Promise<CouponActionState>

export function CouponForm({
  action,
  coupon,
  mode,
}: {
  action: Action
  coupon?: Coupon
  mode: 'create' | 'edit'
}) {
  const router = useRouter()
  const [active, setActive] = useState(coupon?.active ?? true)
  const [type, setType] = useState<string>(coupon?.type ?? 'percentage')

  const [, formAction, pending] = useActionState(
    async (prev: CouponActionState, formData: FormData) => {
      const result = await action(prev, formData)
      if (result?.success) {
        toast.success(mode === 'create' ? 'Coupon created' : 'Coupon updated')
        router.push('/admin/coupons')
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
              <Label htmlFor="code">Coupon code</Label>
              <Input id="code" name="code" defaultValue={coupon?.code} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="label">Display label</Label>
              <Input
                id="label"
                name="label"
                defaultValue={coupon?.label ?? 'Promo code'}
                placeholder="Weekend special"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="type" value={type} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">Discount value</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  min={0}
                  defaultValue={coupon?.value ?? 0}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minOrder">Minimum order value (₹)</Label>
              <Input
                id="minOrder"
                name="minOrder"
                type="number"
                min={0}
                defaultValue={coupon?.minOrder ?? 0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card>
          <CardContent className="grid gap-5 pt-6">
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
            {mode === 'create' ? 'Create coupon' : 'Save changes'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/coupons">Cancel</Link>
          </Button>
        </div>
      </div>
    </form>
  )
}
