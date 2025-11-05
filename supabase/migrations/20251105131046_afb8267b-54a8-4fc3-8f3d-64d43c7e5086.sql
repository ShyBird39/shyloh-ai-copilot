-- Fix the INSERT policy to explicitly allow super admins
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  (auth.uid() IS NOT NULL AND auth.uid() = created_by)
);