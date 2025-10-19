
-- Add tuning_profile column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN tuning_profile JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.tuning_profile IS 'Stores operator tuning preferences as JSON with keys: profit_motivation, service_philosophy, revenue_strategy, market_position, team_philosophy, innovation_appetite (each 0-100)';
