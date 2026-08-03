"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { signIn, signUp } from "@/lib/auth-client"
import { checkSignInAllowed, clearSignInFailures, recordSignInFailure } from "@/lib/auth-guard.actions"
import { PasswordStrength, describePasswordIssue } from "@/components/password-strength"
import { cn } from "@/lib/utils"

type Mode = "signin" | "signup"

export function AuthForm({
  initialMode,
  redirectTo,
  googleEnabled,
}: {
  initialMode: Mode
  redirectTo: string
  googleEnabled: boolean
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [googlePending, setGooglePending] = useState(false)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const name = String(form.get("name") ?? "").trim()

    startTransition(async () => {
      if (mode === "signup") {
        const issue = describePasswordIssue(password)
        if (issue) {
          setError(issue)
          return
        }

        const result = await signUp.email({ email, password, name: name || email.split("@")[0]! })
        if (result.error) {
          setError(result.error.message ?? "Couldn't create that account.")
          return
        }
        toast.success("Welcome to MEHR")
        router.push(redirectTo)
        router.refresh()
        return
      }

      // Rate-limit sign-in per email and per IP before touching Better Auth, so
      // credential stuffing gets throttled at the edge of our own code.
      const gate = await checkSignInAllowed({ email })
      if (!gate.allowed) {
        const minutes = Math.ceil(gate.retryAfter / 60)
        setError(`Too many failed attempts. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`)
        return
      }

      const result = await signIn.email({ email, password })
      if (result.error) {
        await recordSignInFailure({ email })
        setError("That email and password don't match an account.")
        return
      }

      await clearSignInFailures({ email })
      toast.success("Signed in")
      router.push(redirectTo)
      router.refresh()
    })
  }

  async function google() {
    setGooglePending(true)
    try {
      await signIn.social({ provider: "google", callbackURL: redirectTo })
    } catch {
      setGooglePending(false)
      toast.error("Couldn't start Google sign-in.")
    }
  }

  return (
    <div>
      <div className="flex rounded-md border p-1" role="tablist">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value)
              setError(null)
            }}
            className={cn(
              "flex-1 rounded-sm py-2 text-xs tracking-[0.16em] uppercase transition-colors",
              mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        {mode === "signup" ? (
          <label className="text-sm">
            <span className="text-eyebrow text-muted-foreground">Full name</span>
            <input
              name="name"
              autoComplete="name"
              placeholder="Ananya Rao"
              className="mt-2 h-11 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:border-primary"
            />
          </label>
        ) : null}

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

        <label className="text-sm">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-eyebrow text-muted-foreground">Password</span>
            {mode === "signin" ? (
              <Link
                href="/auth/forgot-password"
                className="link-underline text-[11px] tracking-normal normal-case text-primary"
              >
                Forgot password?
              </Link>
            ) : null}
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-2 h-11 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:border-primary"
          />
        </label>

        {mode === "signup" ? <PasswordStrength value={password} /> : null}

        {error ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center justify-center gap-2 rounded-md bg-primary text-xs tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? <Loader2 width={15} height={15} className="animate-spin" /> : null}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={googlePending}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border text-sm transition-colors hover:border-primary disabled:opacity-60"
          >
            {googlePending ? (
              <Loader2 width={15} height={15} className="animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </button>
        </>
      ) : null}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        By continuing you agree to our terms and privacy policy. We never share your details.
      </p>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H1v2.34A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H1a9 9 0 0 0 0 8.12l2.97-2.34Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 1 4.94l2.97 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
