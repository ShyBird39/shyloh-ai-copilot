-- Create function to check if user is super admin (eli@shybird.com)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = 'eli@shybird.com'
  )
$$;

-- Create function to check restaurant membership
CREATE OR REPLACE FUNCTION public.is_restaurant_member(_user_id uuid, _restaurant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_members
    WHERE user_id = _user_id
      AND restaurant_id = _restaurant_id
  )
$$;

-- Drop existing problematic policies on restaurant_members
DROP POLICY IF EXISTS "Users can view members of restaurants they belong to" ON public.restaurant_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.restaurant_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.restaurant_members;

-- Create new policies for restaurant_members
CREATE POLICY "Super admin or members can view restaurant members"
ON public.restaurant_members
FOR SELECT
USING (
  public.is_super_admin(auth.uid()) 
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);

CREATE POLICY "Super admin or owners/admins can insert members"
ON public.restaurant_members
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), restaurant_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

CREATE POLICY "Super admin or owners/admins can delete members"
ON public.restaurant_members
FOR DELETE
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), restaurant_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

-- Drop and recreate policies for user_roles
DROP POLICY IF EXISTS "Users can view roles for restaurants they belong to" ON public.user_roles;

CREATE POLICY "Super admin or members can view user roles"
ON public.user_roles
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);

-- Drop and recreate policies for restaurants
DROP POLICY IF EXISTS "Users can view restaurants they are members of" ON public.restaurants;
DROP POLICY IF EXISTS "Owners and admins can update restaurants" ON public.restaurants;

CREATE POLICY "Super admin or members can view restaurants"
ON public.restaurants
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), id)
);

CREATE POLICY "Super admin or owners/admins can update restaurants"
ON public.restaurants
FOR UPDATE
USING (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), id, 'owner'::app_role)
  OR public.has_role(auth.uid(), id, 'admin'::app_role)
);

-- Drop and recreate policies for restaurant_kpis
DROP POLICY IF EXISTS "Users can view KPIs for their restaurants" ON public.restaurant_kpis;

CREATE POLICY "Super admin or members can view KPIs"
ON public.restaurant_kpis
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);

-- Drop and recreate policies for restaurant_files
DROP POLICY IF EXISTS "Users can view files for their restaurants" ON public.restaurant_files;

CREATE POLICY "Super admin or members can view files"
ON public.restaurant_files
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);

-- Drop and recreate policies for restaurant_custom_knowledge
DROP POLICY IF EXISTS "Users can view custom knowledge for their restaurants" ON public.restaurant_custom_knowledge;

CREATE POLICY "Super admin or members can view custom knowledge"
ON public.restaurant_custom_knowledge
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);

-- Drop and recreate policies for chat_conversations
DROP POLICY IF EXISTS "Users can view conversations for their restaurants" ON public.chat_conversations;

CREATE POLICY "Super admin or members can view conversations"
ON public.chat_conversations
FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR public.is_restaurant_member(auth.uid(), restaurant_id)
);