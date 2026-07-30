'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getSessionUserId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { banners } from '@/lib/db/schema'

export type BannerActionState = { error?: string; success?: boolean } | null

function fieldsFromForm(formData: FormData) {
  return {
    title: String(formData.get('title') ?? '').trim(),
    subtitle: String(formData.get('subtitle') ?? '').trim() || null,
    eyebrow: String(formData.get('eyebrow') ?? '').trim() || null,
    ctaLabel: String(formData.get('ctaLabel') ?? '').trim() || null,
    ctaHref: String(formData.get('ctaHref') ?? '').trim() || null,
    image: String(formData.get('image') ?? '').trim() || null,
    active: formData.get('active') === 'on',
    position: Math.max(0, Number(formData.get('position') ?? 0) || 0),
  }
}

export async function createBanner(
  _prev: BannerActionState,
  formData: FormData,
): Promise<BannerActionState> {
  await getSessionUserId()
  const f = fieldsFromForm(formData)
  if (!f.title) return { error: 'Title is required.' }

  try {
    await db.insert(banners).values(f)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create banner.' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

export async function updateBanner(
  id: number,
  _prev: BannerActionState,
  formData: FormData,
): Promise<BannerActionState> {
  await getSessionUserId()
  const f = fieldsFromForm(formData)
  if (!f.title) return { error: 'Title is required.' }

  try {
    await db.update(banners).set(f).where(eq(banners.id, id))
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update banner.' }
  }

  revalidatePath('/admin/banners')
  revalidatePath('/')
  return { success: true }
}

export async function deleteBanner(id: number): Promise<void> {
  await getSessionUserId()
  await db.delete(banners).where(eq(banners.id, id))
  revalidatePath('/admin/banners')
  revalidatePath('/')
}

export async function toggleBannerActive(id: number, active: boolean): Promise<void> {
  await getSessionUserId()
  await db.update(banners).set({ active }).where(eq(banners.id, id))
  revalidatePath('/admin/banners')
  revalidatePath('/')
}
