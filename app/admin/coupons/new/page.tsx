import { requireAdmin } from '@/lib/admin-auth'
import { CouponForm } from '@/components/admin/coupon-form'
import { createCoupon } from '@/app/admin/coupons/actions'

export const metadata = {
  title: 'Add coupon · Admin',
}

export default async function AdminCouponNewPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
          Offers
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
          New coupon
        </h1>
      </div>

      <CouponForm action={createCoupon} mode="create" />
    </div>
  )
}
