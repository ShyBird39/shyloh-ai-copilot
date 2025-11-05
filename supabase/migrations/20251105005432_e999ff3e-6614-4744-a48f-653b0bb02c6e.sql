-- Drop and recreate the INSERT policy with correct configuration
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;

-- Create new policy that properly checks auth
CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = created_by
);