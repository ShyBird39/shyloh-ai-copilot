-- Fix the chicken-and-egg RLS problem for conversation participants
-- Allow conversation creators to add themselves as the initial owner

-- Drop the existing policy that creates the chicken-and-egg problem
DROP POLICY IF EXISTS "Conversation owners can add participants" ON chat_conversation_participants;

-- Create new policy that allows:
-- 1. Super admins to add anyone
-- 2. Conversation creators to add themselves as owner (solves chicken-and-egg)
-- 3. Existing owners to add other participants
CREATE POLICY "Conversation creators and owners can add participants"
ON chat_conversation_participants
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    -- Allow conversation creator to add themselves as owner
    auth.uid() = user_id 
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE id = conversation_id 
      AND created_by = auth.uid()
    )
  )
  OR can_manage_conversation(auth.uid(), conversation_id)
);