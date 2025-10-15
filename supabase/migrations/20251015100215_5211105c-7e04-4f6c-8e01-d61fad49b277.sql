-- Phase 1: Database Foundation for Restaurant-Level User Management

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, restaurant_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create restaurant_members table for team management
CREATE TABLE public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  UNIQUE (restaurant_id, user_id)
);

-- Enable RLS on restaurant_members
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _restaurant_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND restaurant_id = _restaurant_id
      AND role = _role
  )
$$;

-- Create function to get user's role for a restaurant
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _restaurant_id TEXT)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND restaurant_id = _restaurant_id
  LIMIT 1
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles for restaurants they belong to"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members
      WHERE restaurant_members.user_id = auth.uid()
        AND restaurant_members.restaurant_id = user_roles.restaurant_id
    )
  );

-- RLS Policies for restaurant_members
CREATE POLICY "Users can view members of restaurants they belong to"
  ON public.restaurant_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members rm
      WHERE rm.user_id = auth.uid()
        AND rm.restaurant_id = restaurant_members.restaurant_id
    )
  );

CREATE POLICY "Owners and admins can insert members"
  ON public.restaurant_members FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), restaurant_id, 'owner') OR
    public.has_role(auth.uid(), restaurant_id, 'admin')
  );

CREATE POLICY "Owners and admins can delete members"
  ON public.restaurant_members FOR DELETE
  USING (
    public.has_role(auth.uid(), restaurant_id, 'owner') OR
    public.has_role(auth.uid(), restaurant_id, 'admin')
  );

-- Update RLS policies for existing tables to respect restaurant membership
CREATE POLICY "Users can view restaurants they are members of"
  ON public.restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members
      WHERE restaurant_members.user_id = auth.uid()
        AND restaurant_members.restaurant_id = restaurants.id
    )
  );

CREATE POLICY "Owners and admins can update restaurants"
  ON public.restaurants FOR UPDATE
  USING (
    public.has_role(auth.uid(), id, 'owner') OR
    public.has_role(auth.uid(), id, 'admin')
  );

-- Update existing policies for restaurant-related tables
CREATE POLICY "Users can view KPIs for their restaurants"
  ON public.restaurant_kpis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members
      WHERE restaurant_members.user_id = auth.uid()
        AND restaurant_members.restaurant_id = restaurant_kpis.restaurant_id
    )
  );

CREATE POLICY "Users can view files for their restaurants"
  ON public.restaurant_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members
      WHERE restaurant_members.user_id = auth.uid()
        AND restaurant_members.restaurant_id = restaurant_files.restaurant_id
    )
  );

CREATE POLICY "Users can view custom knowledge for their restaurants"
  ON public.restaurant_custom_knowledge FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members
      WHERE restaurant_members.user_id = auth.uid()
        AND restaurant_members.restaurant_id = restaurant_custom_knowledge.restaurant_id
    )
  );

CREATE POLICY "Users can view conversations for their restaurants"
  ON public.chat_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_members
      WHERE restaurant_members.user_id = auth.uid()
        AND restaurant_members.restaurant_id = chat_conversations.restaurant_id
    )
  );

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();