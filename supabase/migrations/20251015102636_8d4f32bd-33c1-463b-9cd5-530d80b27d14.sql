-- Add INSERT policy for user_roles table
CREATE POLICY "Super admin or owners/admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.has_role(auth.uid(), restaurant_id, 'owner'::app_role)
  OR public.has_role(auth.uid(), restaurant_id, 'admin'::app_role)
);