export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/admin-auth'
import { CheckoutForm } from '@/components/checkout-form'
import { razorpayConfigured } from '@/lib/razorpay'

export const metadata = {
  title: 'Checkout',
}

export default async function CheckoutPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login?redirect=/checkout')

  return <CheckoutForm userEmail={session.user.email} razorpayReady={razorpayConfigured} />
}
