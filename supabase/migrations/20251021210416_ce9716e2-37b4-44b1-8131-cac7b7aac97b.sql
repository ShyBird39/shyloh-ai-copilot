-- Allow users to view profiles of other members in restaurants they share
-- This fixes UI showing only roles because profile RLS hid display_name/email

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Users can view profiles of members in their restaurants'
  ) THEN
    CREATE POLICY "Users can view profiles of members in their restaurants"
    ON public.profiles
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.restaurant_members rm_self
        JOIN public.restaurant_members rm_other
          ON rm_other.restaurant_id = rm_self.restaurant_id
        WHERE rm_self.user_id = auth.uid()
          AND rm_other.user_id = profiles.id
      )
    );
  END IF;
END $$;
