-- Create restaurant_agents table
CREATE TABLE public.restaurant_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  name text NOT NULL,
  description text,
  url text NOT NULL,
  icon text DEFAULT 'Bot',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Super admin or members can view agents"
ON public.restaurant_agents
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);

CREATE POLICY "Super admin or owners/admins can insert agents"
ON public.restaurant_agents
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), restaurant_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

CREATE POLICY "Super admin or owners/admins can update agents"
ON public.restaurant_agents
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), restaurant_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

CREATE POLICY "Super admin or owners/admins can delete agents"
ON public.restaurant_agents
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), restaurant_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_agents_updated_at
BEFORE UPDATE ON public.restaurant_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the SBSB P&L Agent only for Shy Bird
INSERT INTO public.restaurant_agents (restaurant_id, name, description, url, icon, is_active)
VALUES (
  'SHY001',
  'SBSB P&L Agent',
  'AI-powered P&L analysis for Shy Bird',
  'https://chatgpt.com/g/g-68cc45772d2881918b1c95417c95d31f-sbsb-p-l-analyzer-fall-25',
  'Bot',
  true
);