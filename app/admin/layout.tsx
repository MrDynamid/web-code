import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/admin-auth'
import { getSession } from '@/lib/admin-auth'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata = {
  title: 'Admin · Maison Lumière',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession()

  // The sign-in page is rendered without chrome (unauthenticated users land here).
  // All other pages are protected; non-admins are redirected by requireAdmin().
  if (!session?.user) {
    return <>{children}</>
  }

  // Calling requireAdmin() here ensures the admin shell is only ever rendered
  // for users in ADMIN_EMAILS — no child page can forget to protect itself.
  const user = await requireAdmin()

  return (
    <AdminShell user={{ name: user.name ?? user.email, email: user.email }}>
      {children}
    </AdminShell>
  )
}
