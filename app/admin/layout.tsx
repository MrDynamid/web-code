import type { ReactNode } from 'react'
import { getSession } from '@/lib/admin-auth'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata = {
  title: 'Admin · Maison Lumière',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession()

  // Unauthenticated requests (e.g. the sign-in page, which redirects authed
  // users away) render without the admin chrome. Protected pages additionally
  // call requireAdmin() to enforce access.
  if (!session?.user) {
    return <>{children}</>
  }

  return (
    <AdminShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AdminShell>
  )
}
