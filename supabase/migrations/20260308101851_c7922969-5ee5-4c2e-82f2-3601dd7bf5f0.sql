
-- Staff schedules table
CREATE TABLE public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  role text NOT NULL DEFAULT 'waiter',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org users can view schedules" ON public.staff_schedules
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

CREATE POLICY "Admins/managers can manage schedules" ON public.staff_schedules
  FOR ALL TO authenticated
  USING (
    organization_id = get_user_org_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- Add tax_type to organizations for GST/VAT toggle
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS tax_type text NOT NULL DEFAULT 'gst';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 0;

-- Add UPI ID to organizations for UPI payment QR
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS upi_id text;

-- Trigger for updated_at
CREATE TRIGGER update_staff_schedules_updated_at
  BEFORE UPDATE ON public.staff_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
