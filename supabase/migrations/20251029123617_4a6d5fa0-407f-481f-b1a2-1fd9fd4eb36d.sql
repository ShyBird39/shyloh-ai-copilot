-- Create restaurant_tasks table for personal to-do list
CREATE TABLE public.restaurant_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  restaurant_id text REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  notes text,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamp with time zone,
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.restaurant_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own tasks
CREATE POLICY "Users can manage their own tasks"
ON public.restaurant_tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to auto-archive completed tasks after 24 hours
CREATE OR REPLACE FUNCTION public.archive_completed_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.restaurant_tasks
  SET archived_at = now()
  WHERE completed = true
    AND completed_at < (now() - interval '24 hours')
    AND archived_at IS NULL;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_restaurant_tasks_updated_at
BEFORE UPDATE ON public.restaurant_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();