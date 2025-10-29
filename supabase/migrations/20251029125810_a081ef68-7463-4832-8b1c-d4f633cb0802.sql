-- Add conversation_id to restaurant_files table for conversation-scoped files
ALTER TABLE public.restaurant_files
ADD COLUMN conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE SET NULL;

-- Create index for faster conversation-based file queries
CREATE INDEX idx_restaurant_files_conversation_id ON public.restaurant_files(conversation_id);

-- Add comment for clarity
COMMENT ON COLUMN public.restaurant_files.conversation_id IS 'Links file to a specific conversation. NULL for Knowledge Base (permanent) files.';