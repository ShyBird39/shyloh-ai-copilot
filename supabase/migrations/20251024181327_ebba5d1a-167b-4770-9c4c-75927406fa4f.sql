-- Add anthropic_api_key column to restaurants table for per-restaurant API keys
ALTER TABLE public.restaurants 
ADD COLUMN anthropic_api_key TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.restaurants.anthropic_api_key IS 'Optional restaurant-specific Anthropic API key. If not set, falls back to global ANTHROPIC_API_KEY secret.';

-- Create index for faster lookups
CREATE INDEX idx_restaurants_anthropic_api_key ON public.restaurants(id) WHERE anthropic_api_key IS NOT NULL;