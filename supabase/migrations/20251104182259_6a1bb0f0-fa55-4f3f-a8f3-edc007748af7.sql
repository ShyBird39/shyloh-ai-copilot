-- Fix is_restaurant_member to check for active status
CREATE OR REPLACE FUNCTION public.is_restaurant_member(_user_id uuid, _restaurant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_members
    WHERE user_id = _user_id
      AND restaurant_id = _restaurant_id
      AND status = 'active'
  )
$$;