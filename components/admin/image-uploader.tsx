'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ImagePlus, Loader as Loader2, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

async function uploadFile(file: File, bucket: string): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('bucket', bucket)
  const res = await fetch('/api/admin/upload', { method: 'POST', body })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Upload failed')
  return data.url as string
}

/**
 * Drag-and-drop image uploader for the admin. Uploads to Vercel Blob via the
 * admin-only route and syncs the resulting URLs into a hidden input named
 * `name` (comma-separated) so it submits with the surrounding form.
 */
export function ImageUploader({
  name,
  defaultValue = [],
  multiple = true,
  label = 'Images',
  hint,
  bucket = 'product-images',
}: {
  name: string
  defaultValue?: string[]
  multiple?: boolean
  label?: string
  hint?: string
  bucket?: string
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue.filter(Boolean))
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      const files = Array.from(fileList)
      setUploading(true)
      try {
        const uploaded: string[] = []
        for (const file of files) {
          uploaded.push(await uploadFile(file, bucket))
        }
        setUrls((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(-1)))
        toast.success(
          uploaded.length > 1 ? `${uploaded.length} images uploaded` : 'Image uploaded',
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [multiple],
  )

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }

  function makePrimary(index: number) {
    setUrls((prev) => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      return next
    })
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {urls.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {urls.length} image{urls.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <input type="hidden" name={name} value={urls.join(', ')} />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-muted/50',
          dragOver && 'border-primary bg-muted/50',
        )}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          {uploading
            ? 'Uploading…'
            : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-muted-foreground">
          {hint ?? 'JPEG, PNG, WebP or AVIF · up to 8 MB each'}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {urls.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              <Image
                src={url || '/placeholder.svg'}
                alt={`Upload ${index + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
              {multiple && index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {multiple && index !== 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-6"
                    title="Make primary"
                    onClick={() => makePrimary(index)}
                  >
                    <Star className="size-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="size-6"
                  title="Remove"
                  onClick={() => removeAt(index)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
