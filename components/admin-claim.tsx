"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { claimFirstAdmin } from "@/lib/admin.actions"
import { Button } from "@/components/ui/button"

export function AdminClaim() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      disabled={pending}
      className="tracking-[0.14em] uppercase"
      onClick={() =>
        startTransition(async () => {
          try {
            await claimFirstAdmin()
            toast.success("You are now the store owner")
            router.refresh()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not claim this store")
          }
        })
      }
    >
      {pending ? "Claiming…" : "Claim ownership"}
    </Button>
  )
}
