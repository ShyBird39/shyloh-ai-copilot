-- Add storage_type and description columns to restaurant_files
ALTER TABLE restaurant_files 
ADD COLUMN storage_type text NOT NULL DEFAULT 'temporary' 
CHECK (storage_type IN ('temporary', 'permanent'));

ALTER TABLE restaurant_files
ADD COLUMN description text;

-- Add index for efficient filtering by storage type
CREATE INDEX idx_restaurant_files_storage_type 
ON restaurant_files(restaurant_id, storage_type, uploaded_at DESC);