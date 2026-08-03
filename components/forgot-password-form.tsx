"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Loader2, MailCheck } from "lucide-react"
import { forgetPassword } from "@/lib/auth-client"
import { getDevResetLink } from "@/lib/auth-support.actions"

export function ForgotPasswordForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim()

    startTransition(async () => {
      const result = await forgetPassword({ email, redirectTo: "/auth/reset-password" })

      // Better Auth deliberately doesn't reveal whether the address exists, so
      // the success state is always the same — no account enumeration.
      if (result.error) {
        setError("Couldn't start the reset. Please try again in a moment.")
        return
      }

      setSent(true)
      // Without Resend configured the email can't arrive, so surface the link
      // directly (this returns null in production).
      if (!emailConfigured) {
        const { url } = await getDevResetLink({ email })
        setDevLink(url)
      }
    })
  }

  if (sent) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <MailCheck width={26} height={26} strokeWidth={1.3} className="mx-auto text-primary" />
        <h2 className="mt-4 font-display text-2xl">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          If an account exists for that address, we&apos;ve sent a link to choose a new password. It expires in one
          hour.
        </p>

        {!emailConfigured ? (
          <div className="mt-5 rounded-md bg-secondary p-4 text-left">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Email delivery isn&apos;t configured yet (no <code className="font-mono">RESEND_API_KEY</code>), so use
              this development link to finish resetting:
            </p>
            {devLink ? (
              <Link href={devLink} className="mt-2 block break-all text-xs text-primary underline">
                {devLink}
              </Link>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                No link was generated — that address may not have an account.
              </p>
            )}
          </div>
        ) : null}

        <Link href="/auth" className="link-underline mt-6 inline-block text-sm text-primary">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="text-sm">
        <span className="text-eyebrow text-muted-foreground">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 h-11 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:border-primary"
        />
      </label>

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-xs tracking-[0.18em] uppercase text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 width={15} height={15} className="animate-spin" /> : null}
        Send reset link
      </button>

      <Link href="/auth" className="link-underline justify-self-center text-sm text-primary">
        Back to sign in
      </Link>
    </form>
  )
}
