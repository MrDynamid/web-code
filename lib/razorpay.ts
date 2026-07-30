import 'server-only'
import Razorpay from 'razorpay'

const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

/** True when Razorpay credentials are configured in the environment. */
export const razorpayConfigured = Boolean(keyId && keySecret)

/**
 * A shared Razorpay client. Returns null when credentials are missing so the
 * checkout can fall back to a clear "payments not configured" message instead
 * of throwing at import time.
 */
export const razorpay = razorpayConfigured
  ? new Razorpay({ key_id: keyId!, key_secret: keySecret! })
  : null
