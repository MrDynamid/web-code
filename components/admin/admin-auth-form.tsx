'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'sign-in' | 'sign-up'

export function AdminAuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'sign-up') {
        const { error } = await authClient.signUp.email({ email, password, name })
        if (error) throw new Error(error.message ?? 'Could not create account.')
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) throw new Error(error.message ?? 'Invalid email or password.')
      }
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center">
        <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
          Maison Lumière
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight">
          {mode === 'sign-in' ? 'Admin sign in' : 'Create admin account'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'sign-in'
            ? 'Sign in to manage products and banners.'
            : 'Set up the first administrator account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'sign-up' && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="admin@maisonlumiere.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-11 w-full transition-all duration-200 hover:shadow-md" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setError(null)
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
        }}
        className="mt-6 w-full text-center text-sm text-muted-foreground transition-all duration-200 hover:text-foreground"
      >
        {mode === 'sign-in'
          ? 'Need to create the first admin account?'
          : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
