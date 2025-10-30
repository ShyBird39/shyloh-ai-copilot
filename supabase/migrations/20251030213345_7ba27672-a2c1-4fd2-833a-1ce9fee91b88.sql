-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create shift_logs table for individual log entries
CREATE TABLE public.shift_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_type TEXT NOT NULL DEFAULT 'dinner', -- breakfast, lunch, dinner, overnight
  log_category TEXT NOT NULL, -- incident, maintenance, staff_notes, guest_feedback, eighty_sixed, shout_outs
  urgency_level TEXT NOT NULL DEFAULT 'normal', -- normal, urgent
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- structured data like staff names, menu items, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shift_summaries table for AI-generated daily summaries
CREATE TABLE public.shift_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  summary_markdown TEXT NOT NULL,
  action_items JSONB DEFAULT '[]'::jsonb, -- array of {task, completed, urgency}
  toast_metrics JSONB DEFAULT '{}'::jsonb, -- {sales, covers, labor_percent, etc}
  generated_by UUID NOT NULL, -- user who triggered generation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, shift_date, shift_type)
);

-- Create shift_log_embeddings table for vector search
CREATE TABLE public.shift_log_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_log_id UUID REFERENCES public.shift_logs(id) ON DELETE CASCADE,
  shift_summary_id UUID REFERENCES public.shift_summaries(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_shift_logs_restaurant_date ON public.shift_logs(restaurant_id, shift_date DESC);
CREATE INDEX idx_shift_logs_category ON public.shift_logs(log_category);
CREATE INDEX idx_shift_logs_urgency ON public.shift_logs(urgency_level) WHERE urgency_level = 'urgent';
CREATE INDEX idx_shift_summaries_restaurant_date ON public.shift_summaries(restaurant_id, shift_date DESC);

-- Add HNSW index for fast vector similarity search
CREATE INDEX idx_shift_log_embeddings_vector ON public.shift_log_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_log_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_logs
CREATE POLICY "Restaurant members can create shift logs"
  ON public.shift_logs FOR INSERT
  WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Restaurant members can view shift logs"
  ON public.shift_logs FOR SELECT
  USING (is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Users can update their own shift logs"
  ON public.shift_logs FOR UPDATE
  USING (auth.uid() = user_id AND created_at > (now() - interval '24 hours'));

CREATE POLICY "Users can delete their own shift logs"
  ON public.shift_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for shift_summaries
CREATE POLICY "Restaurant members can view shift summaries"
  ON public.shift_summaries FOR SELECT
  USING (is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Restaurant members can create shift summaries"
  ON public.shift_summaries FOR INSERT
  WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id));

CREATE POLICY "Restaurant members can update shift summaries"
  ON public.shift_summaries FOR UPDATE
  USING (is_restaurant_member(auth.uid(), restaurant_id));

-- RLS Policies for shift_log_embeddings
CREATE POLICY "Restaurant members can view embeddings"
  ON public.shift_log_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shift_logs sl
      WHERE sl.id = shift_log_embeddings.shift_log_id
      AND is_restaurant_member(auth.uid(), sl.restaurant_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.shift_summaries ss
      WHERE ss.id = shift_log_embeddings.shift_summary_id
      AND is_restaurant_member(auth.uid(), ss.restaurant_id)
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_shift_logs_updated_at
  BEFORE UPDATE ON public.shift_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_summaries_updated_at
  BEFORE UPDATE ON public.shift_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();