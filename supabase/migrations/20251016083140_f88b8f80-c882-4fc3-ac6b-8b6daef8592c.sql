-- Add pinned column to restaurant_saved_prompts
ALTER TABLE restaurant_saved_prompts 
ADD COLUMN pinned boolean NOT NULL DEFAULT false;

-- Create index for faster queries on pinned prompts
CREATE INDEX idx_restaurant_saved_prompts_pinned 
ON restaurant_saved_prompts(restaurant_id, pinned) 
WHERE pinned = true;