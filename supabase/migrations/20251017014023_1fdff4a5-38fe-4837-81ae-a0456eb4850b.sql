-- Add tags column to restaurant_files
ALTER TABLE public.restaurant_files
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create custom tags table for user-created tags
CREATE TABLE public.restaurant_custom_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(restaurant_id, tag_name)
);

-- Enable RLS
ALTER TABLE public.restaurant_custom_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom tags
CREATE POLICY "Restaurant members can view custom tags"
ON public.restaurant_custom_tags
FOR SELECT
USING (is_super_admin(auth.uid()) OR is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Restaurant members can create custom tags"
ON public.restaurant_custom_tags
FOR INSERT
WITH CHECK (is_super_admin(auth.uid()) OR is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Restaurant members can delete custom tags"
ON public.restaurant_custom_tags
FOR DELETE
USING (is_super_admin(auth.uid()) OR is_restaurant_member(auth.uid(), restaurant_id));