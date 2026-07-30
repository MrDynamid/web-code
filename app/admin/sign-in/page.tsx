import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/admin-auth'
import { AdminAuthForm } from '@/components/admin/admin-auth-form'

export const metadata = {
  title: 'Admin sign in · Maison Lumière',
}

export default async function AdminSignInPage() {
  const session = await getSession()
  if (session?.user) redirect('/admin')

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="animate-fade-slide flex w-full flex-col items-center">
        <AdminAuthForm />
        <Link
          href="/"
          className="mt-10 text-xs tracking-[0.15em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Back to store
        </Link>
      </div>
    </main>
  )
}
