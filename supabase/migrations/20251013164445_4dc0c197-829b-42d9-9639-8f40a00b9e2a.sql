-- Ensure bucket exists (no-op if present)
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-documents', 'restaurant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for restaurant-documents bucket
-- Allow public read access to files in this bucket
CREATE POLICY "Public read for restaurant-documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'restaurant-documents');

-- Allow anyone to upload to this bucket
CREATE POLICY "Anyone can upload to restaurant-documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'restaurant-documents');

-- Allow updates (e.g., metadata) on files in this bucket
CREATE POLICY "Anyone can update restaurant-documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'restaurant-documents');

-- Allow deletes from this bucket
CREATE POLICY "Anyone can delete from restaurant-documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'restaurant-documents');