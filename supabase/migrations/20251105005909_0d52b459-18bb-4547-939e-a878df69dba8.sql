-- Create a test function to check what auth.uid() returns
CREATE OR REPLACE FUNCTION public.test_auth_uid()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_uid_is_null', auth.uid() IS NULL,
    'current_user', current_user,
    'current_setting_role', current_setting('role', true)
  )
$$;