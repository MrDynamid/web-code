'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { coupons } from '@/lib/db/schema'

export type CouponActionState = { error?: string; success?: boolean } | null

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '-')
}

function fieldsFromForm(formData: FormData) {
  const code = normalizeCode(String(formData.get('code') ?? ''))
  const type = String(formData.get('type') ?? 'percentage')
  const value = Number(String(formData.get('value') ?? '0') || 0)
  const minOrder = Number(String(formData.get('minOrder') ?? '0') || 0)

  return {
    code,
    label: String(formData.get('label') ?? '').trim() || 'Promo code',
    type,
    value: Math.max(0, value),
    minOrder: Math.max(0, minOrder),
    active: formData.get('active') === 'on',
  }
}

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  await requireAdmin()
  const f = fieldsFromForm(formData)

  if (!f.code) return { error: 'Code is required.' }
  if (f.type !== 'percentage' && f.type !== 'fixed') {
    return { error: 'Coupon type must be percentage or fixed.' }
  }

  try {
    await db.insert(coupons).values(f)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create coupon.'
    return { error: message.includes('duplicate') ? 'That coupon code already exists.' : message }
  }

  revalidatePath('/admin/coupons')
  revalidatePath('/admin')
  return { success: true }
}

export async function updateCoupon(
  id: number,
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  await requireAdmin()
  const f = fieldsFromForm(formData)

  if (!f.code) return { error: 'Code is required.' }
  if (f.type !== 'percentage' && f.type !== 'fixed') {
    return { error: 'Coupon type must be percentage or fixed.' }
  }

  try {
    await db.update(coupons).set(f).where(eq(coupons.id, id))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update coupon.'
    return { error: message.includes('duplicate') ? 'That coupon code already exists.' : message }
  }

  revalidatePath('/admin/coupons')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteCoupon(id: number): Promise<void> {
  await requireAdmin()
  await db.delete(coupons).where(eq(coupons.id, id))
  revalidatePath('/admin/coupons')
  revalidatePath('/admin')
}

export async function toggleCouponActive(id: number, active: boolean): Promise<void> {
  await requireAdmin()
  await db.update(coupons).set({ active }).where(eq(coupons.id, id))
  revalidatePath('/admin/coupons')
  revalidatePath('/admin')
}
