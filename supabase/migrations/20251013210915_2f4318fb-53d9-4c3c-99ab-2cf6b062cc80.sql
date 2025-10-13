-- Add conversation_type column to chat_conversations to distinguish onboarding from regular conversations
ALTER TABLE public.chat_conversations 
ADD COLUMN conversation_type TEXT DEFAULT 'general' CHECK (conversation_type IN ('general', 'onboarding'));

-- Create index for performance when checking onboarding status
CREATE INDEX idx_chat_conversations_type ON public.chat_conversations(conversation_type);

-- Add comment for documentation
COMMENT ON COLUMN public.chat_conversations.conversation_type IS 'Type of conversation: general for normal chats, onboarding for first-time setup';