
-- Loyalty points table for customer loyalty program
CREATE TABLE public.loyalty_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  customer_name text,
  total_points integer NOT NULL DEFAULT 0,
  redeemed_points integer NOT NULL DEFAULT 0,
  total_visits integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, customer_phone)
);

-- Loyalty transactions log
CREATE TABLE public.loyalty_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points_earned integer NOT NULL DEFAULT 0,
  points_redeemed integer NOT NULL DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for loyalty_points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org users can view loyalty points"
  ON public.loyalty_points FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org staff can manage loyalty points"
  ON public.loyalty_points FOR ALL TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()))
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- RLS for loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org users can view loyalty transactions"
  ON public.loyalty_transactions FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Org staff can insert loyalty transactions"
  ON public.loyalty_transactions FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()));

-- Updated at trigger for loyalty_points
CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
