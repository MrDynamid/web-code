'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={loading} className="h-11">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" strokeWidth={1.5} />}
      Sign out
    </Button>
  )
}
