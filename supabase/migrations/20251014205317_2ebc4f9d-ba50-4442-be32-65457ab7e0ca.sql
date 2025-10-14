-- Add conversation state tracking columns to chat_conversations table
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS conversation_state jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS current_topic text,
ADD COLUMN IF NOT EXISTS intent_classification text,
ADD COLUMN IF NOT EXISTS wwahd_mode boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS topics_discussed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS awaiting_user_response boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_question_asked text;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chat_conversations_wwahd_mode ON chat_conversations(wwahd_mode);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_current_topic ON chat_conversations(current_topic);

-- Add comment for documentation
COMMENT ON COLUMN chat_conversations.conversation_state IS 'Flexible JSON for tracking multi-step conversation flows';
COMMENT ON COLUMN chat_conversations.current_topic IS 'Current conversation focus (e.g., food_cost_analysis, labor_scheduling)';
COMMENT ON COLUMN chat_conversations.intent_classification IS 'User goal (e.g., lower_costs, understand_metrics, seek_guidance)';
COMMENT ON COLUMN chat_conversations.wwahd_mode IS 'Boolean flag when user explicitly invokes WWAHD context';
COMMENT ON COLUMN chat_conversations.topics_discussed IS 'Array tracking breadcrumbs of conversation topics';
COMMENT ON COLUMN chat_conversations.awaiting_user_response IS 'Flag to prevent continuing multi-part responses';
COMMENT ON COLUMN chat_conversations.last_question_asked IS 'Last question asked by assistant for context on next user response';