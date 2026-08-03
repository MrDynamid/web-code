import type { Metadata } from "next"
import { isEmailConfigured } from "@/lib/mail"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to choose a new password for your MEHR account.",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20 sm:px-6">
      <p className="text-eyebrow text-muted-foreground">Account recovery</p>
      <h1 className="mt-2 font-display text-4xl text-balance">Forgot your password?</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Enter the email you signed up with and we&apos;ll send a link to set a new one.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm emailConfigured={isEmailConfigured()} />
      </div>
    </div>
  )
}
