-- Create chat_message_feedback table
CREATE TABLE chat_message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  restaurant_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_note text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_message_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view feedback from accessible conversations"
ON chat_message_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations cc
    WHERE cc.id = chat_message_feedback.conversation_id
    AND (
      is_super_admin(auth.uid())
      OR is_conversation_participant(auth.uid(), cc.id)
      OR (cc.visibility = 'team' AND is_restaurant_member(auth.uid(), cc.restaurant_id))
      OR cc.visibility = 'public'
    )
  )
);

CREATE POLICY "Authenticated users can add feedback"
ON chat_message_feedback FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own feedback"
ON chat_message_feedback FOR UPDATE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_message_feedback_message ON chat_message_feedback(message_id);
CREATE INDEX idx_message_feedback_restaurant ON chat_message_feedback(restaurant_id);
CREATE INDEX idx_message_feedback_rating ON chat_message_feedback(rating);

-- Add feedback_stats column to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN feedback_stats jsonb DEFAULT '{"total": 0, "average": 0, "distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}}'::jsonb;

CREATE INDEX idx_chat_messages_feedback_stats ON chat_messages USING GIN(feedback_stats);