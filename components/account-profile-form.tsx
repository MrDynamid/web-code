"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveProfile } from "@/lib/account.actions"
import { signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AccountProfileForm({
  fullName,
  phone,
}: {
  fullName: string
  phone: string
}) {
  const router = useRouter()
  const [name, setName] = useState(fullName)
  const [tel, setTel] = useState(phone)
  const [pending, startTransition] = useTransition()
  const [signingOut, setSigningOut] = useState(false)

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        await saveProfile({ full_name: name.trim(), phone: tel.trim() })
        toast.success("Details saved")
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save your details")
      }
    })
  }

  async function onSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      router.push("/")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-name" className="text-eyebrow text-muted-foreground">
            Full name
          </Label>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            minLength={2}
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account-phone" className="text-eyebrow text-muted-foreground">
            Phone
          </Label>
          <Input
            id="account-phone"
            value={tel}
            onChange={(event) => setTel(event.target.value)}
            placeholder="10-digit mobile"
            inputMode="tel"
            maxLength={20}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" disabled={pending} className="tracking-[0.14em] uppercase">
          {pending ? "Saving…" : "Save details"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSignOut}
          disabled={signingOut}
          className="tracking-[0.14em] uppercase"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </form>
  )
}
