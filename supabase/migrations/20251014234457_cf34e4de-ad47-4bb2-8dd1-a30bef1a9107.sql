-- Create table for storing saved prompts per restaurant
CREATE TABLE restaurant_saved_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  prompt_text text NOT NULL,
  title text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE restaurant_saved_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view saved prompts"
  ON restaurant_saved_prompts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert saved prompts"
  ON restaurant_saved_prompts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update saved prompts"
  ON restaurant_saved_prompts FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete saved prompts"
  ON restaurant_saved_prompts FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_restaurant_saved_prompts_updated_at
  BEFORE UPDATE ON restaurant_saved_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_restaurant_saved_prompts_restaurant_id 
  ON restaurant_saved_prompts(restaurant_id);