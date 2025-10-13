-- Create restaurant_custom_knowledge table for storing text-based rules and concepts
CREATE TABLE public.restaurant_custom_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_custom_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for open access (matching other tables in the app)
CREATE POLICY "Anyone can view custom knowledge"
ON public.restaurant_custom_knowledge
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert custom knowledge"
ON public.restaurant_custom_knowledge
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update custom knowledge"
ON public.restaurant_custom_knowledge
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete custom knowledge"
ON public.restaurant_custom_knowledge
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_knowledge_updated_at
BEFORE UPDATE ON public.restaurant_custom_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();