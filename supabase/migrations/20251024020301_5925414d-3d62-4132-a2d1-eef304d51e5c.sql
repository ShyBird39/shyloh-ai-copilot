-- Add tuning_completed flag to track if tuning flow is complete
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tuning_completed boolean DEFAULT false;