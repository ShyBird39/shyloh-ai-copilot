-- Fix RLS policies on chat_conversations to use authenticated role
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view accessible conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversation owners can update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Conversation owners can delete conversations" ON public.chat_conversations;

-- Recreate policies with authenticated role
CREATE POLICY "Authenticated users can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Users can view accessible conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) 
  OR is_conversation_participant(auth.uid(), id) 
  OR ((visibility = 'team'::text) AND is_restaurant_member(auth.uid(), restaurant_id)) 
  OR (visibility = 'public'::text)
);

CREATE POLICY "Conversation owners can update conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()) OR can_manage_conversation(auth.uid(), id));

CREATE POLICY "Conversation owners can delete conversations"
ON public.chat_conversations
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()) OR can_manage_conversation(auth.uid(), id));