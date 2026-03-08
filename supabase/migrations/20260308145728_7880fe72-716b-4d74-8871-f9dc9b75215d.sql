
-- Drop existing RESTRICTIVE policies on subscriptions
DROP POLICY IF EXISTS "Admins can manage subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Org users can view subscription" ON public.subscriptions;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Org users can view subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins can manage subscription"
ON public.subscriptions
FOR ALL
TO authenticated
USING (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);
