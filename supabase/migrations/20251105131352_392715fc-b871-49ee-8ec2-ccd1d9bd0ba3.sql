-- Create a debug logging table
CREATE TABLE IF NOT EXISTS public.rls_debug_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  auth_uid uuid,
  created_by uuid,
  values_match boolean,
  is_super_admin boolean,
  message text
);

-- Allow anyone to insert debug logs (temporary for debugging)
ALTER TABLE public.rls_debug_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert debug logs" ON public.rls_debug_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view debug logs" ON public.rls_debug_log FOR SELECT USING (true);

-- Create a logging function to use in RLS
CREATE OR REPLACE FUNCTION public.log_rls_check(
  _auth_uid uuid,
  _created_by uuid,
  _is_super_admin boolean,
  _message text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.rls_debug_log (auth_uid, created_by, values_match, is_super_admin, message)
  VALUES (_auth_uid, _created_by, _auth_uid = _created_by, _is_super_admin, _message);
  RETURN true;
END;
$$;

-- Update the policy to include logging
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  log_rls_check(auth.uid(), created_by, is_super_admin(auth.uid()), 'INSERT attempt') AND
  (is_super_admin(auth.uid()) OR (auth.uid() IS NOT NULL AND auth.uid() = created_by))
);