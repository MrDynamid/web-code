/*
# Create Supabase Storage Buckets

1. New Storage Buckets
- `product-images` — public bucket for product photos uploaded via admin
- `banner-images` — public bucket for homepage/editorial banners
- `review-images` — public bucket for customer review photos
- `avatars` — public bucket for user profile pictures

2. Security
- All buckets are public (read access without authentication) so the storefront
  can display images without signed URLs.
- Write access is controlled via Storage policies:
  - product-images, banner-images: only authenticated admin users can upload
  - review-images: any authenticated user can upload
  - avatars: any authenticated user can upload to their own folder
- All uploads require authentication (no anon writes to admin buckets).

3. Notes
- Buckets are created with `public = true` so images are served via the
  Supabase Storage public URL (no signed URLs needed for reads).
- File size limits are enforced in the application layer (8MB).
*/

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('banner-images', 'banner-images', true),
  ('review-images', 'review-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Product images: only authenticated users can upload/update/delete
DROP POLICY IF EXISTS "product_images_upload_authenticated" ON storage.objects;
CREATE POLICY "product_images_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_update_authenticated" ON storage.objects;
CREATE POLICY "product_images_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_delete_authenticated" ON storage.objects;
CREATE POLICY "product_images_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Banner images: only authenticated users can upload/update/delete
DROP POLICY IF EXISTS "banner_images_upload_authenticated" ON storage.objects;
CREATE POLICY "banner_images_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "banner_images_update_authenticated" ON storage.objects;
CREATE POLICY "banner_images_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banner-images')
WITH CHECK (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "banner_images_delete_authenticated" ON storage.objects;
CREATE POLICY "banner_images_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banner-images');

-- Review images: any authenticated user can upload
DROP POLICY IF EXISTS "review_images_upload_authenticated" ON storage.objects;
CREATE POLICY "review_images_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-images');

DROP POLICY IF EXISTS "review_images_delete_own" ON storage.objects;
CREATE POLICY "review_images_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'review-images');

-- Avatars: any authenticated user can upload/update/delete their own
DROP POLICY IF EXISTS "avatars_upload_authenticated" ON storage.objects;
CREATE POLICY "avatars_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_update_authenticated" ON storage.objects;
CREATE POLICY "avatars_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_delete_authenticated" ON storage.objects;
CREATE POLICY "avatars_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Public read for all buckets (already implied by public=true, but explicit)
DROP POLICY IF EXISTS "public_read_all_buckets" ON storage.objects;
CREATE POLICY "public_read_all_buckets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN ('product-images', 'banner-images', 'review-images', 'avatars'));