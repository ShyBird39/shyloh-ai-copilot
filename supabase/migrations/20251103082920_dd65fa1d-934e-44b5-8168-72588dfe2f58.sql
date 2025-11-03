-- Create predefined_tags table
CREATE TABLE public.predefined_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.predefined_tags ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view tags
CREATE POLICY "Anyone can view predefined tags"
  ON public.predefined_tags
  FOR SELECT
  USING (true);

-- Add tags column to shift_logs
ALTER TABLE public.shift_logs
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX idx_shift_logs_tags ON public.shift_logs USING GIN(tags);

-- Seed predefined tags
INSERT INTO public.predefined_tags (tag_name, display_name, category, keywords, sort_order) VALUES
-- Sales & Business Performance
('sales-record', 'Record Sales Day', 'Sales & Business', ARRAY['record', 'sales', 'busiest', 'best day', 'highest'], 1),
('slow-day', 'Slow Day', 'Sales & Business', ARRAY['slow', 'quiet', 'dead', 'empty', 'light'], 2),
('weather-impact', 'Weather Impact', 'Sales & Business', ARRAY['weather', 'rain', 'storm', 'snow', 'cold', 'hot'], 3),
('party-booking', 'Large Party', 'Sales & Business', ARRAY['party', 'group', 'reservation', 'booking', 'large party'], 4),
('walk-in-surge', 'Walk-in Surge', 'Sales & Business', ARRAY['walk-in', 'unexpected', 'rush', 'surge'], 5),

-- Staffing & Labor
('call-out', 'Staff Call-out', 'Staffing & Labor', ARRAY['call out', 'called out', 'sick', 'no show', 'absent'], 6),
('short-staffed', 'Short Staffed', 'Staffing & Labor', ARRAY['short', 'understaffed', 'need help', 'not enough'], 7),
('great-service', 'Great Service', 'Staffing & Labor', ARRAY['excellent', 'great service', 'amazing', 'outstanding'], 8),
('training-needed', 'Training Needed', 'Staffing & Labor', ARRAY['training', 'needs training', 'new hire', 'learn'], 9),
('staff-recognition', 'Staff Recognition', 'Staffing & Labor', ARRAY['shoutout', 'praise', 'great job', 'recognition', 'kudos'], 10),

-- Guest Experience
('vip-guest', 'VIP Guest', 'Guest Experience', ARRAY['vip', 'regular', 'important guest', 'celebrity'], 11),
('guest-complaint', 'Guest Complaint', 'Guest Experience', ARRAY['complaint', 'unhappy', 'issue', 'problem', 'upset'], 12),
('positive-feedback', 'Positive Feedback', 'Guest Experience', ARRAY['compliment', 'happy', 'loved', 'enjoyed', 'praised'], 13),
('special-occasion', 'Special Occasion', 'Guest Experience', ARRAY['birthday', 'anniversary', 'celebration', 'proposal'], 14),

-- Food & Beverage
('86-item', '86''d Item', 'Food & Beverage', ARRAY['86', 'out of', 'ran out', 'sold out'], 15),
('menu-feedback', 'Menu Feedback', 'Food & Beverage', ARRAY['menu', 'dish', 'recipe', 'taste'], 16),
('food-quality', 'Food Quality Issue', 'Food & Beverage', ARRAY['quality', 'temperature', 'overcooked', 'undercooked'], 17),
('beverage-issue', 'Beverage Issue', 'Food & Beverage', ARRAY['drink', 'cocktail', 'beer', 'wine', 'beverage'], 18),
('special-dietary', 'Special Dietary', 'Food & Beverage', ARRAY['allergy', 'gluten', 'vegan', 'dietary', 'restriction'], 19),

-- Operations & Maintenance
('equipment-issue', 'Equipment Issue', 'Operations & Maintenance', ARRAY['broken', 'not working', 'repair', 'maintenance', 'fix'], 20),
('cleaning-issue', 'Cleaning Issue', 'Operations & Maintenance', ARRAY['clean', 'dirty', 'sanitize', 'mess'], 21),
('inventory-concern', 'Inventory Concern', 'Operations & Maintenance', ARRAY['inventory', 'stock', 'order', 'delivery'], 22),
('safety-incident', 'Safety Incident', 'Operations & Maintenance', ARRAY['safety', 'accident', 'injury', 'incident', 'slip'], 23),

-- Financial
('cash-handling', 'Cash Handling', 'Financial', ARRAY['cash', 'drawer', 'till', 'shortage', 'overage'], 24),
('comp-issue', 'Comp/Discount', 'Financial', ARRAY['comp', 'discount', 'free', 'comped'], 25),

-- Administrative
('schedule-change', 'Schedule Change', 'Administrative', ARRAY['schedule', 'shift', 'coverage', 'swap'], 26),
('vendor-visit', 'Vendor Visit', 'Administrative', ARRAY['vendor', 'delivery', 'rep', 'salesperson'], 27),
('meeting-note', 'Meeting Note', 'Administrative', ARRAY['meeting', 'discussion', 'staff meeting'], 28),
('follow-up-needed', 'Follow-up Needed', 'Administrative', ARRAY['follow up', 'reminder', 'tomorrow', 'next shift'], 29);