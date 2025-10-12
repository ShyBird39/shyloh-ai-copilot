-- Drop old single REGGI dimension columns
ALTER TABLE public.restaurants 
DROP COLUMN IF EXISTS culinary_beverage,
DROP COLUMN IF EXISTS vibe_energy,
DROP COLUMN IF EXISTS social_context,
DROP COLUMN IF EXISTS time_occasion,
DROP COLUMN IF EXISTS operational_execution,
DROP COLUMN IF EXISTS hospitality_approach;

-- Add new flat _code and _description columns for each REGGI dimension
ALTER TABLE public.restaurants 
ADD COLUMN culinary_beverage_code TEXT,
ADD COLUMN culinary_beverage_description TEXT,
ADD COLUMN vibe_energy_code TEXT,
ADD COLUMN vibe_energy_description TEXT,
ADD COLUMN social_context_code TEXT,
ADD COLUMN social_context_description TEXT,
ADD COLUMN time_occasion_code TEXT,
ADD COLUMN time_occasion_description TEXT,
ADD COLUMN operational_execution_code TEXT,
ADD COLUMN operational_execution_description TEXT,
ADD COLUMN hospitality_approach_code TEXT,
ADD COLUMN hospitality_approach_description TEXT;