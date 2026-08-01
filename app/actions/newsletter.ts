'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { newsletterSubscribers } from '@/lib/db/schema'

export async function subscribeNewsletter(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string } | null> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { error: 'Please enter a valid email address.' }

  try {
    await db
      .insert(newsletterSubscribers)
      .values({ email })
      .onConflictDoUpdate({
        target: newsletterSubscribers.email,
        set: { active: true },
      })
  } catch (err) {
    console.error('[Newsletter] Failed to save subscriber:', err)
    return { error: 'Could not subscribe. Please try again later.' }
  }

  revalidatePath('/')
  return { ok: true }
}
