-- Simplify the INSERT policy for chat_conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON chat_conversations;

CREATE POLICY "Authenticated users can create conversations" 
ON chat_conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);