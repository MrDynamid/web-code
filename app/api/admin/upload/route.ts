import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAdmin } from '@/lib/admin-auth'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const FOLDERS = new Set(['product-images', 'banner-images', 'review-images', 'avatars'])

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  const folder = (formData.get('bucket') as string) || 'product-images'

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP and GIF images are accepted.' },
      { status: 415 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be 8 MB or smaller.' }, { status: 413 })
  }
  if (!FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Invalid storage folder.' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
  const pathname = `${folder}/${Date.now()}-${safeName}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: true,
    })
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Upload failed: ' + message }, { status: 500 })
  }
}
