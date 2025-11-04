-- Re-enable RLS on chat_conversations (was disabled for debugging)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;