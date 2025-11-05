-- Drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;

-- Create a simplified policy without the logging function call
CREATE POLICY "Authenticated users can create conversations" ON public.chat_conversations
FOR INSERT 
WITH CHECK (
  is_super_admin(auth.uid()) OR (auth.uid() IS NOT NULL AND auth.uid() = created_by)
);

-- Also drop the debug logging function and table since they're not working as intended
DROP FUNCTION IF EXISTS public.log_rls_check(uuid, uuid, boolean, text);
DROP TABLE IF EXISTS public.rls_debug_log;