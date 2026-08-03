"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { resetPassword } from "@/lib/auth-client"
import { PasswordStrength, describePasswordIssue } from "@/components/password-strength"

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const issue = describePasswordIssue(password)
    if (issue) {
      setError(issue)
      return
    }
    if (password !== confirm) {
      setError("Those passwords don't match.")
      return
    }

    startTransition(async () => {
      const result = await resetPassword({ newPassword: password, token })
      if (result.error) {
        setError(result.error.message ?? "That reset link has expired. Please request a new one.")
        return
      }
      toast.success("Password updated — you can sign in now.")
      router.push("/auth")
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="text-sm">
        <span className="text-eyebrow text-muted-foreground">New password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className="mt-2 h-11 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:border-primary"
        />
      </label>

      <PasswordStrength value={password} />

      <label className="text-sm">
        <span className="text-eyebrow text-muted-foreground">Confirm password</span>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
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
        Update password
      </button>

      <Link href="/auth" className="link-underline justify-self-center text-sm text-primary">
        Back to sign in
      </Link>
    </form>
  )
}
