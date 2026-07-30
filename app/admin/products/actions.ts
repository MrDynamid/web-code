'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { getSessionUserId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'

export type ProductActionState = { error?: string; success?: boolean } | null

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return []
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function toCents(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === '') return null
  const dollars = Number(String(value).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(dollars)) return null
  return Math.round(dollars * 100)
}

function fieldsFromForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const price = toCents(formData.get('price'))
  const compareAtPrice = toCents(formData.get('compareAtPrice'))
  const slugInput = String(formData.get('slug') ?? '').trim()
  const badge = String(formData.get('badge') ?? '').trim()
  const imagesRaw = parseList(formData.get('images'))

  return {
    name,
    category,
    description,
    details: String(formData.get('details') ?? '').trim() || null,
    materials: String(formData.get('materials') ?? '').trim() || null,
    price,
    compareAtPrice,
    slug: slugInput ? slugify(slugInput) : slugify(name),
    badge: badge || null,
    images: imagesRaw.length ? imagesRaw : ['/placeholder.svg'],
    colors: parseList(formData.get('colors')),
    sizes: parseList(formData.get('sizes')),
    featured: formData.get('featured') === 'on',
    stock: Math.max(0, Number(formData.get('stock') ?? 0) || 0),
  }
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await getSessionUserId()
  const f = fieldsFromForm(formData)

  if (!f.name) return { error: 'Name is required.' }
  if (!f.category) return { error: 'Category is required.' }
  if (!f.description) return { error: 'Description is required.' }
  if (f.price === null || f.price <= 0) return { error: 'Enter a valid price.' }

  try {
    await db.insert(products).values({
      name: f.name,
      slug: f.slug,
      description: f.description,
      details: f.details,
      materials: f.materials,
      price: f.price,
      compareAtPrice: f.compareAtPrice,
      category: f.category,
      images: f.images,
      colors: f.colors,
      sizes: f.sizes,
      badge: f.badge,
      featured: f.featured,
      stock: f.stock,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create product.'
    if (message.includes('unique') || message.includes('duplicate')) {
      return { error: 'A product with this slug already exists.' }
    }
    return { error: message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidatePath('/products')
  return { success: true }
}

export async function updateProduct(
  id: number,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await getSessionUserId()
  const f = fieldsFromForm(formData)

  if (!f.name) return { error: 'Name is required.' }
  if (!f.category) return { error: 'Category is required.' }
  if (!f.description) return { error: 'Description is required.' }
  if (f.price === null || f.price <= 0) return { error: 'Enter a valid price.' }

  try {
    await db
      .update(products)
      .set({
        name: f.name,
        slug: f.slug,
        description: f.description,
        details: f.details,
        materials: f.materials,
        price: f.price,
        compareAtPrice: f.compareAtPrice,
        category: f.category,
        images: f.images,
        colors: f.colors,
        sizes: f.sizes,
        badge: f.badge,
        featured: f.featured,
        stock: f.stock,
      })
      .where(eq(products.id, id))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update product.'
    if (message.includes('unique') || message.includes('duplicate')) {
      return { error: 'A product with this slug already exists.' }
    }
    return { error: message }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath(`/products/${f.slug}`)
  return { success: true }
}

export async function deleteProduct(id: number): Promise<void> {
  await getSessionUserId()
  await db.delete(products).where(eq(products.id, id))
  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidatePath('/products')
}
