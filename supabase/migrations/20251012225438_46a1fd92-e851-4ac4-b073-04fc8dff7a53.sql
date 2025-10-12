-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create restaurant KPIs table
CREATE TABLE public.restaurant_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  avg_weekly_sales NUMERIC,
  food_cost_goal NUMERIC,
  labor_cost_goal NUMERIC,
  sales_mix_food NUMERIC,
  sales_mix_liquor NUMERIC,
  sales_mix_wine NUMERIC,
  sales_mix_beer NUMERIC,
  sales_mix_na_bev NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id)
);

-- Enable RLS
ALTER TABLE public.restaurant_kpis ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view KPIs
CREATE POLICY "Anyone can view restaurant KPIs"
ON public.restaurant_kpis
FOR SELECT
USING (true);

-- Allow anyone to insert KPIs
CREATE POLICY "Anyone can insert restaurant KPIs"
ON public.restaurant_kpis
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update KPIs
CREATE POLICY "Anyone can update restaurant KPIs"
ON public.restaurant_kpis
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_kpis_updated_at
BEFORE UPDATE ON public.restaurant_kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();