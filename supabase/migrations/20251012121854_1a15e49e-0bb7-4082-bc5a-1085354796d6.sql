-- Add new columns
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS price_band text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS restaurant_id text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS restaurant_name text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS hex_code_core text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS hex_code_full text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cuisine_code text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS culinary_beverage text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS vibe_energy text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS social_context text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS time_occasion text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS operational_execution text;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS hospitality_approach text;

-- Migrate data from old columns to new columns
UPDATE public.restaurants SET restaurant_id = id WHERE restaurant_id IS NULL;
UPDATE public.restaurants SET restaurant_name = name WHERE restaurant_name IS NULL;
UPDATE public.restaurants SET hex_code_core = hex_code WHERE hex_code_core IS NULL;
UPDATE public.restaurants SET hex_code_full = augmented_hex_code WHERE hex_code_full IS NULL;
UPDATE public.restaurants SET cuisine_code = category WHERE cuisine_code IS NULL;

-- Extract price_band from augmented_hex_code (format: "857875A86678-SEI001-ITA-$$")
UPDATE public.restaurants 
SET price_band = split_part(augmented_hex_code, '-', 4)
WHERE price_band IS NULL AND augmented_hex_code IS NOT NULL;

-- Migrate REGGI dimensions to JSON format combining code and description
UPDATE public.restaurants 
SET culinary_beverage = json_build_object('code', culinary_beverage_code, 'description', culinary_beverage_description)::text
WHERE culinary_beverage IS NULL;

UPDATE public.restaurants 
SET vibe_energy = json_build_object('code', vibe_energy_code, 'description', vibe_energy_description)::text
WHERE vibe_energy IS NULL;

UPDATE public.restaurants 
SET social_context = json_build_object('code', social_context_code, 'description', social_context_description)::text
WHERE social_context IS NULL;

UPDATE public.restaurants 
SET time_occasion = json_build_object('code', time_occasion_code, 'description', time_occasion_description)::text
WHERE time_occasion IS NULL;

UPDATE public.restaurants 
SET operational_execution = json_build_object('code', operational_execution_code, 'description', operational_execution_description)::text
WHERE operational_execution IS NULL;

UPDATE public.restaurants 
SET hospitality_approach = json_build_object('code', hospitality_approach_code, 'description', hospitality_approach_description)::text
WHERE hospitality_approach IS NULL;

-- Drop old primary key constraint if exists
ALTER TABLE public.restaurants DROP CONSTRAINT IF EXISTS restaurants_pkey;

-- Drop old columns
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS id;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS name;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS hex_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS augmented_hex_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS category;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS culinary_beverage_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS culinary_beverage_description;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS vibe_energy_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS vibe_energy_description;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS social_context_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS social_context_description;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS time_occasion_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS time_occasion_description;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS operational_execution_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS operational_execution_description;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS hospitality_approach_code;
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS hospitality_approach_description;

-- Set restaurant_id as primary key
ALTER TABLE public.restaurants ADD PRIMARY KEY (restaurant_id);

-- Set NOT NULL constraints on required columns
ALTER TABLE public.restaurants ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN restaurant_name SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN hex_code_core SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN hex_code_full SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN cuisine_code SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN culinary_beverage SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN vibe_energy SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN social_context SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN time_occasion SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN operational_execution SET NOT NULL;
ALTER TABLE public.restaurants ALTER COLUMN hospitality_approach SET NOT NULL;