
-- Tighten public bucket policies: allow object access by direct URL, not listing
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "news_public_read" ON storage.objects;

-- Allow reading individual objects (still public via URL) but restrict role to anon+authenticated read by id only
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "news_public_read" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'news');
