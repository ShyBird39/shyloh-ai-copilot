-- Rename columns to match Lindy's expected field names
ALTER TABLE public.restaurants 
  RENAME COLUMN restaurant_id TO id;

ALTER TABLE public.restaurants 
  RENAME COLUMN restaurant_name TO name;

ALTER TABLE public.restaurants 
  RENAME COLUMN hex_code_core TO hex_code;

ALTER TABLE public.restaurants 
  RENAME COLUMN hex_code_full TO augmented_hex_code;

ALTER TABLE public.restaurants 
  RENAME COLUMN cuisine_code TO category;