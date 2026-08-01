import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getSupabaseServer } from '@/lib/supabase-server'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const BUCKETS = new Set(['product-images', 'banner-images', 'review-images', 'avatars'])

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  const bucket = (formData.get('bucket') as string) || 'product-images'

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
  if (!BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid storage bucket.' }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
  const filePath = `${Date.now()}-${safeName}`

  const supabase = getSupabaseServer()
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return NextResponse.json({ url: urlData.publicUrl })
}
