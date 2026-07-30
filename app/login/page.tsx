import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/admin-auth'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Sign in',
}

export default async function LoginPage() {
  const session = await getSession()
  if (session?.user) redirect('/account')

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="animate-fade-slide flex w-full flex-col items-center">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  )
}
