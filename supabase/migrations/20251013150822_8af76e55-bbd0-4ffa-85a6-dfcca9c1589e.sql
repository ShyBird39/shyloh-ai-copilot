-- Create chat conversations table
CREATE TABLE chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  message_count integer DEFAULT 0
);

-- Create chat messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create restaurant files table
CREATE TABLE restaurant_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false,
  embeddings_generated boolean DEFAULT false,
  embeddings jsonb
);

-- Enable RLS on all tables
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_conversations
CREATE POLICY "Anyone can view conversations"
  ON chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON chat_conversations FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete conversations"
  ON chat_conversations FOR DELETE
  USING (true);

-- RLS policies for chat_messages
CREATE POLICY "Anyone can view messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update messages"
  ON chat_messages FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete messages"
  ON chat_messages FOR DELETE
  USING (true);

-- RLS policies for restaurant_files
CREATE POLICY "Anyone can view files"
  ON restaurant_files FOR SELECT
  USING (true);

CREATE POLICY "Anyone can upload files"
  ON restaurant_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update files"
  ON restaurant_files FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete files"
  ON restaurant_files FOR DELETE
  USING (true);

-- Create storage bucket for restaurant documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-documents', 'restaurant-documents', false);

-- Storage policies
CREATE POLICY "Anyone can view files in restaurant-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-documents');

CREATE POLICY "Anyone can upload files to restaurant-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'restaurant-documents');

CREATE POLICY "Anyone can update files in restaurant-documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'restaurant-documents');

CREATE POLICY "Anyone can delete files from restaurant-documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'restaurant-documents');

-- Add trigger for updating updated_at
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();