-- Add tuning_pin column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN tuning_pin text;

-- Create index for faster PIN lookups
CREATE INDEX idx_restaurants_tuning_pin ON public.restaurants(id, tuning_pin);