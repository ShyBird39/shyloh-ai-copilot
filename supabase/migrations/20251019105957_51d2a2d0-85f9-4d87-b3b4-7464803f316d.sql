-- Create invitations table
CREATE TABLE public.restaurant_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  role app_role NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  UNIQUE(restaurant_id, email)
);

-- Enable RLS
ALTER TABLE public.restaurant_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for invitations
CREATE POLICY "Super admin or owners/admins can create invitations"
ON public.restaurant_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid()) OR 
  has_role(auth.uid(), restaurant_id, 'owner'::app_role) OR 
  has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

CREATE POLICY "Super admin or restaurant members can view invitations"
ON public.restaurant_invitations
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) OR 
  is_restaurant_member(auth.uid(), restaurant_id)
);

CREATE POLICY "Super admin or owners/admins can delete invitations"
ON public.restaurant_invitations
FOR DELETE
TO authenticated
USING (
  is_super_admin(auth.uid()) OR 
  has_role(auth.uid(), restaurant_id, 'owner'::app_role) OR 
  has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);

-- Function to accept invitation and add user to restaurant
CREATE OR REPLACE FUNCTION public.accept_invitation(_invitation_token uuid, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation record;
  _result jsonb;
BEGIN
  -- Get and validate invitation
  SELECT * INTO _invitation
  FROM public.restaurant_invitations
  WHERE invitation_token = _invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if user already exists in restaurant
  IF EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = _invitation.restaurant_id
      AND user_id = _user_id
  ) THEN
    -- Update invitation status
    UPDATE public.restaurant_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = _invitation.id;
    
    RETURN jsonb_build_object('success', true, 'restaurant_id', _invitation.restaurant_id);
  END IF;

  -- Add user to restaurant
  INSERT INTO public.restaurant_members (restaurant_id, user_id, invited_by)
  VALUES (_invitation.restaurant_id, _user_id, _invitation.invited_by);

  -- Assign role
  INSERT INTO public.user_roles (user_id, restaurant_id, role)
  VALUES (_user_id, _invitation.restaurant_id, _invitation.role);

  -- Update invitation status
  UPDATE public.restaurant_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = _invitation.id;

  RETURN jsonb_build_object('success', true, 'restaurant_id', _invitation.restaurant_id);
END;
$$;