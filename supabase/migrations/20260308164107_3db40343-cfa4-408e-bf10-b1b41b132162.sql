-- Drop restrictive select policy and recreate as permissive so it works properly
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;

-- Permissive: anyone can see active plans
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true);

-- Permissive: admins can see ALL plans (including disabled)
CREATE POLICY "Admins can view all plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));