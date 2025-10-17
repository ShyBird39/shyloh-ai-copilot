-- Add sort_order column to restaurant_agents for custom ordering
ALTER TABLE restaurant_agents 
ADD COLUMN sort_order integer DEFAULT 0;

-- Set initial sort order based on created_at
UPDATE restaurant_agents 
SET sort_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY created_at) as row_num
  FROM restaurant_agents
) as subquery
WHERE restaurant_agents.id = subquery.id;