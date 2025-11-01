-- Create voice_memos table
CREATE TABLE voice_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  restaurant_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_type TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;

-- Restaurant members can view their restaurant's voice memos
CREATE POLICY "Restaurant members can view voice memos"
ON voice_memos FOR SELECT
USING (is_restaurant_member(auth.uid(), restaurant_id));

-- Restaurant members can create voice memos
CREATE POLICY "Restaurant members can create voice memos"
ON voice_memos FOR INSERT
WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id));

-- Users can update their own voice memos
CREATE POLICY "Users can update their own voice memos"
ON voice_memos FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own voice memos
CREATE POLICY "Users can delete their own voice memos"
ON voice_memos FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for voice memos
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-memos', 'voice-memos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice memos
CREATE POLICY "Users can view their restaurant's voice memos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-memos' AND
  EXISTS (
    SELECT 1 FROM voice_memos vm
    WHERE vm.audio_url = storage.objects.name
    AND is_restaurant_member(auth.uid(), vm.restaurant_id)
  )
);

CREATE POLICY "Restaurant members can upload voice memos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-memos' AND
  auth.uid() IS NOT NULL
);

-- Trigger to update updated_at
CREATE TRIGGER update_voice_memos_updated_at
BEFORE UPDATE ON voice_memos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();