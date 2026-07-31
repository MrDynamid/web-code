import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllCoupons } from '@/lib/coupons'
import { CouponForm } from '@/components/admin/coupon-form'
import { updateCoupon } from '@/app/admin/coupons/actions'

export const metadata = {
  title: 'Edit coupon · Admin',
}

export default async function AdminCouponEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const coupons = await getAllCoupons()
  const coupon = coupons.find((item) => item.id === Number(id))

  if (!coupon) notFound()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
          Offers
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
          Edit coupon
        </h1>
      </div>

      <CouponForm action={(prev, formData) => updateCoupon(coupon.id, prev, formData)} coupon={coupon} mode="edit" />
    </div>
  )
}
