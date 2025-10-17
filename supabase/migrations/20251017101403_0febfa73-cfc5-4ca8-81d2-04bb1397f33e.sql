-- Update the existing P&L Agent name
UPDATE restaurant_agents 
SET name = 'P&L Analyst',
    updated_at = now()
WHERE name = 'SBSB P&L Agent';

-- Insert new agents (not active yet, with placeholder URLs)
INSERT INTO restaurant_agents (restaurant_id, name, description, is_active, icon, url)
VALUES 
  ('SHY001', 'Food Cost', 'AI-powered food cost analysis and optimization', false, 'UtensilsCrossed', ''),
  ('SHY001', 'Beverage Cost', 'AI-powered beverage cost analysis and optimization', false, 'Wine', ''),
  ('SHY001', 'New Opening', 'AI assistant for new restaurant opening preparation', false, 'Store', ''),
  ('SHY001', 'Profit Agent', 'AI-powered profit analysis and growth strategies', false, 'TrendingUp', '');