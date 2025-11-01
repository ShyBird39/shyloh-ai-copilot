-- Create RLS policies for voice-memos storage bucket
-- Allow users to read their own voice memos
CREATE POLICY "Users can read their own voice memos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'voice-memos' 
  AND (storage.foldername(name))[1] IN (
    SELECT restaurant_id::text 
    FROM voice_memos 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to upload voice memos to their restaurant folders
CREATE POLICY "Users can upload voice memos to their restaurant"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'voice-memos'
  AND (storage.foldername(name))[1] IN (
    SELECT restaurant_id::text 
    FROM restaurant_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their own voice memos
CREATE POLICY "Users can delete their own voice memos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'voice-memos'
  AND (storage.foldername(name))[1] IN (
    SELECT restaurant_id::text 
    FROM voice_memos 
    WHERE user_id = auth.uid()
  )
);