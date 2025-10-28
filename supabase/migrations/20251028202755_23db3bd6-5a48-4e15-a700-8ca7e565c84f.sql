-- Add FOH and BOH hourly goal columns to restaurant_kpis table
ALTER TABLE public.restaurant_kpis 
ADD COLUMN IF NOT EXISTS foh_hourly_goal NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS boh_hourly_goal NUMERIC(10,2);

COMMENT ON COLUMN public.restaurant_kpis.foh_hourly_goal IS 'Front of house hourly labor rate goal in dollars';
COMMENT ON COLUMN public.restaurant_kpis.boh_hourly_goal IS 'Back of house hourly labor rate goal in dollars';