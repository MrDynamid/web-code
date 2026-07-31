'use server'

import { revalidatePath } from 'next/cache'

export async function subscribeNewsletter(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok?: boolean; error?: string } | null> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { error: 'Please enter a valid email address.' }

  // TODO: connect to a newsletter provider (e.g. Mailchimp, Resend, Loops)
  // For now we log the subscription server-side so it's not a silent no-op.
  console.log('[Newsletter] New signup:', email)

  revalidatePath('/')
  return { ok: true }
}
