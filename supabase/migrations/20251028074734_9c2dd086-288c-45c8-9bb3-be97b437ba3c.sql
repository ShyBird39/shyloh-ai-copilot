-- Add hard_mode_enabled to conversations
ALTER TABLE chat_conversations
ADD COLUMN hard_mode_enabled BOOLEAN DEFAULT false;

-- Add hard_mode_used flag to messages
ALTER TABLE chat_messages
ADD COLUMN hard_mode_used BOOLEAN DEFAULT false;

-- Create Hard Mode usage tracking table
CREATE TABLE IF NOT EXISTS chat_hard_mode_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  restaurant_id TEXT REFERENCES restaurants(id),
  user_id UUID REFERENCES profiles(id),
  message_id UUID REFERENCES chat_messages(id),
  model_used TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hard_mode_usage_conv ON chat_hard_mode_usage(conversation_id);
CREATE INDEX idx_hard_mode_usage_restaurant ON chat_hard_mode_usage(restaurant_id, created_at DESC);

-- Enable RLS
ALTER TABLE chat_hard_mode_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their restaurant's hard mode usage" ON chat_hard_mode_usage
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()
    )
  );

-- Create index for Hard Mode messages
CREATE INDEX idx_chat_messages_hard_mode ON chat_messages(conversation_id, hard_mode_used) 
WHERE hard_mode_used = true;