import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/admin-auth'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

/**
 * Admin-only image upload to Vercel Blob (public store).
 * Returns the public CDN URL, which is stored directly on products/banners.
 */
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0 || !allowed.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPEG, PNG, WebP, AVIF or GIF.' },
        { status: 400 },
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 8 MB.' },
        { status: 400 },
      )
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
    const blob = await put(`products/${Date.now()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
