-- Create restaurant_tools table to store software and tools used by each restaurant
CREATE TABLE public.restaurant_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  pos_system TEXT,
  reservation_system TEXT,
  payroll_system TEXT,
  accounting_system TEXT,
  inventory_system TEXT,
  scheduling_system TEXT,
  marketing_tools TEXT,
  other_tools JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurant_tools ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (matching the pattern of other tables)
CREATE POLICY "Anyone can view restaurant tools"
  ON public.restaurant_tools
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert restaurant tools"
  ON public.restaurant_tools
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update restaurant tools"
  ON public.restaurant_tools
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete restaurant tools"
  ON public.restaurant_tools
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_tools_updated_at
  BEFORE UPDATE ON public.restaurant_tools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();