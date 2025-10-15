-- Fix RLS policy for chat_conversations to allow super admins to create conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (is_super_admin(auth.uid()) OR is_restaurant_member(auth.uid(), restaurant_id))
);