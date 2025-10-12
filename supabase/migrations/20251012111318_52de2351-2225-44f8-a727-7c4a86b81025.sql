-- Enable UPDATE operations on restaurants table
CREATE POLICY "Allow all users to update restaurants"
ON public.restaurants
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);