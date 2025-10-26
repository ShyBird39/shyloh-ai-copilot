-- Add notion_enabled column to chat_conversations table
ALTER TABLE chat_conversations 
ADD COLUMN notion_enabled boolean DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN chat_conversations.notion_enabled IS 'When true, Notion tools are automatically enabled for all messages in this conversation';