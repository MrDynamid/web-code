import type { Metadata } from "next"
import Link from "next/link"
import { ResetPasswordForm } from "@/components/reset-password-form"

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const params = await searchParams
  const token = params.token

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-20 sm:px-6">
      <p className="text-eyebrow text-muted-foreground">Account recovery</p>
      <h1 className="mt-2 font-display text-4xl text-balance">Choose a new password</h1>

      {token && !params.error ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Pick something at least 8 characters long that you don&apos;t use elsewhere.
          </p>
          <div className="mt-8">
            <ResetPasswordForm token={token} />
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-lg border bg-card p-6">
          <h2 className="font-display text-xl">This link isn&apos;t valid any more</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Reset links expire an hour after they&apos;re sent, and can only be used once. Request a fresh one to
            continue.
          </p>
          <Link
            href="/auth/forgot-password"
            className="mt-5 inline-block rounded-md bg-primary px-6 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground"
          >
            Request a new link
          </Link>
        </div>
      )}
    </div>
  )
}
