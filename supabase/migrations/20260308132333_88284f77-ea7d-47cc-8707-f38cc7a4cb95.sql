
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Subscriptions table (per organization)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'trialing',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  razorpay_subscription_id text,
  razorpay_order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org users can view subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins can manage subscription"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_organization_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, status, trial_ends_at)
  VALUES (NEW.id, 'trialing', now() + interval '14 days');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION handle_new_organization_subscription();

INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
  ('Pro', 'Full access to all FoodPOS features', 999, 9999, '["Unlimited Orders", "All Reports", "Inventory Management", "Staff Scheduling", "Multi-table Support", "GST Reports", "Customer Loyalty", "Priority Support"]'::jsonb);
