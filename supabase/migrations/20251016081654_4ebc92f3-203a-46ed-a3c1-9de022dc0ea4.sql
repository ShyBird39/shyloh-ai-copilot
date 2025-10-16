-- Add is_global column to restaurant_saved_prompts
ALTER TABLE public.restaurant_saved_prompts 
ADD COLUMN is_global BOOLEAN DEFAULT FALSE;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert saved prompts" ON public.restaurant_saved_prompts;
DROP POLICY IF EXISTS "Anyone can update saved prompts" ON public.restaurant_saved_prompts;
DROP POLICY IF EXISTS "Anyone can delete saved prompts" ON public.restaurant_saved_prompts;
DROP POLICY IF EXISTS "Anyone can view saved prompts" ON public.restaurant_saved_prompts;

-- New policy: Anyone authenticated can view all prompts (global + restaurant-specific)
CREATE POLICY "Authenticated users can view all prompts"
ON public.restaurant_saved_prompts FOR SELECT
TO authenticated
USING (true);

-- Super admin can manage global prompts
CREATE POLICY "Super admin can manage global prompts"
ON public.restaurant_saved_prompts FOR ALL
TO authenticated
USING (is_global AND is_super_admin(auth.uid()))
WITH CHECK (is_global AND is_super_admin(auth.uid()));

-- Restaurant members can manage their own prompts (non-global)
CREATE POLICY "Restaurant members can manage their prompts"
ON public.restaurant_saved_prompts FOR ALL
TO authenticated
USING (
  NOT is_global 
  AND is_restaurant_member(auth.uid(), restaurant_id)
)
WITH CHECK (
  NOT is_global 
  AND is_restaurant_member(auth.uid(), restaurant_id)
);