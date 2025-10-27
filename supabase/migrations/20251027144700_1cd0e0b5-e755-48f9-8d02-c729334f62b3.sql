-- Add soft delete columns to chat_messages
ALTER TABLE chat_messages
ADD COLUMN deleted_at TIMESTAMPTZ,
ADD COLUMN deleted_by UUID REFERENCES profiles(id);

-- Create index for performance on non-deleted messages
CREATE INDEX idx_chat_messages_deleted ON chat_messages(conversation_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Add RLS policy to allow conversation participants to soft-delete any message
CREATE POLICY "Conversation participants can soft-delete messages" ON chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations cc
      WHERE cc.id = chat_messages.conversation_id
      AND (
        is_super_admin(auth.uid()) 
        OR is_conversation_participant(auth.uid(), cc.id)
        OR can_manage_conversation(auth.uid(), cc.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations cc
      WHERE cc.id = chat_messages.conversation_id
      AND (
        is_super_admin(auth.uid()) 
        OR is_conversation_participant(auth.uid(), cc.id)
        OR can_manage_conversation(auth.uid(), cc.id)
      )
    )
  );

-- Create function to decrement message count when messages are soft-deleted
CREATE OR REPLACE FUNCTION decrement_message_count(p_conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chat_conversations 
  SET message_count = GREATEST(0, message_count - 1)
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;