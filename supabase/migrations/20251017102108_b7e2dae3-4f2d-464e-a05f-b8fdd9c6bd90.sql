-- Add Reservation and CRM agents
INSERT INTO restaurant_agents (restaurant_id, name, description, is_active, icon, url, sort_order)
VALUES 
  ('SHY001', 'Reservation Agent', 'AI-powered reservation management and optimization', false, 'CalendarCheck', '', 100),
  ('SHY001', 'CRM Agent', 'AI-powered customer relationship management', false, 'Users', '', 101);