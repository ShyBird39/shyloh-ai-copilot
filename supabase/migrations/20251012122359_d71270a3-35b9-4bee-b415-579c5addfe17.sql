-- Add INSERT policy to allow anyone to insert new restaurants
CREATE POLICY "Anyone can insert restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (true);